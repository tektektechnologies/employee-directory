import type { SupabaseServerClient } from "@/lib/supabase/server";

export type RecordedCall = { method: string; args: unknown[] };
export type RecordedQuery = { table: string; calls: RecordedCall[] };
export type FakeQueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

// Records every query-builder call so tests can assert exactly which filters
// and writes were sent, without a real database. RLS is not simulated; see
// docs/testing.md for the manual policy checks.
export function createFakeSupabase(resolveQuery: (query: RecordedQuery) => FakeQueryResult) {
  const recordedQueries: RecordedQuery[] = [];

  function from(table: string) {
    const query: RecordedQuery = { table, calls: [] };
    recordedQueries.push(query);

    const queryBuilder: object = new Proxy(
      {},
      {
        get(_target, propertyName) {
          if (propertyName === "then") {
            return (
              onFulfilled: (result: FakeQueryResult) => unknown,
              onRejected: (reason: unknown) => unknown,
            ) => Promise.resolve(resolveQuery(query)).then(onFulfilled, onRejected);
          }
          return (...args: unknown[]) => {
            query.calls.push({ method: String(propertyName), args });
            return queryBuilder;
          };
        },
      },
    );
    return queryBuilder;
  }

  return {
    client: { from } as unknown as SupabaseServerClient,
    recordedQueries,
  };
}

export function findCall(query: RecordedQuery, method: string) {
  return query.calls.find((call) => call.method === method);
}

export function isWriteQuery(query: RecordedQuery) {
  return query.calls.some((call) => call.method === "insert" || call.method === "update");
}
