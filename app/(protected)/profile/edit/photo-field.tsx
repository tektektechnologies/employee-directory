"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { EmptyAvatar } from "@/components/empty-avatar";
import { secondaryButton } from "@/components/styles";
import { PHOTO_BUCKET, PHOTO_TYPES, checkPhoto, newPhotoPath } from "@/lib/profiles/photos";
import { createClient } from "@/lib/supabase/client";

type PhotoFieldProps = {
  userId: string;
  savedPath: string;
  savedSrc: string | null;
  error?: string;
  onBusyChange: (busy: boolean) => void;
};

type Notice = { tone: "error" | "info"; text: string };

export function PhotoField({ userId, savedPath, savedSrc, error, onBusyChange }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [path, setPath] = useState(savedPath);
  const [src, setSrc] = useState(savedSrc);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function showPreview(url: string | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = url?.startsWith("blob:") ? url : null;
    setSrc(url);
  }

  // Uploads that were never saved can go right away. The saved photo is only
  // deleted by the server after the new profile is saved.
  function discardUnsaved(oldPath: string) {
    if (oldPath && oldPath !== savedPath) {
      void createClient().storage.from(PHOTO_BUCKET).remove([oldPath]);
    }
  }

  function setBusyState(value: boolean) {
    setBusy(value);
    onBusyChange(value);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const problem = checkPhoto(file);
    if (problem) {
      setNotice({ tone: "error", text: problem });
      return;
    }

    setBusyState(true);
    setNotice({ tone: "info", text: "Uploading photo…" });
    const nextPath = newPhotoPath(userId, file);
    const { error: uploadError } = await createClient()
      .storage.from(PHOTO_BUCKET)
      .upload(nextPath, file, { contentType: file.type, upsert: false });
    setBusyState(false);

    if (uploadError) {
      setNotice({ tone: "error", text: "The photo couldn't be uploaded. Please try again." });
      return;
    }

    discardUnsaved(path);
    setPath(nextPath);
    showPreview(URL.createObjectURL(file));
    setNotice({ tone: "info", text: "Photo uploaded. Save your profile to keep it." });
  }

  function remove() {
    discardUnsaved(path);
    setPath("");
    showPreview(null);
    setNotice(savedPath ? { tone: "info", text: "Photo removed. Save your profile to confirm." } : null);
  }

  const message = error ? { tone: "error" as const, text: error } : notice;

  return (
    <section aria-labelledby="photo-heading" className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
      <input type="hidden" name="photoPath" value={path} />

      <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 sm:size-28">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Your profile photo"
            onError={() => setSrc(null)}
            className="size-full object-cover"
          />
        ) : (
          <EmptyAvatar className="p-5" />
        )}
        {busy && (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="size-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <h2 id="photo-heading" className="text-base font-semibold text-stone-900">
            Profile photo <span className="text-sm font-normal text-stone-500">(optional)</span>
          </h2>
          <p id="photo-hint" className="text-sm text-stone-500">
            A clear photo of your face helps colleagues recognize you. JPG, PNG, or WebP, up to 2 MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(PHOTO_TYPES).join(",")}
          onChange={upload}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            aria-describedby="photo-hint"
            className={`${secondaryButton} py-2 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {busy ? "Uploading…" : path ? "Change photo" : "Upload photo"}
          </button>
          {path && !busy && (
            <button
              type="button"
              onClick={remove}
              className="rounded-md px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Remove
            </button>
          )}
        </div>

        <p
          role="status"
          className={`min-h-5 text-sm ${message?.tone === "error" ? "text-red-700" : "text-stone-600"}`}
        >
          {message?.text}
        </p>
      </div>
    </section>
  );
}
