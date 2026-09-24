import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeCookieMethods = {
  setAll: (
    cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
    cacheHeaders: Record<string, string>,
  ) => void;
};

const authState = vi.hoisted(() => ({
  claims: null as { sub: string; email?: string } | null,
  refreshedCookie: null as { name: string; value: string } | null,
}));

vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({
    supabaseUrl: "https://project.supabase.co",
    supabasePublishableKey: "sb_publishable_test",
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: FakeCookieMethods }) => ({
    auth: {
      getClaims: async () => {
        if (authState.refreshedCookie) {
          options.cookies.setAll([{ ...authState.refreshedCookie, options: {} }], {
            "cache-control": "private, no-store",
          });
        }
        return { data: authState.claims ? { claims: authState.claims } : null, error: null };
      },
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: authState.claims ? { claims: authState.claims } : null,
        error: null,
      }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

const { refreshSessionAndGuardRoutes } = await import("@/lib/supabase/proxy");
const { requireVerifiedUser } = await import("@/lib/auth/verified-user");
const { getSafeRedirectPath } = await import("@/lib/auth/redirects");

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

beforeEach(() => {
  authState.claims = null;
  authState.refreshedCookie = null;
});

describe("proxy route protection", () => {
  it.each(["/directory", "/people/7d9f1c1e-3b5a-4c1e-9a54-0f0d2b8a1c11", "/profile/edit"])(
    "redirects a signed-out visitor from %s to sign-in with the original path",
    async (protectedPath) => {
      const response = await refreshSessionAndGuardRoutes(requestFor(protectedPath));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe("/sign-in");
      expect(location.searchParams.get("next")).toBe(protectedPath);
    },
  );

  it("keeps the query string of the original destination", async () => {
    const response = await refreshSessionAndGuardRoutes(requestFor("/directory?q=ada"));
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("next")).toBe("/directory?q=ada");
  });

  it("lets a signed-out visitor reach public pages", async () => {
    for (const publicPath of ["/", "/sign-in", "/register"]) {
      const response = await refreshSessionAndGuardRoutes(requestFor(publicPath));
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("matches protected paths by segment, not by string prefix", async () => {
    const response = await refreshSessionAndGuardRoutes(requestFor("/directory-archive"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a verified user through to protected pages", async () => {
    authState.claims = { sub: "user-a" };
    const response = await refreshSessionAndGuardRoutes(requestFor("/directory"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("carries refreshed session cookies and no-store headers onto the redirect", async () => {
    authState.refreshedCookie = { name: "sb-project-auth-token", value: "cleared" };
    const response = await refreshSessionAndGuardRoutes(requestFor("/profile/edit"));

    expect(response.status).toBe(307);
    expect(response.cookies.get("sb-project-auth-token")?.value).toBe("cleared");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("page-level identity check", () => {
  it("redirects to sign-in when there are no verified claims", async () => {
    await expect(requireVerifiedUser("/profile/edit")).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?next=%2Fprofile%2Fedit",
    );
  });

  it("returns the verified user id from the token claims", async () => {
    authState.claims = { sub: "user-a", email: "a@example.com" };
    const { user } = await requireVerifiedUser("/directory");
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
  ])("maps %s to %s", (candidate, expectedPath) => {
    expect(getSafeRedirectPath(candidate)).toBe(expectedPath);
  });
});
