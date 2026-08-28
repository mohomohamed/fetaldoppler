import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SessionMetadata, SessionMarker } from '../domain/types';

interface DopplerDbSchema extends DBSchema {
  sessions: {
    key: string;
    value: SessionMetadata & { wavBlob?: Blob };
    indexes: { 'by-startTime': number };
  };
  markers: {
    key: string;
    value: SessionMarker;
    indexes: { 'by-sessionId': string };
  };
}

const DB_NAME = 'doppler_pwa_db';
const DB_VERSION = 1;

export class Database {
  private static dbPromise: Promise<IDBPDatabase<DopplerDbSchema>> | null = null;

  public static async getDb(): Promise<IDBPDatabase<DopplerDbSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<DopplerDbSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
            sessionStore.createIndex('by-startTime', 'startTime');
          }
          if (!db.objectStoreNames.contains('markers')) {
            const markerStore = db.createObjectStore('markers', { keyPath: 'id' });
            markerStore.createIndex('by-sessionId', 'sessionId');
          }
        },
      });
    }
    return this.dbPromise;
  }
}
