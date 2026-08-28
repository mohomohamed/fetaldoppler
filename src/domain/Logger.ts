export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxEntries = 500;
  private static listeners: Set<(entry: LogEntry) => void> = new Set();

  public static info(message: string): void {
    this.addEntry('info', message);
  }

  public static warn(message: string): void {
    this.addEntry('warn', message);
  }

  public static error(message: string): void {
    this.addEntry('error', message);
  }

  private static addEntry(level: 'info' | 'warn' | 'error', message: string): void {
    const time = new Date().toTimeString().split(' ')[0];
    const entry: LogEntry = {
      timestamp: time,
      level,
      message,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxEntries) {
      this.logs.shift();
    }

    for (const listener of this.listeners) {
      listener(entry);
    }
  }

  public static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public static getLogText(): string {
    return this.logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
  }

  public static subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public static clear(): void {
    this.logs = [];
  }
}
