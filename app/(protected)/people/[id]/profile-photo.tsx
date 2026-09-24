"use client";

import { useState } from "react";

type ProfilePhotoProps = {
  photoUrl: string | null;
  fullName: string;
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

const frameClass =
  "size-24 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 sm:size-28";

export function ProfilePhoto({ photoUrl, fullName }: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!photoUrl || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${frameClass} flex items-center justify-center text-2xl font-semibold text-stone-500`}
      >
        {initials(fullName)}
      </div>
    );
  }

  return (
    <div className={frameClass}>
      {/* next/image would need every user-supplied host allow-listed in next.config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={`Photo of ${fullName}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}
