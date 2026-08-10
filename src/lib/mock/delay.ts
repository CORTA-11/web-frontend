/** Simulates network latency so loading states get exercised. */
export function mockDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
