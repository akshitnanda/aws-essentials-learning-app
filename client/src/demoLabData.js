const DEMO_INSTANCE_PREFIX = 'i-demo-';

export function createDemoLabState() {
  return {
    s3Buckets: [
      { Name: 'demo-aws-learn-assets' },
      { Name: 'demo-aws-learn-logs' }
    ],
    ec2Instances: [
      {
        instanceId: `${DEMO_INSTANCE_PREFIX}001`,
        state: 'running',
        type: 't3.micro',
        launchTime: '2026-03-10T14:30:00.000Z'
      },
      {
        instanceId: `${DEMO_INSTANCE_PREFIX}002`,
        state: 'stopped',
        type: 't3.small',
        launchTime: '2026-03-11T09:15:00.000Z'
      }
    ],
    dynamoTables: ['demo-progress', 'demo-flashcards']
  };
}

export function createDemoInstances(instanceType, launchCount) {
  return Array.from({ length: launchCount }, (_, index) => ({
    instanceId: `${DEMO_INSTANCE_PREFIX}${Date.now().toString().slice(-6)}${index + 1}`,
    state: 'running',
    type: instanceType,
    launchTime: new Date().toISOString()
  }));
}

export function runDemoAwsCli(input, labData) {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return 'no command';
  }

  if (normalized === 'aws s3 ls') {
    return labData.s3Buckets.map((bucket) => bucket.Name).join('\n') || 'No buckets found';
  }

  if (normalized === 'aws ec2 describe-instances') {
    return JSON.stringify(labData.ec2Instances, null, 2);
  }

  if (normalized === 'aws dynamodb list-tables') {
    return JSON.stringify({ TableNames: labData.dynamoTables }, null, 2);
  }

  return [
    `command not supported in demo mode: ${input}`,
    'Try one of:',
    'aws s3 ls',
    'aws ec2 describe-instances',
    'aws dynamodb list-tables'
  ].join('\n');
}
