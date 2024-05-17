# DynamoDB as cache

A full serverless cache for DynamoDB that uses [ElectroDB](https://electrodb.dev/en/core-concepts/introduction/) under the hood for querying and TTL management.

## Prerequisites

- PNPM
- Docker (to run tests)

This library also requires a DynamoDB table to be created with the following required fields:

- `pk`: String (HASH key)
- `sk`: String (SORT key)
- `ttl`: Number (DynamoDB TTL field)

## Scripts

- `pnpm test`: Run all tests
- `pnpm build`: Build the lib for CJS and ESM

## Usage

Setup a DynamoDB table with the above fields (`pk`, `sk` and `ttl`). Then create an instance of the cache as follows:

```ts
const client = new DynamoDBClient();
// pass in the client, table name, namespace (optional) and TTL in seconds (optional)
const cache = new DynamoDBCache(client, 'cache-table-name', 'my-app-name', 60);
```

To set an item on the cache, use:

```ts
await cache.set('keyName', 'value');
```

To fetch an item, use:

```ts
const value = await cache.get('keyName');
```

The other methods are:

```ts
await cache.delete('keyName');

const isKeyPreset: boolean = await cache.has('keyName');

// clear all values from a namespace
await cache.clear('my-app-name');
```
