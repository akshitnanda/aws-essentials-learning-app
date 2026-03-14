function LabView({
  enableSnsLab,
  awsConnected,
  isDemoLab,
  awsCredentials,
  setAwsCredentials,
  labData,
  labLoading,
  labError,
  labNotice,
  newBucket,
  setNewBucket,
  amiId,
  setAmiId,
  instanceType,
  setInstanceType,
  launchCount,
  setLaunchCount,
  newTableName,
  setNewTableName,
  newTableKey,
  setNewTableKey,
  cliInput,
  setCliInput,
  cliOutput,
  snsTopicArn,
  setSnsTopicArn,
  snsMessage,
  setSnsMessage,
  onStartDemo,
  onConnect,
  onDisconnect,
  onCreateBucket,
  onDeleteBucket,
  onStartInstance,
  onLaunchInstance,
  onTerminateInstance,
  onCreateTable,
  onRunCli,
  onSendSns,
  launching
}) {
  return (
    <section className="lab-section">
      <h2>AWS Hands-On Lab</h2>
      <p>Explore AWS workflows with a safe local demo mode, or connect a real account when you want live calls.</p>

      {!awsConnected ? (
        <div className="credentials-form">
          <div className="lab-mode-banner">
            <div>
              <h3>Start in Demo Mode</h3>
              <p>Use mock buckets, instances, and tables so anyone can try the app without real AWS credentials.</p>
            </div>
            <button type="button" onClick={onStartDemo} className="secondary-btn">Start Demo Mode</button>
          </div>

          <h3>Connect AWS Account</h3>
          <div className="form-group">
            <label>Security note:</label>
            <p className="security-warning">
              Credentials are kept in browser memory only. For production, use temporary
              credentials (STS) or IAM roles with least privilege.
            </p>
          </div>
          <div className="form-group">
            <label>AWS Access Key ID:</label>
            <input
              type="password"
              value={awsCredentials.accessKey}
              onChange={(e) => setAwsCredentials({ ...awsCredentials, accessKey: e.target.value })}
              placeholder="AKIA..."
            />
          </div>
          <div className="form-group">
            <label>AWS Secret Access Key:</label>
            <input
              type="password"
              value={awsCredentials.secretKey}
              onChange={(e) => setAwsCredentials({ ...awsCredentials, secretKey: e.target.value })}
              placeholder="Your secret key"
            />
          </div>
          <div className="form-group">
            <label>AWS Region:</label>
            <select
              value={awsCredentials.region}
              onChange={(e) => setAwsCredentials({ ...awsCredentials, region: e.target.value })}
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </div>
          {labError && <div className="error-message">{labError}</div>}
          <button onClick={onConnect} disabled={labLoading} className="connect-btn">
            {labLoading ? 'Connecting...' : 'Connect Account'}
          </button>
        </div>
      ) : (
        <div className="lab-connected">
          {isDemoLab && (
            <div className="info-message">
              Demo mode is active. Actions update local mock data only and never contact AWS.
            </div>
          )}
          {labNotice && <div className="success-message">{labNotice}</div>}
          {labError && <div className="error-message">{labError}</div>}
          <div className="connection-status">
            <h3>{isDemoLab ? 'Demo workspace ready' : `Connected to ${awsCredentials.region}`}</h3>
            <button onClick={onDisconnect} className="disconnect-btn">
              {isDemoLab ? 'Exit Demo' : 'Disconnect'}
            </button>
          </div>

          <div className="lab-resources">
            <div className="resource-section">
              <h4>S3 Buckets ({labData.s3Buckets.length})</h4>
              {labData.s3Buckets.length > 0 ? (
                <ul className="resource-list">
                  {labData.s3Buckets.map((bucket) => (
                    <li key={bucket.Name}>
                      {bucket.Name}
                      <button className="small-btn" onClick={() => onDeleteBucket(bucket.Name)}>Delete</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No S3 buckets found</p>
              )}
              <div className="action-form">
                <input
                  placeholder="New bucket name"
                  value={newBucket}
                  onChange={(e) => setNewBucket(e.target.value)}
                />
                <button onClick={onCreateBucket} disabled={labLoading || !newBucket}>Create Bucket</button>
              </div>
            </div>

            <div className="resource-section">
              <h4>EC2 Instances ({labData.ec2Instances.length})</h4>
              {labData.ec2Instances.length > 0 ? (
                <ul className="resource-list">
                  {labData.ec2Instances.map((instance) => (
                    <li key={instance.instanceId}>
                      {instance.instanceId} ({instance.type}) - {instance.state}
                      {instance.state === 'stopped' && (
                        <button className="small-btn" onClick={() => onStartInstance(instance.instanceId)}>Start</button>
                      )}
                      <button className="small-btn" onClick={() => onTerminateInstance(instance.instanceId)}>Terminate</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No EC2 instances found</p>
              )}
              <div className="action-form">
                <input placeholder="AMI ID" value={amiId} onChange={(e) => setAmiId(e.target.value)} />
                <input placeholder="Instance type" value={instanceType} onChange={(e) => setInstanceType(e.target.value)} />
                <input
                  type="number"
                  min="1"
                  value={launchCount}
                  onChange={(e) => setLaunchCount(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '60px' }}
                />
                <button onClick={onLaunchInstance} disabled={labLoading || launching}>
                  {launching ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </div>

            <div className="resource-section">
              <h4>DynamoDB Tables ({labData.dynamoTables.length})</h4>
              {labData.dynamoTables.length > 0 ? (
                <ul className="resource-list">
                  {labData.dynamoTables.map((table) => (
                    <li key={table}>{table}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No DynamoDB tables found</p>
              )}
              <div className="action-form">
                <input
                  placeholder="Table name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
                <input
                  placeholder="Primary key name"
                  value={newTableKey}
                  onChange={(e) => setNewTableKey(e.target.value)}
                />
                <button onClick={onCreateTable} disabled={labLoading || !newTableName}>Create Table</button>
              </div>
            </div>

            {enableSnsLab && (
              <div className="resource-section">
                <h4>SNS Publish</h4>
                <div className="action-form">
                  <input
                    placeholder="Topic ARN"
                    value={snsTopicArn}
                    onChange={(e) => setSnsTopicArn(e.target.value)}
                  />
                  <input
                    placeholder="Message"
                    value={snsMessage}
                    onChange={(e) => setSnsMessage(e.target.value)}
                  />
                  <button onClick={onSendSns} disabled={labLoading || !snsTopicArn || !snsMessage}>Send</button>
                </div>
              </div>
            )}

            <div className="resource-section">
              <h4>AWS CLI (simple parser)</h4>
              <div className="action-form">
                <input
                  placeholder="aws s3 ls"
                  value={cliInput}
                  onChange={(e) => setCliInput(e.target.value)}
                  style={{ width: '60%' }}
                />
                <button onClick={onRunCli} className="small-btn">Run</button>
              </div>
              <pre className="cli-output">{cliOutput}</pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default LabView;
