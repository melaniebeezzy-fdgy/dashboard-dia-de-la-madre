import fs from "node:fs";
import { pipeline } from "node:stream/promises";

const [, , url, output] = process.argv;

if (!url || !output) {
  console.error("Usage: node scripts/download-url.mjs <url> <output>");
  process.exit(1);
}

const response = await fetch(url, {
  headers: {
    "User-Agent": "Codex Dashboard Downloader",
  },
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

await pipeline(response.body, fs.createWriteStream(output));
console.log(`Downloaded ${output}`);
