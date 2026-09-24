export const DEFAULT_PATH = "/directory";

const PROTECTED_PATHS = ["/directory", "/people", "/profile/edit"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Only same-site paths are allowed, so a crafted ?next= can't send users to
// another site after they sign in.
export function safeNextPath(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return DEFAULT_PATH;
  }

  const base = "http://internal.invalid";
  const url = new URL(next, base);
  if (url.origin !== base) {
    return DEFAULT_PATH;
  }
  return url.pathname + url.search + url.hash;
}

export function signInPath(next: string) {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}
