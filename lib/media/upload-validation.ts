import { MediaType } from "@prisma/client";

export type SafeUploadKind = { mime: string; extension: string; type: MediaType };

function text(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

const signatures = [
  { mime: "image/jpeg", extension: ".jpg", type: MediaType.IMAGE, test: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { mime: "image/png", extension: ".png", type: MediaType.IMAGE, test: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  { mime: "image/webp", extension: ".webp", type: MediaType.IMAGE, test: (bytes: Uint8Array) => bytes.length >= 12 && text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP" },
  { mime: "image/gif", extension: ".gif", type: MediaType.IMAGE, test: (bytes: Uint8Array) => text(bytes, 0, 6) === "GIF87a" || text(bytes, 0, 6) === "GIF89a" },
  { mime: "video/mp4", extension: ".mp4", type: MediaType.VIDEO, test: (bytes: Uint8Array) => bytes.length >= 12 && text(bytes, 4, 8) === "ftyp" },
] as const;

export function detectSafeUpload(buffer: Buffer | Uint8Array): SafeUploadKind | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return signatures.find((signature) => signature.test(bytes)) ?? null;
}

export function isSafeUpload(buffer: Buffer | Uint8Array, mime: string) {
  const detected = detectSafeUpload(buffer);
  return detected?.mime === mime ? detected : null;
}
