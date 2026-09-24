import { describe, expect, it } from "vitest";
import { validateProfile } from "@/lib/profiles/fields";
import { toContactLink, toHttpsUrl } from "@/lib/profiles/links";

const MY_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const FILE_ID = "33333333-3333-4333-8333-333333333333";

function validate(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    fullName: "Ada Lovelace",
    department: "Analysis",
    jobTitle: "Analyst",
    location: "London",
    bio: "Works on analytical engines.",
    interests: "poetry, mathematics",
    photoPath: "",
    contactUrl: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return validateProfile(formData, MY_ID);
}

describe("validateProfile", () => {
  it("accepts a complete profile and trims values", () => {
    const { errors, row } = validate({ fullName: "  Ada Lovelace  " });

    expect(errors).toEqual({});
    expect(row).toMatchObject({ full_name: "Ada Lovelace", photo_path: null, contact_url: null });
  });

  it.each(["fullName", "department", "jobTitle", "location", "bio"])("requires %s", (field) => {
    const { errors, row } = validate({ [field]: "   " });
    expect(row).toBeNull();
    expect(errors).toHaveProperty(field);
  });

  it("accepts only departments from the list", () => {
    expect(validate({ department: "Logic and Foundations of Mathematics" }).row).not.toBeNull();
    for (const department of ["Applied Research", "algebra", "Algebra and Geometry"]) {
      expect(validate({ department }).errors).toHaveProperty("department");
    }
  });

  it("rejects values longer than the database allows", () => {
    const { errors } = validate({ fullName: "a".repeat(101), bio: "b".repeat(1001) });
    expect(errors).toHaveProperty("fullName");
    expect(errors).toHaveProperty("bio");
  });

  it("splits interests, drops blanks and case-insensitive duplicates", () => {
    const { row } = validate({ interests: "Chess, chess ,, Topology,  cycling " });
    expect(row?.interests).toEqual(["Chess", "Topology", "cycling"]);
  });

  it("rejects missing, too many, and too long interests", () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `topic ${i}`).join(",");
    for (const interests of ["", " , ", tooMany, "x".repeat(41)]) {
      expect(validate({ interests }).errors).toHaveProperty("interests");
    }
  });

  it("accepts a photo uploaded to your own folder", () => {
    const { row } = validate({ photoPath: `${MY_ID}/${FILE_ID}.webp` });
    expect(row?.photo_path).toBe(`${MY_ID}/${FILE_ID}.webp`);
  });

  it.each([
    ["photoPath", `${OTHER_ID}/${FILE_ID}.jpg`],
    ["photoPath", `${MY_ID}/../${OTHER_ID}/${FILE_ID}.jpg`],
    ["photoPath", `${MY_ID}/${FILE_ID}.svg`],
    ["photoPath", "https://example.com/a.png"],
    ["contactUrl", "ftp://example.com"],
    ["contactUrl", "mailto:not-an-email"],
    ["contactUrl", "data:text/html,hi"],
  ])("rejects %s = %s", (field, value) => {
    const { errors, row } = validate({ [field]: value });
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
