import { vi } from "vitest";

// A canned answer for one API call, keyed as "METHOD /path".
export interface FakeResponse {
  status: number;
  body?: unknown;
}

// Replaces window.fetch with a fake backend that answers only the given
// routes; any other request fails the test. Returns the mock so tests can
// check which requests the page sent. vitest.config.ts restores the real
// fetch after each test (unstubGlobals).
export function stubApi(routes: Record<string, FakeResponse>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const key = `${(init?.method ?? "GET").toUpperCase()} ${String(input)}`;
      const route = routes[key];
      if (!route) throw new Error(`Unexpected request in test: ${key}`);
      return new Response(
        route.body === undefined ? null : JSON.stringify(route.body),
        {
          status: route.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// The "METHOD /path" of every request the page sent, in order.
export function requestsSent(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls.map(
    ([input, init]) => `${(init?.method ?? "GET").toUpperCase()} ${input}`
  );
}
