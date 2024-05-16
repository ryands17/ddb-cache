import { Entity } from 'electrodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const DEFAULT_NAMESPACE = 'default';

const cacheModel = new Entity({
  model: { entity: 'cache', version: '1', service: 'cache-manager' },
  attributes: {
    namespace: { type: 'string', default: DEFAULT_NAMESPACE },
    key: { type: 'string', required: true },
    value: { type: 'string', required: true },
    ttl: { type: 'number' },
  },
  indexes: {
    fetchFromApp: {
      pk: { field: 'pk', composite: ['namespace'] },
      sk: { field: 'sk', composite: ['key'] },
    },
  },
});

/**
 * Create a cache manager that uses DynamoDB under the hood to store key/value pairs.
 * Pass in the table name, namespace and ttl (optional) in seconds for automatic expiration.
 * Currently only supports strings as values.
 * @example
 * ```ts
 * const client = new DynamoDBClient()
 * const cache = new DynamoDBCache(client, 'cache-table-name', 'my-app-name', 60)
 * ```
 */
export class DynamoDBCache {
  constructor(
    client: DynamoDBClient,
    tableName: string,
    private namespace: string = DEFAULT_NAMESPACE,
    private ttl?: number,
  ) {
    cacheModel.setClient(client);
    cacheModel.setTableName(tableName);
  }

  /**
   * @returns A number with the current epoch time in seconds
   */
  private getCurrentEpochInSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * @param key - The key of the cached item
   * @returns A promise of the value if exists else undefined
   * @example
   * ```ts
   * const item = await cache.get('my-key')
   * console.log({ item })
   * ```
   */
  async get(key: string): Promise<string | undefined> {
    const currentTime = this.getCurrentEpochInSeconds();

    const { data } = await cacheModel.query
      .fetchFromApp({ namespace: this.namespace, key })
      .where(({ ttl }, op) => op.gt(ttl, currentTime))
      .go();

    return data[0]?.value;
  }

  /**
   * Sets an item in the cache (key/value pair)
   * @param key - The key to store the cache item
   * @param value - The actual value of the item
   * @param ttl - A custom TTL in seconds to expire
   * @example
   * ```ts
   * await set('key', 'value', 60)
   * ```
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    let expiresAt = ttl || this.ttl;
    if (typeof expiresAt === 'number') {
      expiresAt = expiresAt + this.getCurrentEpochInSeconds();
    }

    await cacheModel
      .put({ namespace: this.namespace, key, value, ttl: expiresAt })
      .go();
  }

  /**
   * Deletes the item from the cache
   * @param key - Key of the cached item to delete
   * @returns true if the item was deleted, false otherwise
   * @example
   * ```ts
   * const result = await delete('key')
   * ```
   */
  async delete(key: string): Promise<void> {
    await cacheModel
      .delete({ namespace: this.namespace, key })
      .go({ response: 'all_old' });
  }

  /**
   * Clears all cached values in the given namespace
   * @example
   * ```ts
   * await clear()
   * ```
   */
  async clear(): Promise<void> {
    const { data } = await cacheModel.query
      .fetchFromApp({ namespace: this.namespace })
      .go();
    await cacheModel.delete(data).go();
  }

  /**
   * Similar to get but returns a boolean instead of the value
   * @param key - Key for the cached item
   * @returns
   */
  async has(key: string) {
    const item = await this.get(key);
    return Boolean(item);
  }
}
