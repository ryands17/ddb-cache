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
