import fs from "node:fs/promises";
import path from "node:path";

const [, , extractedDir, outputPath] = process.argv;

if (!extractedDir || !outputPath) {
  console.error("Usage: node scripts/extract-mep-sheets-generic.mjs <xlsx-dir> <output.csv>");
  process.exit(1);
}

const COUNTRY = process.env.MEP_COUNTRY || "";
const SKU_INDEX = Number(process.env.MEP_SKU_INDEX ?? 3);
const NAME_INDEX = Number(process.env.MEP_NAME_INDEX ?? 4);
const CLASSIFICATION_INDEX = Number(process.env.MEP_CLASSIFICATION_INDEX ?? 0);
const SUGGESTED_INDEX = Number(process.env.MEP_SUGGESTED_INDEX ?? 14);
const KITCHEN_ROW_INDEX = Number(process.env.MEP_KITCHEN_ROW_INDEX ?? 1);
const KITCHEN_COL_INDEX = Number(process.env.MEP_KITCHEN_COL_INDEX ?? 1);

const EXCLUDED_NAMES = [
  "ejecucion mep",
  "input adu",
  "input items x estacion",
  "input explosiones",
  "input mix",
  "sku x subcategoria",
  "recetas",
  "control",
  "ddmrp x hora",
  "incrementales dias especiales",
];

const COL_KITCHEN_ID_BY_SHEET = new Map([
  ["Usaquen+Turbo", "01 USAQUEN"],
  ["Andes+Turbo", "08 ANDES"],
  ["Colina+Turbo", "06 COLINA"],
  ["Parque 93", "02 PARQUE 93"],
  ["Chia", "13 CHIA"],
  ["Engativa", "15 ENGATIVA"],
  ["Villa del Prado+Turbo", "36 VILLA DEL PRADO"],
  ["Chapinero+Turbo", "03 CHAPINERO"],
  ["Kennedy+Turbo", "38 KENNEDY"],
  ["Veraguas", "45 VERAGUAS"],
  ["Chico+Turbo", "50 CHICO"],
  ["Calle 109+Turbo", "65 CALLE 109"],
  ["Plaza Claro court", "66 PLAZA CLARO CINNA"],
  ["Arrecife", "69 ARRECIFE"],
  ["Ingenio", "46 INGENIO"],
  ["San Fernando+Turbo", "24 SAN FERNANDO"],
  ["Cabecera+Turbo", "42 CABECERA"],
  ["Pereira", "28 PEREIRA"],
  ["Cartagena", "33 CARTAGENA"],
  ["Barranquilla+Turbo", "32 BARRANQUILLA"],
  ["Santa Monica+Turbo", "22 SANTA MONICA"],
  ["Manila+Turbo", "11 MANILA"],
  ["Bello", "18 BELLO"],
  ["Itagui", "29 ITAGUI"],
  ["Envigado", "14 ENVIGADO"],
  ["Laureles+Turbo", "12 LAURELES"],
]);

function decodeXml(value = "") {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function columnIndex(cellRef = "") {
  const letters = cellRef.replace(/[0-9]/g, "");
  let index = 0;
  for (const letter of letters) index = index * 26 + (letter.charCodeAt(0) - 64);
  return index - 1;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function readSharedStrings() {
  const xml = await fs.readFile(path.join(extractedDir, "xl", "sharedStrings.xml"), "utf8");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => {
    const parts = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    return parts.join("");
  });
}

function readCellValue(cellXml, sharedStrings) {
  const type = cellXml.match(/<c[^>]*\st="([^"]+)"/)?.[1];
  if (type === "inlineStr") return decodeXml(cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "");
  const raw = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  return decodeXml(raw);
}

function parseRows(sheetXml, sharedStrings) {
  return [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*\sr="([^"]+)"[^>]*>[\s\S]*?<\/c>/g)) {
      row[columnIndex(cellMatch[1])] = readCellValue(cellMatch[0], sharedStrings);
    }
    return row.map((value) => String(value ?? "").trim());
  });
}

function workbookSheets(workbookXml) {
  return [...workbookXml.matchAll(/<sheet\s+([^>]+?)\/>/g)].map((match) => {
    const attrs = match[1];
    return {
      name: decodeXml(attrs.match(/name="([^"]+)"/)?.[1] || ""),
      state: attrs.match(/state="([^"]+)"/)?.[1] || "visible",
      relId: attrs.match(/r:id="([^"]+)"/)?.[1] || "",
    };
  });
}

function workbookRelationships(relsXml) {
  const map = new Map();
  for (const match of relsXml.matchAll(/<Relationship\s+([^>]+?)\/>/g)) {
    const attrs = match[1];
    const id = attrs.match(/Id="([^"]+)"/)?.[1];
    const target = attrs.match(/Target="([^"]+)"/)?.[1];
    if (id && target?.startsWith("worksheets/")) map.set(id, target);
  }
  return map;
}

const sharedStrings = await readSharedStrings();
const workbookXml = await fs.readFile(path.join(extractedDir, "xl", "workbook.xml"), "utf8");
const relsXml = await fs.readFile(path.join(extractedDir, "xl", "_rels", "workbook.xml.rels"), "utf8");
const rels = workbookRelationships(relsXml);
const sheets = workbookSheets(workbookXml)
  .filter((sheet) => sheet.state === "visible")
  .filter((sheet) => !EXCLUDED_NAMES.some((name) => normalizeKey(sheet.name).startsWith(name)));

const outputRows = [];
const kitchenIds = new Set();

for (const sheet of sheets) {
  const target = rels.get(sheet.relId);
  if (!target) continue;
  const sheetXml = await fs.readFile(path.join(extractedDir, "xl", target), "utf8");
  const matrix = parseRows(sheetXml, sharedStrings);
  const kitchenId = COL_KITCHEN_ID_BY_SHEET.get(sheet.name) || matrix[KITCHEN_ROW_INDEX]?.[KITCHEN_COL_INDEX] || "";
  if (!kitchenId) continue;
  kitchenIds.add(kitchenId);

  const headerIndex = matrix.findIndex((row) =>
    row.some((cell) => normalizeKey(cell) === "sku")
    && row.some((cell) => ["nombre", "name", "producto", "product"].includes(normalizeKey(cell)))
  );
  const firstDataIndex = headerIndex >= 0 ? headerIndex + 1 : 4;

  for (const row of matrix.slice(firstDataIndex)) {
    const classification = row[CLASSIFICATION_INDEX] || "";
    const sku = row[SKU_INDEX] || "";
    const name = row[NAME_INDEX] || "";
    const suggested = row[SUGGESTED_INDEX] || "";
    if (!sku || !name || !suggested) continue;
    outputRows.push({
      sheet_name: sheet.name,
      country: COUNTRY || matrix[0]?.[1] || "",
      city: "",
      kitchen_id: kitchenId,
      sku,
      name,
      product: name,
      mep_classification: classification,
      suggested_units: suggested,
    });
  }
}

const headers = ["sheet_name", "country", "city", "kitchen_id", "sku", "name", "product", "mep_classification", "suggested_units"];
const csv = [
  headers.join(","),
  ...outputRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
].join("\n");

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, csv, "utf8");
console.log(`Wrote ${outputRows.length} rows from ${kitchenIds.size} kitchens to ${outputPath}`);
console.log([...kitchenIds].sort().join("\n"));
