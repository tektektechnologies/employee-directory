"use client";

import { useState } from "react";

type ProfilePhotoProps = {
  photoUrl: string | null;
  fullName: string;
};

function getInitials(fullName: string) {
  const nameParts = fullName.trim().split(/\s+/);
  const firstInitial = nameParts[0]?.[0] ?? "";
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function ProfilePhoto({ photoUrl, fullName }: ProfilePhotoProps) {
  const [photoFailedToLoad, setPhotoFailedToLoad] = useState(false);
  const frameClassName =
    "size-24 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 sm:size-28";

  if (!photoUrl || photoFailedToLoad) {
    return (
      <div
        aria-hidden="true"
        className={`${frameClassName} flex items-center justify-center text-2xl font-semibold text-stone-500`}
      >
        {getInitials(fullName)}
      </div>
    );
  }

  return (
    <div className={frameClassName}>
      {/* next/image would need every user-supplied host allow-listed in next.config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={`Photo of ${fullName}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setPhotoFailedToLoad(true)}
        className="size-full object-cover"
      />
    </div>
  );
}
