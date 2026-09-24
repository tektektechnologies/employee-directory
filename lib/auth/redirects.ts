export const DEFAULT_SIGNED_IN_PATH = "/directory";

const PROTECTED_PATH_PREFIXES = ["/directory", "/people", "/profile/edit"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Only same-origin relative paths are allowed, so a crafted ?next= value can't
// send users to another site after they sign in.
export function getSafeRedirectPath(candidate: unknown) {
  if (
    typeof candidate !== "string" ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  const internalOrigin = "http://internal.invalid";
  const parsedUrl = new URL(candidate, internalOrigin);
  if (parsedUrl.origin !== internalOrigin) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

export function buildSignInPath(destinationPath: string) {
  return `/sign-in?next=${encodeURIComponent(destinationPath)}`;
}
