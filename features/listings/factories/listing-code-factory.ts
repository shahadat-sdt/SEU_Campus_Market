import crypto from "crypto";

export function createListingCode(title: string) {
  const prefix = title
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");

  return `${prefix}-${crypto.randomInt(1000, 9999)}`;
}
