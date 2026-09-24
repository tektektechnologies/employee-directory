// Used both when saving and when rendering, so a value that bypassed the form
// (or predates these rules) is never rendered as a live link or image.
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function containsSpaceOrControlCharacter(candidate: string) {
  return Array.from(candidate).some((character) => {
    const characterCode = character.charCodeAt(0);
    return /\s/.test(character) || characterCode < 0x20 || characterCode === 0x7f;
  });
}

export type SafeContactLink = {
  href: string;
  label: string;
  kind: "email" | "web";
};

export function getSafeHttpsUrl(candidate: string | null | undefined) {
  if (!candidate || containsSpaceOrControlCharacter(candidate)) return null;
  try {
    const parsedUrl = new URL(candidate);
    const isAllowed =
      parsedUrl.protocol === "https:" &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password;
    return isAllowed ? parsedUrl.href : null;
  } catch {
    return null;
  }
}

export function getSafeContactLink(candidate: string | null | undefined): SafeContactLink | null {
  if (!candidate || containsSpaceOrControlCharacter(candidate)) return null;

  if (candidate.toLowerCase().startsWith("mailto:")) {
    const emailAddress = candidate.slice("mailto:".length);
    if (!EMAIL_ADDRESS_PATTERN.test(emailAddress) || /[?#]/.test(emailAddress)) return null;
    return { href: `mailto:${emailAddress}`, label: emailAddress, kind: "email" };
  }

  const safeHttpsUrl = getSafeHttpsUrl(candidate);
  if (!safeHttpsUrl) return null;
  const { hostname, pathname } = new URL(safeHttpsUrl);
  const readablePath = pathname === "/" ? "" : pathname;
  return { href: safeHttpsUrl, label: `${hostname.replace(/^www\./, "")}${readablePath}`, kind: "web" };
}
