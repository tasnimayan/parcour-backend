import fs from 'fs';
import path from 'path';

export class Logger {
  private static logDir = path.join(process.cwd(), 'logs');

  static init() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private static writeToFile(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    const logFile = path.join(this.logDir, `${level}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta || '');
    this.writeToFile('info', message, meta);
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
    this.writeToFile('error', message, error);
  }

  static warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta || '');
    this.writeToFile('warn', message, meta);
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta || '');
      this.writeToFile('debug', message, meta);
    }
  }
}