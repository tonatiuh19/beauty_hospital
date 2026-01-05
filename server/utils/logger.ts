/**
 * Server-side logger that only logs when running locally
 * Checks if the environment is development or localhost
 */
class ServerLogger {
  private shouldLog(): boolean {
    // Check if we're in development mode or running locally
    const env = process.env.NODE_ENV || "development";
    const isLocal =
      env === "development" ||
      process.env.IS_LOCAL === "true" ||
      !process.env.VERCEL; // Not on Vercel = local

    return isLocal;
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog()) {
      console.error(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog()) {
      console.debug(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(...args);
    }
  }

  table(...args: any[]): void {
    if (this.shouldLog()) {
      console.table(...args);
    }
  }
}

// Export a singleton instance
export const logger = new ServerLogger();

// For backward compatibility, also export as default
export default logger;
