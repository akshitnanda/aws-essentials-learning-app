import { useState, useEffect } from 'react';
import './App.css';
import awsService from './awsService';
import AppHeader from './components/AppHeader';
import { createDemoInstances, createDemoLabState, runDemoAwsCli } from './demoLabData';
import HomeView from './views/HomeView';
import LessonsView from './views/LessonsView';
import LessonDetailView from './views/LessonDetailView';
import LabView from './views/LabView';
import ProgressView from './views/ProgressView';

const ENABLE_SNS_LAB = process.env.REACT_APP_ENABLE_SNS_LAB === 'true';
const STATIC_DEMO = process.env.REACT_APP_STATIC_DEMO === 'true';
const EMPTY_LAB_DATA = { s3Buckets: [], ec2Instances: [], dynamoTables: [] };
const PROGRESS_STORAGE_KEY = 'aws-learn-progress';

function getPublicAssetUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = process.env.PUBLIC_URL || '';

  if (!basePath || basePath === '/') {
    return normalizedPath;
  }

  return `${basePath.replace(/\/$/, '')}${normalizedPath}`;
}

async function loadLessonsData() {
  const staticUrl = getPublicAssetUrl('/demo-data/lessons.json');

  if (STATIC_DEMO) {
    const response = await fetch(staticUrl);
    return response.json();
  }

  try {
    const response = await fetch('/api/lessons');
    return await response.json();
  } catch (error) {
    const fallbackResponse = await fetch(staticUrl);
    return fallbackResponse.json();
  }
}

async function loadQuizzesData(lessonId) {
  const staticUrl = getPublicAssetUrl('/demo-data/quizzes.json');

  if (STATIC_DEMO) {
    const response = await fetch(staticUrl);
    const quizzes = await response.json();
    return quizzes.filter((quiz) => quiz.lessonId === lessonId);
  }

  try {
    const response = await fetch(`/api/quizzes?lessonId=${lessonId}`);
    return await response.json();
  } catch (error) {
    const fallbackResponse = await fetch(staticUrl);
    const quizzes = await fallbackResponse.json();
    return quizzes.filter((quiz) => quiz.lessonId === lessonId);
  }
}

function buildQuizState(quizzes) {
  const initialState = {};

  quizzes.forEach((quiz) => {
    if (quiz.type === 'multi') {
      initialState[quiz.id] = { answered: false, selected: [], isCorrect: false };
    } else if (quiz.type === 'drag') {
      initialState[quiz.id] = {
        answered: false,
        selectedOrder: [...quiz.options],
        isCorrect: false
      };
    } else {
      initialState[quiz.id] = { answered: false, selected: null, isCorrect: false };
    }
  });

  return initialState;
}

function App() {
  const [view, setView] = useState('home');
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState('');
  const [filterPath, setFilterPath] = useState('All');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [quizState, setQuizState] = useState({});
  const [progress, setProgress] = useState(() => {
    try {
      if (typeof window === 'undefined') {
        return {};
      }
      const stored = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  });

  const [awsCredentials, setAwsCredentials] = useState({ accessKey: '', secretKey: '', region: 'us-east-1' });
  const [labMode, setLabMode] = useState(null);
  const [labData, setLabData] = useState(EMPTY_LAB_DATA);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState(null);
  const [labNotice, setLabNotice] = useState('');
  const [newBucket, setNewBucket] = useState('');
  const [amiId, setAmiId] = useState('ami-0c94855ba95c71c99');
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [launchCount, setLaunchCount] = useState(1);
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState('');
  const [launching, setLaunching] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableKey, setNewTableKey] = useState('id');
  const [snsTopicArn, setSnsTopicArn] = useState('');
  const [snsMessage, setSnsMessage] = useState('');

  const awsConnected = labMode === 'demo' || labMode === 'live';
  const isDemoLab = labMode === 'demo';

  useEffect(() => {
    let isMounted = true;

    setLessonsLoading(true);
    setLessonsError('');

    loadLessonsData()
      .then((data) => {
        if (!isMounted) return;
        const sortedLessons = [...data].sort((a, b) => a.day - b.day);
        setLessons(sortedLessons);
      })
      .catch((error) => {
        console.error('Failed to load lessons', error);
        if (isMounted) {
          setLessonsError('Unable to load lessons right now. Start the server and refresh to continue.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLessonsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  const resetLabMessages = () => {
    setLabError(null);
    setLabNotice('');
  };

  const refreshLabData = async () => {
    if (isDemoLab) return;
    if (!awsService.hasCredentials()) return;

    try {
      const [s3Buckets, ec2Instances, dynamoTables] = await Promise.all([
        awsService.listBuckets(),
        awsService.describeInstances(),
        awsService.listTables()
      ]);

      setLabData({ s3Buckets, ec2Instances, dynamoTables });
    } catch (error) {
      setLabError(error.message);
    }
  };

  const handleStartDemoLab = () => {
    resetLabMessages();
    setLabMode('demo');
    setLabData(createDemoLabState());
    setCliOutput('Demo lab ready. Try "aws s3 ls" or "aws ec2 describe-instances".');
  };

  const handleAwsConnect = async () => {
    if (!awsCredentials.accessKey || !awsCredentials.secretKey) {
      setLabError('Please enter AWS credentials');
      return;
    }

    try {
      setLabLoading(true);
      resetLabMessages();

      awsService.setCredentials(awsCredentials.accessKey, awsCredentials.secretKey, awsCredentials.region);
      await refreshLabData();

      setLabMode('live');
      setLabNotice(`Connected to live AWS resources in ${awsCredentials.region}.`);
    } catch (error) {
      setLabError(error.message);
      setLabMode(null);
    } finally {
      setLabLoading(false);
    }
  };

  const handleAwsDisconnect = () => {
    awsService.clearCredentials();
    setLabMode(null);
    setLabData(EMPTY_LAB_DATA);
    setAwsCredentials({ accessKey: '', secretKey: '', region: 'us-east-1' });
    setCliOutput('');
    resetLabMessages();
  };

  const handleCreateBucket = async () => {
    if (!newBucket) return;

    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        const bucketAlreadyExists = labData.s3Buckets.some((bucket) => bucket.Name === newBucket);
        if (bucketAlreadyExists) {
          throw new Error('Demo bucket names must be unique.');
        }

        setLabData((previousState) => ({
          ...previousState,
          s3Buckets: [...previousState.s3Buckets, { Name: newBucket }]
        }));
        setLabNotice(`Created demo bucket "${newBucket}".`);
        setNewBucket('');
        return;
      }

      await awsService.createBucket(newBucket);
      setNewBucket('');
      await refreshLabData();
      setLabNotice(`Created bucket "${newBucket}".`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleDeleteBucket = async (bucketName) => {
    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        setLabData((previousState) => ({
          ...previousState,
          s3Buckets: previousState.s3Buckets.filter((bucket) => bucket.Name !== bucketName)
        }));
        setLabNotice(`Deleted demo bucket "${bucketName}".`);
        return;
      }

      await awsService.deleteBucket(bucketName);
      await refreshLabData();
      setLabNotice(`Deleted bucket "${bucketName}".`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleStartInstance = async (instanceId) => {
    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        setLabData((previousState) => ({
          ...previousState,
          ec2Instances: previousState.ec2Instances.map((instance) => (
            instance.instanceId === instanceId
              ? { ...instance, state: 'running' }
              : instance
          ))
        }));
        setLabNotice(`Started demo instance "${instanceId}".`);
        return;
      }

      await awsService.startInstance(instanceId);
      await refreshLabData();
      setLabNotice(`Started instance "${instanceId}".`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleLaunchInstance = async () => {
    setLaunching(true);
    setLabLoading(true);
    resetLabMessages();

    try {
      if (isDemoLab) {
        const newInstances = createDemoInstances(instanceType, launchCount);
        setLabData((previousState) => ({
          ...previousState,
          ec2Instances: [...newInstances, ...previousState.ec2Instances]
        }));
        setLabNotice(`Launched ${launchCount} demo instance${launchCount > 1 ? 's' : ''}.`);
        return;
      }

      await awsService.runInstance({
        ImageId: amiId,
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: launchCount
      });

      await refreshLabData();
      setLabNotice(`Launched ${launchCount} instance${launchCount > 1 ? 's' : ''}.`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLaunching(false);
      setLabLoading(false);
    }
  };

  const handleTerminateInstance = async (instanceId) => {
    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        setLabData((previousState) => ({
          ...previousState,
          ec2Instances: previousState.ec2Instances.filter((instance) => instance.instanceId !== instanceId)
        }));
        setLabNotice(`Terminated demo instance "${instanceId}".`);
        return;
      }

      await awsService.terminateInstance(instanceId);
      await refreshLabData();
      setLabNotice(`Terminated instance "${instanceId}".`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableName) return;

    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        const tableExists = labData.dynamoTables.includes(newTableName);
        if (tableExists) {
          throw new Error('Demo table names must be unique.');
        }

        setLabData((previousState) => ({
          ...previousState,
          dynamoTables: [...previousState.dynamoTables, newTableName]
        }));
        setLabNotice(`Created demo DynamoDB table "${newTableName}".`);
        setNewTableName('');
        setNewTableKey('id');
        return;
      }

      await awsService.createTable({
        TableName: newTableName,
        AttributeDefinitions: [{ AttributeName: newTableKey, AttributeType: 'S' }],
        KeySchema: [{ AttributeName: newTableKey, KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST'
      });

      setNewTableName('');
      setNewTableKey('id');
      await refreshLabData();
      setLabNotice(`Created DynamoDB table "${newTableName}".`);
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleSendSns = async () => {
    if (!ENABLE_SNS_LAB) return;
    if (!snsTopicArn || !snsMessage) return;

    setLabLoading(true);
    resetLabMessages();
    try {
      if (isDemoLab) {
        setCliOutput(`demo sns publish -> ${snsTopicArn}\n${snsMessage}`);
        setLabNotice('Published demo SNS message.');
        setSnsMessage('');
        return;
      }

      await awsService.publishMessage(snsTopicArn, snsMessage);
      setSnsMessage('');
      setLabNotice('Published SNS message.');
    } catch (error) {
      setLabError(error.message);
    } finally {
      setLabLoading(false);
    }
  };

  const handleCliRun = async () => {
    try {
      const output = isDemoLab
        ? runDemoAwsCli(cliInput, labData)
        : await awsService.runAwsCli(cliInput);
      setCliOutput(output);
    } catch (error) {
      setCliOutput(`error: ${error.message}`);
    }
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setView('lesson');
    setQuizLoading(true);
    setQuizError('');

    loadQuizzesData(lesson.id)
      .then((data) => {
        setQuizzes(data);
        setQuizState(buildQuizState(data));
      })
      .catch((error) => {
        console.error('Failed to load quizzes', error);
        setQuizzes([]);
        setQuizState({});
        setQuizError('Unable to load quiz questions for this lesson right now.');
      })
      .finally(() => {
        setQuizLoading(false);
      });
  };

  const handleAnswerSelect = (quizId, selected) => {
    const quiz = quizzes.find((item) => item.id === quizId);
    if (!quiz || quiz.type === 'multi' || quiz.type === 'drag') return;

    const isCorrect = selected === quiz.answer;
    setQuizState((previousState) => ({
      ...previousState,
      [quizId]: { ...previousState[quizId], answered: true, selected, isCorrect }
    }));

    if (isCorrect && selectedLesson) {
      setProgress((previousState) => ({ ...previousState, [selectedLesson.id]: true }));
    }
  };

  const handleMultiToggle = (quizId, option) => {
    setQuizState((previousState) => {
      const current = previousState[quizId];
      const hasOption = current.selected.includes(option);
      const nextSelected = hasOption
        ? current.selected.filter((selectedOption) => selectedOption !== option)
        : [...current.selected, option];

      return {
        ...previousState,
        [quizId]: { ...current, selected: nextSelected }
      };
    });
  };

  const handleMultiSubmit = (quizId) => {
    const quiz = quizzes.find((item) => item.id === quizId);
    if (!quiz) return;

    const selected = quizState[quizId].selected;
    const correctAnswers = quiz.correctAnswers || [];
    const correctSet = new Set(correctAnswers);
    const isCorrect = selected.length === correctAnswers.length && selected.every((option) => correctSet.has(option));

    setQuizState((previousState) => ({
      ...previousState,
      [quizId]: { ...previousState[quizId], answered: true, isCorrect }
    }));

    if (isCorrect && selectedLesson) {
      setProgress((previousState) => ({ ...previousState, [selectedLesson.id]: true }));
    }
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData('text/plain', index);
  };

  const handleDrop = (event, quizId, targetIndex) => {
    event.preventDefault();
    const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'), 10);

    setQuizState((previousState) => {
      const current = previousState[quizId];
      const nextOrder = [...current.selectedOrder];
      const [item] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, item);

      return {
        ...previousState,
        [quizId]: { ...current, selectedOrder: nextOrder }
      };
    });
  };

  const handleAllowDrop = (event) => {
    event.preventDefault();
  };

  const handleGradeDrag = (quizId) => {
    const quiz = quizzes.find((item) => item.id === quizId);
    const state = quizState[quizId];
    if (!quiz || !state || !state.selectedOrder) return;

    const isCorrect = state.selectedOrder.join(',') === (quiz.correctOrder || []).join(',');

    setQuizState((previousState) => ({
      ...previousState,
      [quizId]: { ...previousState[quizId], answered: true, isCorrect }
    }));

    if (isCorrect && selectedLesson) {
      setProgress((previousState) => ({ ...previousState, [selectedLesson.id]: true }));
    }
  };

  const completedLessons = lessons.filter((lesson) => progress[lesson.id]);
  const completionRate = lessons.length > 0
    ? Math.round((completedLessons.length / lessons.length) * 100)
    : 0;
  const recommendedLesson = lessons
    .filter((lesson) => !progress[lesson.id])
    .sort((a, b) => a.day - b.day)[0] || lessons[0] || null;

  const paths = ['All', ...new Set(lessons.map((lesson) => lesson.path).filter(Boolean))];

  return (
    <div className="App">
      <AppHeader
        view={view}
        onNavigate={setView}
        lessonsCount={lessons.length}
        completionRate={completionRate}
      />

      <main className="main-content">
        {view === 'home' && (
          <HomeView
            lessonsCount={lessons.length}
            lessonsLoading={lessonsLoading}
            completionRate={completionRate}
            pathCount={Math.max(paths.length - 1, 0)}
            onBeginLearning={() => setView('lessons')}
            onOpenLab={() => setView('lab')}
          />
        )}

        {view === 'lessons' && (
          <LessonsView
            lessons={lessons}
            lessonsLoading={lessonsLoading}
            lessonsError={lessonsError}
            filterPath={filterPath}
            paths={paths}
            progress={progress}
            recommendedLessonId={recommendedLesson?.id}
            onFilterPathChange={setFilterPath}
            onSelectLesson={handleLessonClick}
          />
        )}

        {view === 'lesson' && selectedLesson && (
          <LessonDetailView
            selectedLesson={selectedLesson}
            lessons={lessons}
            quizzes={quizzes}
            quizLoading={quizLoading}
            quizError={quizError}
            quizState={quizState}
            onGoHome={() => setView('home')}
            onBackToLessons={() => setView('lessons')}
            onSelectLesson={handleLessonClick}
            onFilterPathSelect={(path) => {
              setFilterPath(path);
              setView('lessons');
            }}
            onAnswerSingle={handleAnswerSelect}
            onMultiToggle={handleMultiToggle}
            onMultiSubmit={handleMultiSubmit}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onAllowDrop={handleAllowDrop}
            onGradeDrag={handleGradeDrag}
          />
        )}

        {view === 'lab' && (
          <LabView
            enableSnsLab={ENABLE_SNS_LAB}
            awsConnected={awsConnected}
            isDemoLab={isDemoLab}
            awsCredentials={awsCredentials}
            setAwsCredentials={setAwsCredentials}
            labData={labData}
            labLoading={labLoading}
            labError={labError}
            labNotice={labNotice}
            newBucket={newBucket}
            setNewBucket={setNewBucket}
            amiId={amiId}
            setAmiId={setAmiId}
            instanceType={instanceType}
            setInstanceType={setInstanceType}
            launchCount={launchCount}
            setLaunchCount={setLaunchCount}
            newTableName={newTableName}
            setNewTableName={setNewTableName}
            newTableKey={newTableKey}
            setNewTableKey={setNewTableKey}
            cliInput={cliInput}
            setCliInput={setCliInput}
            cliOutput={cliOutput}
            snsTopicArn={snsTopicArn}
            setSnsTopicArn={setSnsTopicArn}
            snsMessage={snsMessage}
            setSnsMessage={setSnsMessage}
            onStartDemo={handleStartDemoLab}
            onConnect={handleAwsConnect}
            onDisconnect={handleAwsDisconnect}
            onCreateBucket={handleCreateBucket}
            onDeleteBucket={handleDeleteBucket}
            onStartInstance={handleStartInstance}
            onLaunchInstance={handleLaunchInstance}
            onTerminateInstance={handleTerminateInstance}
            onCreateTable={handleCreateTable}
            onRunCli={handleCliRun}
            onSendSns={handleSendSns}
            launching={launching}
          />
        )}

        {view === 'progress' && (
          <ProgressView
            lessons={lessons}
            progress={progress}
            completionRate={completionRate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
