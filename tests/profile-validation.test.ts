import { describe, expect, it } from "vitest";
import { validateProfile } from "@/lib/profiles/fields";
import { toContactLink, toHttpsUrl } from "@/lib/profiles/links";

function profileForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    fullName: "Ada Lovelace",
    department: "Applied Research",
    jobTitle: "Analyst",
    location: "London",
    bio: "Works on analytical engines.",
    interests: "poetry, mathematics",
    photoUrl: "",
    contactUrl: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("validateProfile", () => {
  it("accepts a complete profile and trims values", () => {
    const { errors, row } = validateProfile(
      profileForm({ fullName: "  Ada Lovelace  ", photoUrl: "https://example.com/ada.png" }),
    );

    expect(errors).toEqual({});
    expect(row).toMatchObject({
      full_name: "Ada Lovelace",
      photo_url: "https://example.com/ada.png",
      contact_url: null,
    });
  });

  it.each(["fullName", "department", "jobTitle", "location", "bio"])("requires %s", (field) => {
    const { errors, row } = validateProfile(profileForm({ [field]: "   " }));
    expect(row).toBeNull();
    expect(errors).toHaveProperty(field);
  });

  it("rejects values longer than the database allows", () => {
    const { errors } = validateProfile(profileForm({ fullName: "a".repeat(101), bio: "b".repeat(1001) }));
    expect(errors).toHaveProperty("fullName");
    expect(errors).toHaveProperty("bio");
  });

  it("splits interests, drops blanks and case-insensitive duplicates", () => {
    const { row } = validateProfile(profileForm({ interests: "Chess, chess ,, Topology,  cycling " }));
    expect(row?.interests).toEqual(["Chess", "Topology", "cycling"]);
  });

  it("rejects missing, too many, and too long interests", () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `topic ${i}`).join(",");
    for (const interests of ["", " , ", tooMany, "x".repeat(41)]) {
      expect(validateProfile(profileForm({ interests })).errors).toHaveProperty("interests");
    }
  });

  it.each([
    ["photoUrl", "http://example.com/a.png"],
    ["photoUrl", "javascript:alert(1)"],
    ["photoUrl", `https://example.com/${"a".repeat(2050)}`],
    ["contactUrl", "ftp://example.com"],
    ["contactUrl", "mailto:not-an-email"],
    ["contactUrl", "data:text/html,hi"],
  ])("rejects %s = %s", (field, value) => {
    const { errors, row } = validateProfile(profileForm({ [field]: value }));
    expect(row).toBeNull();
    expect(errors).toHaveProperty(field);
  });
});

describe("external link rules used for saving and rendering", () => {
  it.each([
    ["https://example.com/a.png", "https://example.com/a.png"],
    ["HTTPS://Example.com/A.png", "https://example.com/A.png"],
    ["http://example.com/a.png", null],
    ["https://user:secret@example.com/a.png", null],
    ["https://exa mple.com", null],
    ["//example.com/a.png", null],
    [null, null],
  ])("toHttpsUrl(%s) is %s", (text, expected) => {
    expect(toHttpsUrl(text)).toBe(expected);
  });

  it("returns a readable label for web and email contact links", () => {
    expect(toContactLink("https://www.linkedin.com/in/ada")).toEqual({
      href: "https://www.linkedin.com/in/ada",
      label: "linkedin.com/in/ada",
      kind: "web",
    });
    expect(toContactLink("mailto:ada@example.com")).toEqual({
      href: "mailto:ada@example.com",
      label: "ada@example.com",
      kind: "email",
    });
  });

  it("rejects mailto links with extra parameters and script links", () => {
    expect(toContactLink("mailto:ada@example.com?bcc=x@example.com")).toBeNull();
    expect(toContactLink("javascript:alert(1)")).toBeNull();
  });
});
