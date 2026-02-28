import { createCipheriv } from "node:crypto";
import { KrsValidationError } from "./errors.js";
import { normalizeKrs, normalizeRdn } from "./normalize.js";

const DEFAULT_SECRET = "TopSecretApiKey1";

const KRS_POSITIONS = [193, 8, 327, 501, 112, 74, 409, 226, 16, 306] as const;
const TIMESTAMP_POSITIONS = [492, 141, 364, 78, 259, 12, 430, 384, 97, 503, 67, 35, 471, 218] as const;
const CHECKSUM_POSITIONS = [24, 46, 174, 345] as const;
const SHIFT_MARKER_POSITION = 11;

function encryptIdentifier(value: string, secret = DEFAULT_SECRET): string {
  if (secret.length !== 16) {
    throw new KrsValidationError("AES secret key must be exactly 16 characters");
  }

  const key = Buffer.from(secret, "utf8");
  const iv = Buffer.from(secret, "utf8");
  const cipher = createCipheriv("aes-128-cbc", key, iv);

  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

function formatTimestamp(now: Date): string {
  const pad2 = (value: number): string => value.toString().padStart(2, "0");

  return [
    now.getFullYear().toString(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    pad2(now.getHours()),
    pad2(now.getMinutes()),
    pad2(now.getSeconds())
  ].join("");
}

function randomDigit(): string {
  return Math.floor(Math.random() * 10).toString();
}

function shiftRightInsert(array: string[], index: number): void {
  for (let i = array.length - 1; i > index; i -= 1) {
    array[i] = array[i - 1] as string;
  }
  array[index] = "0";
}

export function encryptKrs(value: string, secret = DEFAULT_SECRET): string {
  return encryptIdentifier(normalizeKrs(value), secret);
}

export function encryptRdn(value: string, secret = DEFAULT_SECRET): string {
  return encryptIdentifier(normalizeRdn(value), secret);
}

export function generateApiKey(now = new Date(), krs = "0000000000"): string {
  const normalizedKrs = normalizeKrs(krs);
  const timestamp = formatTimestamp(now);

  const arr = Array.from({ length: 512 }, () => randomDigit());

  for (let i = 508; i < 512; i += 1) {
    arr[i] = "0";
  }

  KRS_POSITIONS.forEach((position, idx) => {
    arr[position] = normalizedKrs[idx] as string;
  });

  TIMESTAMP_POSITIONS.forEach((position, idx) => {
    arr[position] = timestamp[idx] as string;
  });

  const shiftValue = Math.floor(Math.random() * 9) + 1;
  arr[SHIFT_MARKER_POSITION] = shiftValue.toString();

  CHECKSUM_POSITIONS.forEach((position) => {
    shiftRightInsert(arr, position);
    arr[position] = "0";
  });

  const sum = arr.reduce((acc, value) => acc + Number(value), 0);
  const checksum = (sum % 10000).toString().padStart(4, "0");

  CHECKSUM_POSITIONS.forEach((position, idx) => {
    arr[position] = checksum[idx] as string;
  });

  const copy = [...arr];
  for (let i = 0; i < arr.length; i += 1) {
    arr[(i + shiftValue) % arr.length] = copy[i] as string;
  }

  return arr.join("");
}
