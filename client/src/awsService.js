import { S3Client, ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand, StartInstancesCommand } from '@aws-sdk/client-ec2';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

class AWSService {
  constructor() {
    this.credentials = null;
    this.region = 'us-east-1';
    this.s3Client = null;
    this.ec2Client = null;
    this.dynamodbClient = null;
    this.snsClient = null;
  }

  setCredentials(accessKeyId, secretAccessKey, region = 'us-east-1') {
    this.credentials = { accessKeyId, secretAccessKey };
    this.region = region;

    const sharedConfig = {
      region: this.region,
      credentials: this.credentials
    };

    this.s3Client = new S3Client(sharedConfig);
    this.ec2Client = new EC2Client(sharedConfig);
    this.dynamodbClient = new DynamoDBClient(sharedConfig);
    this.snsClient = new SNSClient(sharedConfig);

    return true;
  }

  hasCredentials() {
    return this.credentials !== null;
  }

  async listBuckets() {
    if (!this.s3Client) throw new Error('AWS credentials not configured');
    try {
      const response = await this.s3Client.send(new ListBucketsCommand({}));
      return response.Buckets || [];
    } catch (error) {
      throw new Error(`S3 ListBuckets failed: ${error.message}`);
    }
  }

  async createBucket(bucketName) {
    if (!this.s3Client) throw new Error('AWS credentials not configured');
    try {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      throw new Error(`CreateBucket failed: ${error.message}`);
    }
  }

  async deleteBucket(bucketName) {
    if (!this.s3Client) throw new Error('AWS credentials not configured');
    try {
      await this.s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error) {
      throw new Error(`DeleteBucket failed: ${error.message}`);
    }
  }

  async describeInstances() {
    if (!this.ec2Client) throw new Error('AWS credentials not configured');
    try {
      const response = await this.ec2Client.send(new DescribeInstancesCommand({}));
      const instances = [];

      response.Reservations?.forEach((reservation) => {
        reservation.Instances?.forEach((instance) => {
          instances.push({
            instanceId: instance.InstanceId,
            state: instance.State?.Name,
            type: instance.InstanceType,
            launchTime: instance.LaunchTime
          });
        });
      });

      return instances;
    } catch (error) {
      throw new Error(`EC2 DescribeInstances failed: ${error.message}`);
    }
  }

  async runInstance(params) {
    if (!this.ec2Client) throw new Error('AWS credentials not configured');
    try {
      const response = await this.ec2Client.send(new RunInstancesCommand(params));
      return response.Instances || [];
    } catch (error) {
      throw new Error(`RunInstances failed: ${error.message}`);
    }
  }

  async terminateInstance(instanceId) {
    if (!this.ec2Client) throw new Error('AWS credentials not configured');
    try {
      const response = await this.ec2Client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
      return response.TerminatingInstances || [];
    } catch (error) {
      throw new Error(`TerminateInstances failed: ${error.message}`);
    }
  }

  async startInstance(instanceId) {
    if (!this.ec2Client) throw new Error('AWS credentials not configured');
    try {
      const response = await this.ec2Client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
      return response.StartingInstances || [];
    } catch (error) {
      throw new Error(`StartInstances failed: ${error.message}`);
    }
  }

  async listTables() {
    if (!this.dynamodbClient) throw new Error('AWS credentials not configured');
    try {
      const response = await this.dynamodbClient.send(new ListTablesCommand({ Limit: 100 }));
      return response.TableNames || [];
    } catch (error) {
      throw new Error(`DynamoDB ListTables failed: ${error.message}`);
    }
  }

  async createTable(params) {
    if (!this.dynamodbClient) throw new Error('AWS credentials not configured');
    try {
      const response = await this.dynamodbClient.send(new CreateTableCommand(params));
      return response.TableDescription;
    } catch (error) {
      throw new Error(`CreateTable failed: ${error.message}`);
    }
  }

  async publishMessage(topicArn, message) {
    if (!this.snsClient) throw new Error('AWS credentials not configured');
    try {
      const response = await this.snsClient.send(new PublishCommand({ TopicArn: topicArn, Message: message }));
      return response.MessageId;
    } catch (error) {
      throw new Error(`SNS Publish failed: ${error.message}`);
    }
  }

  async runAwsCli(input) {
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) return 'no command';

    if (parts[0] === 'aws') {
      if (parts[1] === 's3' && parts[2] === 'ls') {
        const buckets = await this.listBuckets();
        return buckets.map((bucket) => bucket.Name).join('\n');
      }

      if (parts[1] === 'ec2' && parts[2] === 'describe-instances') {
        const instances = await this.describeInstances();
        return JSON.stringify(instances, null, 2);
      }

      if (parts[1] === 'ec2' && parts[2] === 'run-instances') {
        const params = {
          ImageId: 'ami-0c94855ba95c71c99',
          MinCount: 1,
          MaxCount: 1,
          InstanceType: 't2.micro'
        };
        const instances = await this.runInstance(params);
        return JSON.stringify(instances, null, 2);
      }
    }

    return `command not supported: ${input}`;
  }

  clearCredentials() {
    this.credentials = null;
    this.s3Client = null;
    this.ec2Client = null;
    this.dynamodbClient = null;
    this.snsClient = null;
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new AWSService();
