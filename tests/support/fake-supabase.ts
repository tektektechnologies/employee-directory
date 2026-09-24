import type { ServerClient } from "@/lib/supabase/server";

export type Call = { method: string; args: unknown[] };
export type Query = { table: string; calls: Call[] };
export type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

// Records every query-builder call so tests can assert exactly which filters
// and writes were sent, without a real database. RLS is not simulated; see
// docs/testing.md for the manual policy checks.
export function fakeSupabase(respond: (query: Query) => QueryResult) {
  const queries: Query[] = [];

  function from(table: string) {
    const query: Query = { table, calls: [] };
    queries.push(query);

    const builder: object = new Proxy(
      {},
      {
        get(_target, method) {
          if (method === "then") {
            return (
              onFulfilled: (result: QueryResult) => unknown,
              onRejected: (reason: unknown) => unknown,
            ) => Promise.resolve(respond(query)).then(onFulfilled, onRejected);
          }
          return (...args: unknown[]) => {
            query.calls.push({ method: String(method), args });
            return builder;
          };
        },
      },
    );
    return builder;
  }

  const removedFiles: string[] = [];
  const storage = {
    from: () => ({
      remove: async (paths: string[]) => {
        removedFiles.push(...paths);
        return { data: [], error: null };
      },
    }),
  };

  return {
    client: { from, storage } as unknown as ServerClient,
    queries,
    removedFiles,
  };
}

export function findCall(query: Query, method: string) {
  return query.calls.find((call) => call.method === method);
}

export function isWrite(query: Query) {
  return query.calls.some((call) => call.method === "insert" || call.method === "update");
}
