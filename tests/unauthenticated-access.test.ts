import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeCookies = {
  setAll: (
    cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
    headers: Record<string, string>,
  ) => void;
};

const auth = vi.hoisted(() => ({
  claims: null as { sub: string; email?: string } | null,
  refreshedCookie: null as { name: string; value: string } | null,
}));

vi.mock("@/lib/supabase/config", () => ({
  getSupabaseEnv: () => ({ url: "https://project.supabase.co", key: "sb_publishable_test" }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: FakeCookies }) => ({
    auth: {
      getClaims: async () => {
        if (auth.refreshedCookie) {
          options.cookies.setAll([{ ...auth.refreshedCookie, options: {} }], {
            "cache-control": "private, no-store",
          });
        }
        return { data: auth.claims ? { claims: auth.claims } : null, error: null };
      },
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: auth.claims ? { claims: auth.claims } : null,
        error: null,
      }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

const { updateSession } = await import("@/lib/supabase/proxy");
const { requireUser } = await import("@/lib/auth/user");
const { safeNextPath } = await import("@/lib/auth/redirects");

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

beforeEach(() => {
  auth.claims = null;
  auth.refreshedCookie = null;
});

describe("proxy route protection", () => {
  it.each(["/directory", "/people/7d9f1c1e-3b5a-4c1e-9a54-0f0d2b8a1c11", "/profile/edit"])(
    "redirects a signed-out visitor from %s to sign-in with the original path",
    async (path) => {
      const response = await updateSession(requestFor(path));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe("/sign-in");
      expect(location.searchParams.get("next")).toBe(path);
    },
  );

  it("keeps the query string of the original destination", async () => {
    const response = await updateSession(requestFor("/directory?q=ada"));
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("next")).toBe("/directory?q=ada");
  });

  it("lets a signed-out visitor reach public pages", async () => {
    for (const path of ["/", "/sign-in", "/register"]) {
      const response = await updateSession(requestFor(path));
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("matches protected paths by segment, not by string prefix", async () => {
    const response = await updateSession(requestFor("/directory-archive"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a signed-in user through to protected pages", async () => {
    auth.claims = { sub: "user-a" };
    const response = await updateSession(requestFor("/directory"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("carries refreshed session cookies and no-store headers onto the redirect", async () => {
    auth.refreshedCookie = { name: "sb-project-auth-token", value: "cleared" };
    const response = await updateSession(requestFor("/profile/edit"));

    expect(response.status).toBe(307);
    expect(response.cookies.get("sb-project-auth-token")?.value).toBe("cleared");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("page-level identity check", () => {
  it("redirects to sign-in when there are no verified claims", async () => {
    await expect(requireUser("/profile/edit")).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?next=%2Fprofile%2Fedit",
    );
  });

  it("returns the user id from the verified token claims", async () => {
    auth.claims = { sub: "user-a", email: "a@example.com" };
    const { user } = await requireUser("/directory");
    expect(user).toEqual({ id: "user-a", email: "a@example.com" });
  });
});

describe("post-sign-in destination", () => {
  it.each([
    ["/people/abc?tab=about", "/people/abc?tab=about"],
    ["https://evil.example", "/directory"],
    ["//evil.example/path", "/directory"],
    ["/\\evil.example", "/directory"],
    ["javascript:alert(1)", "/directory"],
    [undefined, "/directory"],
  ])("maps %s to %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });
});
