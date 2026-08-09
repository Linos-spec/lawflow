/**
 * Pluggable document storage.
 *
 * MVP: files are stored as bytes in Postgres (DocumentVersion.data) — zero new
 * infrastructure, persists on DigitalOcean's managed DB. A size cap keeps the
 * database healthy.
 *
 * To scale, set the SPACES_* env vars and implement the two Spaces branches
 * below (S3-compatible). The rest of the app is unaffected — it only calls
 * saveFile()/readFile() and never touches the backend directly.
 */

// 50 MB cap. Larger legal files (discovery, medical records) need object storage
// — set the SPACES_* env vars to lift this further (see saveFile below).
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const SPACES_ENABLED = !!(
  process.env.SPACES_BUCKET &&
  process.env.SPACES_KEY &&
  process.env.SPACES_SECRET &&
  process.env.SPACES_ENDPOINT
);

export type StoredRef = { storageKey: string | null; data: Uint8Array<ArrayBuffer> | null };

/** Persist a file. Returns how/where it was stored. */
export async function saveFile(buffer: Buffer, key: string): Promise<StoredRef> {
  if (SPACES_ENABLED) {
    // TODO(scale): upload to DigitalOcean Spaces (S3-compatible) via @aws-sdk/client-s3
    //   await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: buffer }))
    //   return { storageKey: key, data: null }
    throw new Error("Spaces backend not yet implemented");
  }
  // DB-backed MVP. Build a Uint8Array over a concrete ArrayBuffer so the type
  // matches Prisma's Bytes input (Uint8Array<ArrayBuffer>, not <ArrayBufferLike>).
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  return { storageKey: null, data: bytes };
}

/** Read a file back from wherever it was stored. */
export async function readFile(ref: {
  storageKey: string | null;
  data: Uint8Array | null;
}): Promise<Buffer> {
  if (ref.storageKey) {
    if (!SPACES_ENABLED) throw new Error("File is in Spaces but Spaces is not configured");
    // TODO(scale): download from Spaces
    throw new Error("Spaces backend not yet implemented");
  }
  if (ref.data) return Buffer.from(ref.data);
  throw new Error("No file data available");
}

export function isSpacesEnabled() {
  return SPACES_ENABLED;
}
