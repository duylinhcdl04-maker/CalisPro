/**
 * Every mock service call goes through this so page code (loading states,
 * TanStack Query hooks) behaves exactly as it will against the real
 * Spring Boot API - there is no shortcut path that only works with mocks.
 */
export function withLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
