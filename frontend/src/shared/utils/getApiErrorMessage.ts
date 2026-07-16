import { isAxiosError } from 'axios';

type ApiErrorPayload = {
  error?: {
    message?: string;
    details?: Record<string, unknown>;
  };
  detail?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const payload = error.response?.data as ApiErrorPayload | undefined;
  const apiMessage = payload?.error?.message ?? payload?.detail;
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  const fieldErrors = payload?.error?.details;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const messages = Object.values(fieldErrors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return fallback;
}
