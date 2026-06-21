"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

interface ProfilePhotoUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  name?: string;
}

export function ProfilePhotoUpload({
  currentUrl,
  onUpload,
  onRemove,
  name = "Anonymous",
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        setError("Upload not configured. Contact admin.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "exceed/profiles");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const errData = await res.json();
        // Debug logging intentionally suppressed.
        throw new Error(errData.error?.message ?? "Upload failed");
      }

      const data = await res.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url);
    } catch (e: any) {
      // Debug logging intentionally suppressed.
      setError(e?.message ?? "Upload failed — please try again");
    } finally {
      setUploading(false);
    }
  }

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg ring-4 ring-white transition-opacity hover:opacity-90 dark:ring-gray-700"
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : uploading ? (
            <Loader2 size={28} className="animate-spin text-white" />
          ) : (
            <span className="font-black text-2xl text-white">{initials}</span>
          )}
        </button>

        {!uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 shadow-md transition-colors hover:bg-blue-700"
          >
            <Camera size={14} className="text-white" />
          </button>
        )}

        {preview && !uploading && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onRemove?.();
            }}
            className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-sm transition-colors hover:bg-red-600"
          >
            <X size={10} className="text-white" />
          </button>
        )}
      </div>

      <p className="text-center text-gray-400 text-xs">
        {uploading ? "Uploading..." : "Click photo to change (optional)"}
      </p>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
