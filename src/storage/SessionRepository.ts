import { Database } from './Database';
import { SessionMetadata, SessionMarker } from '../domain/types';

export class SessionRepository {
  public static async saveSession(session: SessionMetadata, wavBlob?: Blob): Promise<void> {
    const db = await Database.getDb();
    await db.put('sessions', {
      ...session,
      wavBlob,
    });
  }

  public static async getAllSessions(): Promise<SessionMetadata[]> {
    const db = await Database.getDb();
    const sessions = await db.getAllFromIndex('sessions', 'by-startTime');
    return sessions.reverse(); // Most recent first
  }

  public static async getSession(id: string): Promise<(SessionMetadata & { wavBlob?: Blob }) | undefined> {
    const db = await Database.getDb();
    return db.get('sessions', id);
  }

  public static async deleteSession(id: string): Promise<void> {
    const db = await Database.getDb();
    await db.delete('sessions', id);
  }

  public static async addMarker(marker: SessionMarker): Promise<void> {
    const db = await Database.getDb();
    await db.put('markers', marker);
  }

  public static async getMarkersForSession(sessionId: string): Promise<SessionMarker[]> {
    const db = await Database.getDb();
    return db.getAllFromIndex('markers', 'by-sessionId', sessionId);
  }
}
