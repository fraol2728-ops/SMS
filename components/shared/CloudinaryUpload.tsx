"use client";

import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  onRemove?: () => void;
}

export function CloudinaryUpload({
  onUpload,
  currentUrl,
  onRemove,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!uploadPreset || !cloudName) {
        throw new Error("Cloudinary is not configured");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "exceed/events");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message ?? "Upload failed");
      }

      const data = await res.json();
      const url = data.secure_url;
      setPreview(url);
      onUpload(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    if (onRemove) onRemove();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border shadow-sm dark:border-gray-700">
          <div className="relative h-52 w-full">
            <Image
              src={preview}
              alt="Event thumbnail"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-gray-900 text-sm transition-colors hover:bg-gray-100"
            >
              <Upload size={14} />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-red-700"
            >
              <X size={14} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full cursor-pointer rounded-2xl border-2 border-gray-300 border-dashed p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Uploading...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <ImageIcon size={26} className="text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                  Click to upload or drag & drop
                </p>
                <p className="mt-1 text-gray-400 text-xs">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>
            </div>
          )}
        </button>
      )}

      {error && (
        <p className="text-red-600 text-xs dark:text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
