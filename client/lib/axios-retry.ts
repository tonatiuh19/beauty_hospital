import axios, { AxiosError } from "axios";
import { logger } from "./logger";

/**
 * Check if an error is a connection timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    // Check for ETIMEDOUT or network timeout errors
    return (
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout") ||
      error.message?.includes("ETIMEDOUT") ||
      error.message?.includes("Network Error")
    );
  }
  return false;
};

/**
 * Get a user-friendly error message based on the error type
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (isTimeoutError(error)) {
    return "No pudimos conectar con el servidor. Por favor intenta de nuevo en unos momentos.";
  }

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return "El recurso solicitado no fue encontrado.";
    }
    if (error.response?.status === 500) {
      return "Error en el servidor. Por favor intenta de nuevo más tarde.";
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }

  return "Ocurrió un error inesperado. Por favor intenta de nuevo.";
};

/**
 * Delay function for retry backoff
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

/**
 * Execute an async function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns Promise with the function result
 *
 * @example
 * const data = await withRetry(
 *   () => axios.get('/api/business-hours'),
 *   { maxRetries: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = config;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on non-timeout errors
      if (!isTimeoutError(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay,
      );

      logger.log(
        `Request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`,
        error,
      );

      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}
