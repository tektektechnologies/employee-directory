// Used when saving and again when rendering, so a stored value that bypassed
// the form is never shown as a live link or image.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactLink = {
  href: string;
  label: string;
  kind: "email" | "web";
};

function hasBadChars(text: string) {
  return Array.from(text).some((char) => {
    const code = char.charCodeAt(0);
    return /\s/.test(char) || code < 0x20 || code === 0x7f;
  });
}

export function toHttpsUrl(text: string | null | undefined) {
  if (!text || hasBadChars(text)) return null;
  try {
    const url = new URL(text);
    const ok = url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    return ok ? url.href : null;
  } catch {
    return null;
  }
}

export function toContactLink(text: string | null | undefined): ContactLink | null {
  if (!text || hasBadChars(text)) return null;

  if (text.toLowerCase().startsWith("mailto:")) {
    const email = text.slice("mailto:".length);
    if (!EMAIL.test(email) || /[?#]/.test(email)) return null;
    return { href: `mailto:${email}`, label: email, kind: "email" };
  }

  const href = toHttpsUrl(text);
  if (!href) return null;
  const { hostname, pathname } = new URL(href);
  const path = pathname === "/" ? "" : pathname;
  return { href, label: hostname.replace(/^www\./, "") + path, kind: "web" };
}
