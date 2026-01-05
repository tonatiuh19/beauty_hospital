import { store } from "../store";

/**
 * Conditional logger that only logs when running on localhost
 * Uses the Redux store to check if console logs are enabled
 */
class Logger {
  private shouldLog(): boolean {
    try {
      const state = store.getState();
      return state.config?.enableConsoleLogs ?? false;
    } catch {
      // Fallback to checking hostname directly if store is not available
      const hostname = window.location.hostname;
      return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.endsWith(".local")
      );
    }
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

  group(...args: any[]): void {
    if (this.shouldLog()) {
      console.group(...args);
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd();
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// For backward compatibility, also export as default
export default logger;
