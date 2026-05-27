"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Package, Upload, X, Loader2 } from "lucide-react";

interface ItemPhotoUploadProps {
  itemId: string;
  currentUrl: string | null;
  /** Called with the new URL after a successful upload, or null after removal */
  onPhotoChange?: (url: string | null) => void;
}

export function ItemPhotoUpload({
  itemId,
  currentUrl,
  onPhotoChange,
}: ItemPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds the 5 MB limit.");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("file", file);

    startTransition(() => {
      setUploading(true);
      fetch(`/api/items/${itemId}/photo`, {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Upload failed.");
          setPreview(data.url);
          onPhotoChange?.(data.url);
        })
        .catch((err) => {
          setError(err.message);
          setPreview(currentUrl);
        })
        .finally(() => setUploading(false));
    });

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleRemove() {
    setError(null);
    setUploading(true);
    fetch(`/api/items/${itemId}/photo`, { method: "DELETE" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Remove failed.");
        }
        setPreview(null);
        onPhotoChange?.(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setUploading(false));
  }

  return (
    <div className="space-y-2">
      {/* Photo area */}
      <div
        className="relative w-full h-40 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer group"
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Item photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
            <Upload className="h-6 w-6" />
            <p className="text-xs">Click to upload a photo</p>
            <p className="text-[10px]">JPG, PNG, WEBP · max 5 MB</p>
          </div>
        )}

        {/* Overlay hint when photo exists */}
        {preview && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs font-medium">Replace photo</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Remove button */}
      {preview && !uploading && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive h-7 text-xs"
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
          Remove photo
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
