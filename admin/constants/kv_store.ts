import { KV_STORE_SCHEMA, type KVStoreKey } from '../types/kv_store.js'

export const SETTINGS_KEYS: KVStoreKey[] = Object.keys(KV_STORE_SCHEMA) as KVStoreKey[]
