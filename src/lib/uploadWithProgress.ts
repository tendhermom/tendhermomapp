/**
 * Upload a file to Supabase Storage with real-time progress.
 *
 * The Supabase JS SDK does not expose XHR progress events, so we use a
 * direct REST call to the storage endpoint. Returns the public URL on success.
 *
 * For private buckets, fetch a signed URL separately after upload.
 */

import { supabase } from "@/integrations/supabase/client";

interface UploadOpts {
  bucket: string;
  path: string;
  file: File | Blob;
  upsert?: boolean;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function uploadWithProgress({
  bucket,
  path,
  file,
  upsert = false,
  onProgress,
  signal,
}: UploadOpts): Promise<{ publicUrl: string; path: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? PUBLISHABLE_KEY;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`;

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", PUBLISHABLE_KEY);
    xhr.setRequestHeader(
      "Content-Type",
      (file as File).type || "application/octet-stream"
    );
    xhr.setRequestHeader("x-upsert", upsert ? "true" : "false");
    xhr.setRequestHeader("Cache-Control", "max-age=3600");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        resolve({ publicUrl: data.publicUrl, path });
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(file);
  });
}
