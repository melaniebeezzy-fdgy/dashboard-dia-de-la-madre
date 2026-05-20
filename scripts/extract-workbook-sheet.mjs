import fs from "node:fs/promises";
import path from "node:path";

const [, , extractedDir, sheetNumber, outputPath] = process.argv;

if (!extractedDir || !sheetNumber || !outputPath) {
  console.error("Usage: node scripts/extract-workbook-sheet.mjs <xlsx-dir> <sheet-number> <output.csv>");
  process.exit(1);
}

function decodeXml(value = "") {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function columnIndex(cellRef = "") {
  const letters = cellRef.replace(/[0-9]/g, "");
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return index - 1;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function readSharedStrings() {
  const file = path.join(extractedDir, "xl", "sharedStrings.xml");
  const xml = await fs.readFile(file, "utf8");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => {
    const parts = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    return parts.join("");
  });
}

function readCellValue(cellXml, sharedStrings) {
  const type = cellXml.match(/<c[^>]*\st="([^"]+)"/)?.[1];
  if (type === "inlineStr") {
    return decodeXml(cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "");
  }
  const raw = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  return decodeXml(raw);
}

const sharedStrings = await readSharedStrings();
const sheetXml = await fs.readFile(path.join(extractedDir, "xl", "worksheets", `sheet${sheetNumber}.xml`), "utf8");
const rows = [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
  const row = [];
  for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*\sr="([^"]+)"[^>]*>[\s\S]*?<\/c>/g)) {
    row[columnIndex(cellMatch[1])] = readCellValue(cellMatch[0], sharedStrings);
  }
  return row.map((value) => value ?? "");
});

const maxColumns = Math.max(...rows.map((row) => row.length));
const csv = rows
  .map((row) => Array.from({ length: maxColumns }, (_, index) => csvEscape(row[index] ?? "")).join(","))
  .join("\n");

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, csv, "utf8");
console.log(`Wrote ${rows.length} rows to ${outputPath}`);
