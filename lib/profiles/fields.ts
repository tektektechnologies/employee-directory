import { toContactLink, toHttpsUrl } from "./links";

// Mirrors the check constraints in the profiles migration, so users see a
// field message instead of a database error.
export const LIMITS = {
  fullName: 100,
  department: 100,
  jobTitle: 100,
  location: 100,
  bio: 1000,
  interestCount: 20,
  interestLength: 40,
  url: 2048,
} as const;

export type ProfileValues = {
  fullName: string;
  department: string;
  jobTitle: string;
  location: string;
  bio: string;
  interests: string;
  photoUrl: string;
  contactUrl: string;
};

export type ProfileField = keyof ProfileValues;

export type ProfileRow = {
  full_name: string;
  department: string | null;
  job_title: string | null;
  location: string | null;
  bio: string | null;
  interests: string[];
  photo_url: string | null;
  contact_url: string | null;
};

export const PROFILE_COLUMNS =
  "full_name, department, job_title, location, bio, interests, photo_url, contact_url";

export const emptyValues: ProfileValues = {
  fullName: "",
  department: "",
  jobTitle: "",
  location: "",
  bio: "",
  interests: "",
  photoUrl: "",
  contactUrl: "",
};

export function rowToValues(row: ProfileRow): ProfileValues {
  return {
    fullName: row.full_name,
    department: row.department ?? "",
    jobTitle: row.job_title ?? "",
    location: row.location ?? "",
    bio: row.bio ?? "",
    interests: row.interests.join(", "),
    photoUrl: row.photo_url ?? "",
    contactUrl: row.contact_url ?? "",
  };
}

function getField(formData: FormData, name: ProfileField) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function splitInterests(text: string) {
  const seen = new Set<string>();
  const interests: string[] = [];
  for (const part of text.split(",")) {
    const interest = part.trim().replace(/\s+/g, " ");
    const key = interest.toLowerCase();
    if (interest && !seen.has(key)) {
      seen.add(key);
      interests.push(interest);
    }
  }
  return interests;
}

export function validateProfile(formData: FormData) {
  const values: ProfileValues = {
    fullName: getField(formData, "fullName"),
    department: getField(formData, "department"),
    jobTitle: getField(formData, "jobTitle"),
    location: getField(formData, "location"),
    bio: getField(formData, "bio"),
    interests: getField(formData, "interests"),
    photoUrl: getField(formData, "photoUrl"),
    contactUrl: getField(formData, "contactUrl"),
  };
  const errors: Partial<Record<ProfileField, string>> = {};

  const required: [ProfileField, string, number][] = [
    ["fullName", "Enter your name.", LIMITS.fullName],
    ["jobTitle", "Enter your role.", LIMITS.jobTitle],
    ["department", "Enter your department.", LIMITS.department],
    ["location", "Enter your location.", LIMITS.location],
    ["bio", "Write a short bio.", LIMITS.bio],
  ];
  for (const [name, message, max] of required) {
    if (!values[name]) {
      errors[name] = message;
    } else if (values[name].length > max) {
      errors[name] = `Use ${max} characters or fewer (currently ${values[name].length}).`;
    }
  }

  const interests = splitInterests(values.interests);
  if (interests.length === 0) {
    errors.interests = "Add at least one interest.";
  } else if (interests.length > LIMITS.interestCount) {
    errors.interests = `Add up to ${LIMITS.interestCount} interests (currently ${interests.length}).`;
  } else if (interests.some((interest) => interest.length > LIMITS.interestLength)) {
    errors.interests = `Keep each interest to ${LIMITS.interestLength} characters or fewer.`;
  }

  const photoUrl = toHttpsUrl(values.photoUrl);
  if (values.photoUrl && (!photoUrl || photoUrl.length > LIMITS.url)) {
    errors.photoUrl = "Enter a full image link that starts with https://";
  }

  const contact = toContactLink(values.contactUrl);
  if (values.contactUrl && (!contact || contact.href.length > LIMITS.url)) {
    errors.contactUrl = "Enter a link that starts with https://, or mailto: followed by an email address.";
  }

  if (Object.keys(errors).length > 0) {
    return { values, errors, row: null };
  }

  const row: ProfileRow = {
    full_name: values.fullName,
    department: values.department,
    job_title: values.jobTitle,
    location: values.location,
    bio: values.bio,
    interests,
    photo_url: photoUrl,
    contact_url: contact?.href ?? null,
  };
  return { values, errors, row };
}
