import { describe, expect, it } from "vitest";
import { getSafeContactLink, getSafeHttpsUrl } from "@/lib/profiles/external-links";
import { parseProfileForm } from "@/lib/profiles/profile-fields";

function buildProfileForm(overrides: Record<string, string> = {}) {
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
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    formData.set(fieldName, fieldValue);
  }
  return formData;
}

describe("parseProfileForm", () => {
  it("accepts a complete profile and trims values", () => {
    const { fieldErrors, profileRow } = parseProfileForm(
      buildProfileForm({ fullName: "  Ada Lovelace  ", photoUrl: "https://example.com/ada.png" }),
    );

    expect(fieldErrors).toEqual({});
    expect(profileRow).toMatchObject({
      full_name: "Ada Lovelace",
      photo_url: "https://example.com/ada.png",
      contact_url: null,
    });
  });

  it.each(["fullName", "department", "jobTitle", "location", "bio"])(
    "requires %s",
    (requiredField) => {
      const { fieldErrors, profileRow } = parseProfileForm(
        buildProfileForm({ [requiredField]: "   " }),
      );
      expect(profileRow).toBeNull();
      expect(fieldErrors).toHaveProperty(requiredField);
    },
  );

  it("rejects values longer than the database allows", () => {
    const { fieldErrors } = parseProfileForm(
      buildProfileForm({ fullName: "a".repeat(101), bio: "b".repeat(1001) }),
    );
    expect(fieldErrors).toHaveProperty("fullName");
    expect(fieldErrors).toHaveProperty("bio");
  });

  it("splits interests, drops blanks and case-insensitive duplicates", () => {
    const { profileRow } = parseProfileForm(
      buildProfileForm({ interests: "Chess, chess ,, Topology,  cycling " }),
    );
    expect(profileRow?.interests).toEqual(["Chess", "Topology", "cycling"]);
  });

  it("rejects missing, too many, and too long interests", () => {
    const tooMany = Array.from({ length: 21 }, (_, index) => `topic ${index}`).join(",");
    for (const interests of ["", " , ", tooMany, "x".repeat(41)]) {
      expect(parseProfileForm(buildProfileForm({ interests })).fieldErrors).toHaveProperty(
        "interests",
      );
    }
  });

  it.each([
    ["photoUrl", "http://example.com/a.png"],
    ["photoUrl", "javascript:alert(1)"],
    ["photoUrl", `https://example.com/${"a".repeat(2050)}`],
    ["contactUrl", "ftp://example.com"],
    ["contactUrl", "mailto:not-an-email"],
    ["contactUrl", "data:text/html,hi"],
  ])("rejects %s = %s", (fieldName, fieldValue) => {
    const { fieldErrors, profileRow } = parseProfileForm(
      buildProfileForm({ [fieldName]: fieldValue }),
    );
    expect(profileRow).toBeNull();
    expect(fieldErrors).toHaveProperty(fieldName);
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
  ])("getSafeHttpsUrl(%s) is %s", (candidate, expected) => {
    expect(getSafeHttpsUrl(candidate)).toBe(expected);
  });

  it("returns a readable label for web and email contact links", () => {
    expect(getSafeContactLink("https://www.linkedin.com/in/ada")).toEqual({
      href: "https://www.linkedin.com/in/ada",
      label: "linkedin.com/in/ada",
      kind: "web",
    });
    expect(getSafeContactLink("mailto:ada@example.com")).toEqual({
      href: "mailto:ada@example.com",
      label: "ada@example.com",
      kind: "email",
    });
  });

  it("rejects mailto links with extra parameters and script links", () => {
    expect(getSafeContactLink("mailto:ada@example.com?bcc=x@example.com")).toBeNull();
    expect(getSafeContactLink("javascript:alert(1)")).toBeNull();
  });
});
