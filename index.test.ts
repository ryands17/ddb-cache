import {
  afterAll,
  beforeAll,
  beforeEach,
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import {
  LocalstackContainer,
  type StartedLocalStackContainer,
} from '@testcontainers/localstack';
import {
  DynamoDB,
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBCache } from '.';

let container: StartedLocalStackContainer;
let client: DynamoDBClient;
let cache: DynamoDBCache;

const tableName = 'test-cache-table';
const REGION = 'eu-west-1';
const CACHE_TTL = 60;

beforeAll(async () => {
  container = await new LocalstackContainer().start();
  client = new DynamoDBClient({
    endpoint: container.getConnectionUri(),
    region: REGION,
  });

  const ddb = new DynamoDB({
    endpoint: container.getConnectionUri(),
    region: REGION,
  });
  const createTable = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  });

  const updateTTl = new UpdateTimeToLiveCommand({
    TableName: tableName,
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true,
    },
  });

  await ddb.send(createTable);
  await ddb.send(updateTTl);

  cache = new DynamoDBCache(client, tableName, 'default', CACHE_TTL);
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await container.stop();
});

test('set a value in the cache', async () => {
  await cache.set('key1', 'value1');
});

test('check if the value is fetched from the cache', async () => {
  const value = await cache.get('key1');
  expect(value).toEqual('value1');
});

test('delete value from cache', async () => {
  await cache.delete('key1');
});

test('the deleted value should not exist', async () => {
  const value = await cache.get('key1');
  expect(value).toBeUndefined();
});

test('Cached value should not be available after TTL', async () => {
  await cache.set('key2', 'value2');

  vi.advanceTimersByTime(CACHE_TTL * 1000);

  const value = await cache.get('key2');
  expect(value).toBeUndefined();
});

test('The `has` method returns true for existing keys in the cache', async () => {
  await cache.set('key3', 'value3');
  expect(await cache.has('key3')).toBeTruthy();
});

test('Check if all items in the namespace are cleared', async () => {
  const items = [
    { key: 'key1', value: 'value1' },
    { key: 'key2', value: 'value2' },
    { key: 'key3', value: 'value3' },
  ];

  for (let item of items) {
    await cache.set(item.key, item.value);
  }

  await cache.clear();

  for (let item of items) {
    const value = await cache.get(item.key);
    expect(value).toBeUndefined();
  }
});
