type LogLevel = "debug" | "info" | "warn" | "silent";

const levelPriority: Record<LogLevel, number> = {
  silent: 0,
  info: 1,
  warn: 2,
  debug: 3
};

require('dotenv').config();

export default class Logger {
  private static level: LogLevel = process.env.RUNNING_LEVEL as LogLevel || "info";
  private static enabledTags: Set<string> = new Set();

  private tag: string;

  public constructor(tag: string) {
    this.tag = tag;
  }

  public static enableTag(tag: string): void {
    this.enabledTags.add(tag);
  }

  public static disableTag(tag: string): void {
    this.enabledTags.delete(tag);
  }

  public info(message: any, ...args: any[]) {
    if (levelPriority[Logger.level] < levelPriority["info"] || !Logger.enabledTags.has(this.tag)) {
      return;
    }
    console.info(`[${this.tag}] I: ${message}`, ...args);
  }

  public debug(message: any, ...args: any[]) {
    if (levelPriority[Logger.level] < levelPriority["debug"] || !Logger.enabledTags.has(this.tag)) {
      return;
    }
    console.debug(`[${this.tag}] D: ${message}`, ...args);
  }

  public warn(message: any, ...args: any[]) {
    if (levelPriority[Logger.level] < levelPriority["warn"] || !Logger.enabledTags.has(this.tag)) {
      return;
    }
    console.warn(`[${this.tag}] W: ${message}`, ...args);
  }

  public error(message: any, ...args: any[]) {
    if (Logger.enabledTags.has(this.tag)) {
      console.error(`[${this.tag}] E: ${message}`, ...args);
    }
  }
}