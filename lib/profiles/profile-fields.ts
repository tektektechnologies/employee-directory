import { getSafeContactLink, getSafeHttpsUrl } from "./external-links";

// Limits mirror the check constraints in the profiles migration, so users get a
// field-level message instead of a database error.
export const PROFILE_LIMITS = {
  fullName: 100,
  department: 100,
  jobTitle: 100,
  location: 100,
  bio: 1000,
  interestCount: 20,
  interestLength: 40,
  url: 2048,
} as const;

export type ProfileFormValues = {
  fullName: string;
  department: string;
  jobTitle: string;
  location: string;
  bio: string;
  interests: string;
  photoUrl: string;
  contactUrl: string;
};

export type ProfileFieldName = keyof ProfileFormValues;

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

export const PROFILE_ROW_COLUMNS =
  "full_name, department, job_title, location, bio, interests, photo_url, contact_url";

export const emptyProfileFormValues: ProfileFormValues = {
  fullName: "",
  department: "",
  jobTitle: "",
  location: "",
  bio: "",
  interests: "",
  photoUrl: "",
  contactUrl: "",
};

export function profileRowToFormValues(profileRow: ProfileRow): ProfileFormValues {
  return {
    fullName: profileRow.full_name,
    department: profileRow.department ?? "",
    jobTitle: profileRow.job_title ?? "",
    location: profileRow.location ?? "",
    bio: profileRow.bio ?? "",
    interests: profileRow.interests.join(", "),
    photoUrl: profileRow.photo_url ?? "",
    contactUrl: profileRow.contact_url ?? "",
  };
}

function readTrimmedField(formData: FormData, fieldName: ProfileFieldName) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function splitInterests(rawInterests: string) {
  const seenInterests = new Set<string>();
  const interests: string[] = [];
  for (const candidate of rawInterests.split(",")) {
    const interest = candidate.trim().replace(/\s+/g, " ");
    const normalizedInterest = interest.toLowerCase();
    if (interest && !seenInterests.has(normalizedInterest)) {
      seenInterests.add(normalizedInterest);
      interests.push(interest);
    }
  }
  return interests;
}

export function parseProfileForm(formData: FormData) {
  const values: ProfileFormValues = {
    fullName: readTrimmedField(formData, "fullName"),
    department: readTrimmedField(formData, "department"),
    jobTitle: readTrimmedField(formData, "jobTitle"),
    location: readTrimmedField(formData, "location"),
    bio: readTrimmedField(formData, "bio"),
    interests: readTrimmedField(formData, "interests"),
    photoUrl: readTrimmedField(formData, "photoUrl"),
    contactUrl: readTrimmedField(formData, "contactUrl"),
  };
  const fieldErrors: Partial<Record<ProfileFieldName, string>> = {};

  const requiredTextFields: [ProfileFieldName, string, number][] = [
    ["fullName", "Enter your name.", PROFILE_LIMITS.fullName],
    ["department", "Enter your department.", PROFILE_LIMITS.department],
    ["jobTitle", "Enter your role.", PROFILE_LIMITS.jobTitle],
    ["location", "Enter your location.", PROFILE_LIMITS.location],
    ["bio", "Write a short bio.", PROFILE_LIMITS.bio],
  ];
  for (const [fieldName, missingMessage, maxLength] of requiredTextFields) {
    if (!values[fieldName]) {
      fieldErrors[fieldName] = missingMessage;
    } else if (values[fieldName].length > maxLength) {
      fieldErrors[fieldName] = `Keep this under ${maxLength} characters.`;
    }
  }

  const interests = splitInterests(values.interests);
  if (interests.length === 0) {
    fieldErrors.interests = "Add at least one interest.";
  } else if (interests.length > PROFILE_LIMITS.interestCount) {
    fieldErrors.interests = `Add at most ${PROFILE_LIMITS.interestCount} interests.`;
  } else if (interests.some((interest) => interest.length > PROFILE_LIMITS.interestLength)) {
    fieldErrors.interests = `Keep each interest under ${PROFILE_LIMITS.interestLength} characters.`;
  }

  const safePhotoUrl = getSafeHttpsUrl(values.photoUrl);
  if (values.photoUrl && (!safePhotoUrl || safePhotoUrl.length > PROFILE_LIMITS.url)) {
    fieldErrors.photoUrl = "Enter a full image link starting with https://.";
  }

  const safeContactLink = getSafeContactLink(values.contactUrl);
  if (
    values.contactUrl &&
    (!safeContactLink || safeContactLink.href.length > PROFILE_LIMITS.url)
  ) {
    fieldErrors.contactUrl =
      "Enter a link starting with https:// or an email like mailto:you@example.com.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { values, fieldErrors, profileRow: null };
  }

  const profileRow: ProfileRow = {
    full_name: values.fullName,
    department: values.department,
    job_title: values.jobTitle,
    location: values.location,
    bio: values.bio,
    interests,
    photo_url: safePhotoUrl,
    contact_url: safeContactLink?.href ?? null,
  };
  return { values, fieldErrors, profileRow };
}
