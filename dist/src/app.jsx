import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import * as Recharts from "https://esm.sh/recharts@2.15.4?deps=react@18.3.1,react-dom@18.3.1";
import Papa from "https://esm.sh/papaparse@5.4.1";

const {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  LabelList,
  ComposedChart,
  ReferenceDot,
} = Recharts;

const MAIN_SHEET_ID = "1MTVbU3MSIqEFqUcme_Xk2IEPkBIG4OcdWx05zBeBgBc";
const SUGGESTED_MEP_ID = "1AMOmyjfj-9INhEwEIl-3EpSwhxUlPTk88H6BklO4OQo";
const MOTHERS_DAY_2026 = "2026-05-10";
const MOTHERS_DAY_2025 = "2025-05-11";
const DATA_VERSION = "mex-20260526-if-24";

const DEFAULT_SHEETS = [
  { key: "mep", label: "MEP", sheet: "", gid: "", localPath: "/data/mep.csv", keepDuplicates: true },
  { key: "ddmrp", label: "DDMRP", sheet: "", gid: "", localPath: "/data/ddmrp.csv", keepDuplicates: true },
  { key: "orders", label: "Orders", sheet: "", gid: "", localPath: "/data/orders.csv", keepDuplicates: true },
  { key: "ventas", label: "GMV", sheet: "", gid: "", localPath: "/data/gmv.csv", keepDuplicates: true },
  { key: "comparison", label: "Orders Comparison", sheet: "", gid: "", localPath: "/data/orders-comparison.csv" },
  { key: "protocolos", label: "Protocolos", sheet: "", gid: "", localPath: "/data/protocolos.csv", keepDuplicates: true },
  { key: "infull", label: "IF", sheet: "", gid: "", localPath: "/data/if.csv", keepDuplicates: true },
  { key: "quejas", label: "Quejas", sheet: "", gid: "", localPath: "/data/quejas.csv", keepDuplicates: true },
];

const SUGGESTED_SHEETS = [
  { key: "suggestedMep", label: "Sugerido MEP - 26 cocinas", sheet: "", gid: "", localPath: "/data/suggested-mep-all.csv", keepDuplicates: true },
];

const FIELD_ALIASES = {
  country: ["pais", "país", "country"],
  city: ["ciudad", "city", "municipio"],
  kitchen: ["kitchen_id", "kitchen id", "cocina", "kitchen", "store", "tienda", "sede", "dark kitchen", "local"],
  brand: ["brand", "marca"],
  sku: ["sku", "id sku", "product sku", "item sku", "plu"],
  product: ["description", "name", "producto", "product", "item", "nombre producto", "product name", "descripcion", "descripción"],
  period: ["periodo", "period", "daypart", "franja", "momento"],
  hour: ["hora", "hour", "created hour", "order hour", "order_received_at_local", "time slot", "franja horaria"],
  date: ["order_day", "order day", "day", "fecha", "date", "created date", "order date", "dia", "día"],
  orderId: ["order id", "order_id", "id orden", "orden", "pedido", "id pedido"],
  orders: ["Total orders", "total_orders", "total orders", "orders", "ordenes", "órdenes", "total ordenes", "total órdenes"],
  gmv: ["gmv_nac", "gmv nac", "total_price_gross", "total price gross", "gross price", "gmv", "venta", "ventas", "revenue", "valor", "monto", "sales", "importe", "total"],
  units: ["sum(quantity)", "sum quantity", "total_units", "total units", "unidades", "units", "qty", "quantity", "cantidad", "items", "unidades vendidas"],
  itemType: ["item_type", "item type", "tipo item", "tipo de item"],
  rtwt: ["RTWT", "rtwt", "rt wait time", "rider waiting time", "tiempo rt", "tiempo espera rt", "wait time"],
  cooking: ["cooking_time", "cooking time", "cook time", "cooking", "tiempo cocina", "tiempo de cocina", "preparation time", "prep time"],
  rtWait: ["time_waiting_RT", "time waiting rt", "espera rt cocina", "espera rt", "tiempo de espera del rt", "rt espera", "rider wait in kitchen", "rt kitchen waiting"],
  suggestedType: ["mep_classification", "tipo", "clasificacion", "clasificación", "categoria", "categoría", "mep", "segmento"],
  suggestedQty: ["suggested_units", "sugerido", "mep sugerido", "cantidad sugerida", "qty sugerido", "unidades sugeridas", "forecast", "projection"],
  protocols: ["Protocolos activos", "protocolos activos", "protocolos", "active protocols"],
  inFullNoi: ["# In Full noi", "in full noi", "infull noi", "ordenes sin quejas", "ordenes sin queja"],
  comment: ["comments", "comment", "comentarios", "comentario"],
  complaint: ["complaint", "queja", "quejas"],
  reason: ["reason", "rating_tag", "reason_category", "motivo"],
  reasonArea: ["reason_area", "area", "responsable"],
  provider: ["provider_name", "provider", "plataforma"],
  rating: ["rating", "calificacion", "calificación"],
};

const COLORS = ["#156082", "#0F9ED5", "#96607D", "#C19EB1", "#467886", "#153D64", "#345964", "#0B769F"];
const PROTOCOL_KITCHENS = new Set();

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeText(value) {
  const text = String(value ?? "").trim();
  if (!text) return "Sin dato";
  return text
    .replace(/\s+/g, " ")
    .replace(/[|_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeCountry(value) {
  const text = String(value ?? "").trim();
  if (!text) return "Sin dato";
  const normalized = normalizeKey(text).toUpperCase();
  if (normalized === "COLOMBIA") return "COL";
  if (normalized === "MEXICO" || normalized === "MEXICO") return "MEX";
  return normalized;
}

function normalizeCity(value) {
  const text = normalizeText(value);
  const key = normalizeKey(text);
  if (key === "ciudad de ma c xico" || key === "ciudad de ma xico" || key === "ciudad de mexico" || key === "zona centro") {
    return "Ciudad de México";
  }
  if (key === "merida") return "Merida";
  return text;
}

function normalizeSku(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Sin dato";
  const numeric = Number(raw.replace(",", "."));
  if (Number.isFinite(numeric) && Number.isInteger(numeric)) return String(numeric);
  return normalizeKey(raw).replace(/\s+/g, "");
}

function kitchenMatchKey(value) {
  return normalizeKey(value).replace(/^\d+\s+/, "");
}

function hasProtocolKitchen(value) {
  return PROTOCOL_KITCHENS.has(normalizeText(value));
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null || value === "") return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  let cleaned = raw.replace(/[^\d,.-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHour(value) {
  if (value == null || value === "") return "Sin hora";
  if (typeof value === "number" && Number.isFinite(value)) return `${String(Math.floor(value)).padStart(2, "0")}:00`;
  const text = String(value).trim();
  const timeMatch = text.match(/(\d{1,2})(?::\d{2})?/);
  if (timeMatch) {
    const hour = Math.min(23, Math.max(0, Number(timeMatch[1])));
    return `${String(hour).padStart(2, "0")}:00`;
  }
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return `${String(date.getHours()).padStart(2, "0")}:00`;
  return "Sin hora";
}

function hourNumber(value) {
  const label = parseHour(value);
  const hour = Number(String(label).slice(0, 2));
  return Number.isFinite(hour) ? hour : null;
}

function isBeverageProduct(row, schema) {
  const product = normalizeKey(getValue(row, schema, "product"));
  const category = normalizeKey(getValue(row, schema, "category"));
  const skuName = `${product} ${category}`;
  return [
    "jugo",
    "juice",
    "agua",
    "gaseosa",
    "soda",
    "limonada",
    "mandarina",
    "naranja",
    "bebida",
    "drink",
    "coca cola",
    "sprite",
    "cola",
  ].some((term) => skuName.includes(term));
}

function parseDateKey(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim())) {
    const serial = toNumber(value);
    if (serial > 30000 && serial < 60000) {
      const utc = Date.UTC(1899, 11, 30) + serial * 86400000;
      const date = new Date(utc);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }
    return "";
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) return `${slash[3]}-${String(slash[2]).padStart(2, "0")}-${String(slash[1]).padStart(2, "0")}`;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inferPeriod(hourLabel) {
  const hour = Number(String(hourLabel).slice(0, 2));
  if (!Number.isFinite(hour)) return "Sin periodo";
  if (hour < 11) return "Desayuno";
  if (hour < 16) return "Almuerzo";
  if (hour < 21) return "Cena";
  return "Noche";
}

function buildGmvBenchmarkByHour(rows, schema) {
  const previousSundays = [-7, -14, -21, -28, -35].map((days) => addDays(MOTHERS_DAY_2026, days));
  const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
  const byDateHour = new Map();

  rows.forEach((row) => {
    const date = parseDateKey(getValue(row, schema, "date"));
    const hour = parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"));
    if (!date || hour === "Sin hora") return;
    const key = `${date}||${hour}`;
    byDateHour.set(key, (byDateHour.get(key) || 0) + toNumber(getValue(row, schema, "gmv")));
  });

  const hourSet = new Set([
    ...hours,
    ...[...byDateHour.keys()].map((key) => key.split("||")[1]),
  ]);

  return [...hourSet].sort().map((hour) => {
    const priorValues = previousSundays.map((date) => byDateHour.get(`${date}||${hour}`) || 0);
    const priorAverage = priorValues.reduce((sum, value) => sum + value, 0) / previousSundays.length;
    const current = byDateHour.get(`${MOTHERS_DAY_2026}||${hour}`) || 0;
    const lastYear = byDateHour.get(`${MOTHERS_DAY_2025}||${hour}`) || 0;
    return {
      hour,
      currentGmv: current,
      lastYearGmv: lastYear,
      priorSundaysAvgGmv: priorAverage,
      currentVsPriorAvg: priorAverage ? ((current - priorAverage) / priorAverage) * 100 : null,
      currentVsLastYear: lastYear ? ((current - lastYear) / lastYear) * 100 : null,
    };
  }).filter((row) => row.currentGmv || row.lastYearGmv || row.priorSundaysAvgGmv);
}

function buildGmvHistoricalDaily(rows, schema, currentGmv) {
  const grouped = new Map();
  rows.forEach((row) => {
    const dateValue = getValue(row, schema, "date");
    const label = parseDateKey(dateValue) || String(dateValue || "Sin fecha").trim();
    if (!label || label === "Sin fecha") return;
    if (!grouped.has(label)) grouped.set(label, { label, gmv: 0, orders: 0 });
    const item = grouped.get(label);
    item.gmv += toNumber(getValue(row, schema, "gmv"));
    item.orders += toNumber(getValue(row, schema, "orders"));
  });

  const groups = [...grouped.values()].filter((item) => item.gmv).sort((a, b) => b.gmv - a.gmv);
  if (!groups.length) return [];

  const current = groups.reduce((best, item) => (
    Math.abs(item.gmv - currentGmv) < Math.abs(best.gmv - currentGmv) ? item : best
  ), groups[0]);
  const remaining = groups.filter((item) => item.label !== current.label);
  const lastYear = remaining[0] || { gmv: 0, orders: 0 };
  const previous = remaining.slice(1);
  const previousAverage = previous.length
    ? previous.reduce((sum, item) => sum + item.gmv, 0) / previous.length
    : 0;

  return [
    { benchmark: "Día de la Madre anterior", gmv: lastYear.gmv, orders: lastYear.orders },
    { benchmark: "Promedio 5 domingos anteriores", gmv: previousAverage, orders: previous.length ? previous.reduce((sum, item) => sum + item.orders, 0) / previous.length : 0 },
    { benchmark: "Día de la Madre 2026", gmv: current.gmv, orders: current.orders },
  ];
}

function buildGmvHistoricalByKitchen(rows, schema, currentTotalGmv) {
  const dayKitchenMap = new Map();
  rows.forEach((row) => {
    const day = parseDateKey(getValue(row, schema, "date")) || String(getValue(row, schema, "date") || "Sin fecha").trim();
    const kitchen = normalizeText(getValue(row, schema, "kitchen"));
    if (!day || day === "Sin fecha" || kitchen === "Sin dato") return;
    const key = `${day}||${kitchen}`;
    if (!dayKitchenMap.has(key)) dayKitchenMap.set(key, { day, kitchen, gmv: 0 });
    dayKitchenMap.get(key).gmv += toNumber(getValue(row, schema, "gmv"));
  });

  const dayTotals = new Map();
  dayKitchenMap.forEach((item) => {
    dayTotals.set(item.day, (dayTotals.get(item.day) || 0) + item.gmv);
  });
  const days = [...dayTotals.entries()].sort((a, b) => b[1] - a[1]);
  const currentDay = days.reduce((best, item) => (
    Math.abs(item[1] - currentTotalGmv) < Math.abs(best[1] - currentTotalGmv) ? item : best
  ), days[0])?.[0];
  const remainingDays = days.map(([day]) => day).filter((day) => day !== currentDay);
  const previousMotherDay = remainingDays[0];
  const previousSundays = remainingDays.slice(1);
  const kitchens = [...new Set([...dayKitchenMap.values()].map((item) => item.kitchen))];

  return kitchens.map((kitchen) => {
    const current = dayKitchenMap.get(`${currentDay}||${kitchen}`)?.gmv || 0;
    const lastYear = dayKitchenMap.get(`${previousMotherDay}||${kitchen}`)?.gmv || 0;
    const avg = previousSundays.length
      ? previousSundays.reduce((sum, day) => sum + (dayKitchenMap.get(`${day}||${kitchen}`)?.gmv || 0), 0) / previousSundays.length
      : 0;
    return { kitchen, currentGmv: current, lastYearGmv: lastYear, priorSundaysAvgGmv: avg };
  }).filter((item) => item.currentGmv || item.lastYearGmv || item.priorSundaysAvgGmv)
    .sort((a, b) => b.currentGmv - a.currentGmv);
}

function selectCurrentGmvRows(rows, schema) {
  const exactRows = rows.filter((row) => parseDateKey(getValue(row, schema, "date")) === MOTHERS_DAY_2026);
  if (exactRows.length) return exactRows;

  const groups = new Map();
  rows.forEach((row) => {
    const label = String(getValue(row, schema, "date") || "Sin fecha").trim();
    if (!groups.has(label)) groups.set(label, { rows: [], gmv: 0 });
    const item = groups.get(label);
    item.rows.push(row);
    item.gmv += toNumber(getValue(row, schema, "gmv"));
  });
  const current = [...groups.values()].sort((a, b) => b.gmv - a.gmv)[0];
  return current?.rows || rows;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value, digits = 0) {
  const safeDigits = Number.isFinite(Number(digits)) ? Number(digits) : 0;
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: safeDigits,
    minimumFractionDigits: safeDigits,
  }).format(value || 0);
}

function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "N/D";
  return `${formatNumber(value, digits)}%`;
}

function findColumn(columns, aliases) {
  const normalized = columns.map((column) => ({ original: column, key: normalizeKey(column) }));
  for (const alias of aliases) {
    const aliasKey = normalizeKey(alias);
    const exact = normalized.find((column) => column.key === aliasKey);
    if (exact) return exact.original;
  }
  for (const alias of aliases) {
    const aliasKey = normalizeKey(alias);
    const partial = normalized.find((column) => column.key.includes(aliasKey) || aliasKey.includes(column.key));
    if (partial) return partial.original;
  }
  return null;
}

function detectSchema(rows) {
  const columns = Object.keys(rows?.[0] || {});
  const schema = {};
  Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
    schema[field] = findColumn(columns, aliases);
  });
  return { columns, schema };
}

function getValue(row, schema, field) {
  const column = schema?.[field];
  return column ? row[column] : undefined;
}

function cleanRows(rows) {
  const seen = new Set();
  return rows
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""))
    .filter((row) => {
      const signature = JSON.stringify(row);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
}

function aggregate(rows, schema, dimensions, measures = {}) {
  const map = new Map();
  rows.forEach((row) => {
    const values = dimensions.map((dimension) => {
      if (dimension === "city") return normalizeCity(getValue(row, schema, "city"));
      if (dimension === "hour") return parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"));
      if (dimension === "period") {
        const direct = getValue(row, schema, "period");
        return direct ? normalizeText(direct) : inferPeriod(parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date")));
      }
      return normalizeText(getValue(row, schema, dimension));
    });
    const key = values.join("||");
    if (!map.has(key)) {
      const item = {};
      dimensions.forEach((dimension, index) => {
        item[dimension] = values[index];
      });
      item.gmv = 0;
      item.units = 0;
      item.orders = 0;
      item.rtwtSum = 0;
      item.rtwtCount = 0;
      item.cookingSum = 0;
      item.cookingCount = 0;
      item.rtWaitSum = 0;
      item.rtWaitCount = 0;
      map.set(key, item);
    }
    const item = map.get(key);
    item.gmv += toNumber(getValue(row, schema, "gmv"));
    item.units += toNumber(getValue(row, schema, "units")) || 1;
    const orderId = getValue(row, schema, "orderId");
    const orderMeasure = toNumber(getValue(row, schema, "orders"));
    const rowWeight = orderMeasure || 1;
    if (orderMeasure) {
      item.orders += orderMeasure;
    } else {
      item.orders += measures.countRowsAsOrders || !orderId ? 1 : 0;
    }
    if (measures.orderSet && orderId) {
      const setKey = `${key}||${orderId}`;
      if (!measures.orderSet.has(setKey)) {
        item.orders += 1;
        measures.orderSet.add(setKey);
      }
    }
    const rtwt = toNumber(getValue(row, schema, "rtwt"));
    const cooking = toNumber(getValue(row, schema, "cooking"));
    const rtWait = toNumber(getValue(row, schema, "rtWait"));
    if (rtwt) { item.rtwtSum += rtwt * rowWeight; item.rtwtCount += rowWeight; }
    if (cooking) { item.cookingSum += cooking * rowWeight; item.cookingCount += rowWeight; }
    if (rtWait) { item.rtWaitSum += rtWait * rowWeight; item.rtWaitCount += rowWeight; }
  });
  return [...map.values()].map((item) => ({
    ...item,
    ticket: item.orders ? item.gmv / item.orders : 0,
    rtwt: item.rtwtCount ? item.rtwtSum / item.rtwtCount : 0,
    cooking: item.cookingCount ? item.cookingSum / item.cookingCount : 0,
    rtWait: item.rtWaitCount ? item.rtWaitSum / item.rtWaitCount : 0,
  }));
}

function aggregateInFull(rows, schema, dimensions, kitchenCityMap = new Map()) {
  const map = new Map();
  rows.forEach((row) => {
    const values = dimensions.map((dimension) => {
      if (dimension === "city") {
        const direct = getValue(row, schema, "city");
        const kitchen = normalizeText(getValue(row, schema, "kitchen"));
        return direct ? normalizeCity(direct) : (kitchenCityMap.get(kitchen) || "Sin dato");
      }
      if (dimension === "hour") return parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"));
      return normalizeText(getValue(row, schema, dimension));
    });
    const key = values.join("||");
    if (!map.has(key)) {
      const item = {};
      dimensions.forEach((dimension, index) => {
        item[dimension] = values[index];
      });
      item.orders = 0;
      item.inFullNoi = 0;
      map.set(key, item);
    }
    const item = map.get(key);
    item.orders += toNumber(getValue(row, schema, "orders"));
    item.inFullNoi += toNumber(getValue(row, schema, "inFullNoi"));
  });
  return [...map.values()].map((item) => ({
    ...item,
    inFull: item.orders ? (item.inFullNoi / item.orders) * 100 : 0,
  }));
}

function buildInFullComparison(rows, schema, kitchenCityMap) {
  const dayTotals = aggregateInFull(rows, schema, ["date"], kitchenCityMap)
    .filter((item) => item.date !== "Sin dato" && item.orders > 0)
    .sort((a, b) => (toNumber(b.date) - toNumber(a.date)) || b.orders - a.orders);
  const currentDay = dayTotals[0]?.date || "";
  const previousDay = dayTotals.find((item) => item.date !== currentDay)?.date || "";
  const currentRows = rows.filter((row) => normalizeText(getValue(row, schema, "date")) === currentDay);
  const previousRows = rows.filter((row) => normalizeText(getValue(row, schema, "date")) === previousDay);
  const currentTotal = aggregateInFull(currentRows, schema, [], kitchenCityMap)[0] || { orders: 0, inFullNoi: 0, inFull: 0 };
  const previousTotal = aggregateInFull(previousRows, schema, [], kitchenCityMap)[0] || { orders: 0, inFullNoi: 0, inFull: 0 };
  const previousKitchen = new Map(
    aggregateInFull(previousRows, schema, ["city", "kitchen"], kitchenCityMap).map((item) => [item.kitchen, item])
  );
  const byKitchen = aggregateInFull(currentRows, schema, ["city", "kitchen"], kitchenCityMap)
    .filter((item) => item.kitchen !== "Sin dato")
    .map((item) => {
      const previous = previousKitchen.get(item.kitchen) || { inFull: null, orders: 0 };
      const hasPrevious = previous.orders > 0 && Number.isFinite(previous.inFull);
      const delta = hasPrevious ? item.inFull - previous.inFull : null;
      return {
        ...item,
        prevInFull: hasPrevious ? previous.inFull : null,
        prevOrders: previous.orders || 0,
        inFullDelta: delta,
        inFullVariation: hasPrevious ? ((item.inFull - previous.inFull) / previous.inFull) * 100 : null,
      };
    })
    .sort((a, b) => a.inFull - b.inFull || b.orders - a.orders);
  const byBrand = aggregateInFull(currentRows, schema, ["brand"], kitchenCityMap)
    .filter((item) => item.brand !== "Sin dato")
    .sort((a, b) => a.inFull - b.inFull || b.orders - a.orders)
    .slice(0, 12);
  const previousHour = new Map(aggregateInFull(previousRows, schema, ["hour"], kitchenCityMap).map((item) => [item.hour, item]));
  const hourKeys = [...new Set([
    ...aggregateInFull(currentRows, schema, ["hour"], kitchenCityMap).map((item) => item.hour),
    ...previousHour.keys(),
  ])].filter((hour) => hour !== "Sin hora").sort();
  const currentHour = new Map(aggregateInFull(currentRows, schema, ["hour"], kitchenCityMap).map((item) => [item.hour, item]));
  const byHour = hourKeys.map((hour) => ({
    hour,
    inFull: currentHour.get(hour)?.inFull || 0,
    prevInFull: previousHour.get(hour)?.inFull || 0,
    orders: currentHour.get(hour)?.orders || 0,
    prevOrders: previousHour.get(hour)?.orders || 0,
  }));
  const worstCurrent = byHour.filter((item) => item.orders > 0).sort((a, b) => a.inFull - b.inFull)[0];
  const worstPrevious = byHour.filter((item) => item.prevOrders > 0).sort((a, b) => a.prevInFull - b.prevInFull)[0];
  const detail = aggregateInFull(currentRows, schema, ["city", "kitchen", "brand", "hour"], kitchenCityMap)
    .sort((a, b) => a.inFull - b.inFull || b.orders - a.orders);
  return {
    currentDay,
    previousDay,
    total: currentTotal,
    previousTotal,
    totalDelta: previousTotal.inFull ? currentTotal.inFull - previousTotal.inFull : null,
    totalVariation: previousTotal.inFull ? ((currentTotal.inFull - previousTotal.inFull) / previousTotal.inFull) * 100 : null,
    byKitchen,
    byBrand,
    byHour,
    worstCurrent,
    worstPrevious,
    detail,
  };
}

function classifyComplaint(row, schema) {
  const comment = String(getValue(row, schema, "comment") || "").trim();
  const reasonArea = normalizeKey(getValue(row, schema, "reasonArea"));
  const rating = toNumber(getValue(row, schema, "rating"));
  const text = normalizeKey([
    comment,
    getValue(row, schema, "reason"),
    getValue(row, schema, "reasonArea"),
  ].join(" "));
  const has = (terms) => terms.some((term) => text.includes(term));
  if (reasonArea.includes("pase")) {
    return { category: "Error de empaque: faltante o incorrecto", owner: "Empaque" };
  }
  if (!comment && rating > 0 && rating <= 3) {
    return { category: "Calificación baja sin comentario", owner: "Por revisar" };
  }
  if (has(["cancel", "cancelado", "cancelada", "no llego", "nunca llego", "no recibi", "no recibio", "no entreg", "missing order"])) {
    return { category: "Pedido no entregado / cancelado", owner: "Delivery / plataforma" };
  }
  if (has(["delivery late", "out time", "tarde", "demora", "espera", "tiempo", "excesivo", "retras", "late"])) {
    return { category: "Tiempos / entrega tarde", owner: "Delivery u operación" };
  }
  if (has(["pase", "missing item", "faltante", "falto", "falta", "incompleto", "completeness", "no venia", "wrong item", "equivocado", "incorrecto", "distinto", "diferente", "no pedi", "no pedí", "cambiaron", "accuracy"])) {
    return { category: "Error de empaque: faltante o incorrecto", owner: "Empaque" };
  }
  if (has(["frio", "fria", "helado", "helada", "temperatura", "wrong temperature", "cold"])) {
    return { category: "Temperatura", owner: "Cocina / delivery" };
  }
  if (has(["derram", "batido", "destrozado", "aplastado", "roto", "rota", "regad", "damage item", "damage packaging", "bolsa rota"])) {
    return { category: "Producto dañado en traslado", owner: "Delivery / empaque" };
  }
  if (has(["quality", "calidad", "malo", "mala", "feo", "horrible", "sabor", "quemado", "crudo", "duro", "seco", "bad quality"])) {
    return { category: "Calidad / sabor del producto", owner: "Cocina" };
  }
  if (has(["packaging", "empaque", "bolsa", "cubiertos", "servilleta", "tapa", "sellado", "envase"])) {
    return { category: "Empaque e insumos", owner: "Empaque" };
  }
  if (has(["presentacion", "presentación", "imagen", "presentation", "porcion", "porción", "pequeno", "pequeño", "poco"])) {
    return { category: "Presentación / porción", owner: "Cocina" };
  }
  if (has(["caro", "precio", "costoso", "valor", "cobro", "pague", "pagué", "promocion", "promoción"])) {
    return { category: "Precio / expectativa de valor", owner: "Comercial / producto" };
  }
  if (has(["nota", "instruccion", "instrucción", "request", "sin ", "extra", "topping", "toping", "topings"])) {
    return { category: "Instrucciones no cumplidas", owner: "Cocina / empaque" };
  }
  if (has(["atencion", "atención", "soporte", "servicio", "respuesta", "ayuda", "reembolso", "devolucion", "devolución"])) {
    return { category: "Soporte / atención al cliente", owner: "Soporte / plataforma" };
  }
  if (has(["rappi", "didi", "ubereats", "domiciliario", "repartidor", "driver", "delivery"])) {
    return { category: "Experiencia delivery", owner: "Delivery" };
  }
  if (rating > 0 && rating <= 3) {
    return { category: "Calificación baja", owner: "Por revisar" };
  }
  return { category: "Comentario general de experiencia", owner: "Por revisar" };
}

function groupComplaintRows(rows, key) {
  const map = new Map();
  rows.forEach((item) => {
    const value = item[key] || "Sin dato";
    if (value === "Sin dato") return;
    if (!map.has(value)) map.set(value, { [key]: value, complaints: 0, owners: new Map() });
    const target = map.get(value);
    target.complaints += 1;
    target.owners.set(item.owner, (target.owners.get(item.owner) || 0) + 1);
  });
  return [...map.values()].map((item) => ({
    ...item,
    owner: [...item.owners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Por revisar",
    share: rows.length ? (item.complaints / rows.length) * 100 : 0,
  })).sort((a, b) => b.complaints - a.complaints);
}

function buildWordCloud(rows) {
  const signals = [
    { phrase: "pedido llegó tarde", patterns: [/llego tarde|llegó tarde|demoro mucho|demoró mucho|tardo mucho|tardó mucho|tiempo de espera|espera fue excesivo|delivery late|out time|retras/g] },
    { phrase: "producto llegó frío", patterns: [/llego frio|llegó frio|llego fría|llegó fría|venia frio|venía frío|vino frio|vino frío|helado|helada|wrong temperature|cold/g] },
    { phrase: "producto faltante", patterns: [/falto|faltó|faltante|no venia|no venía|missing item|incompleto|no llego completo/g] },
    { phrase: "producto incorrecto", patterns: [/producto equivocado|producto incorrecto|wrong item|no pedi|no pedí|mandaron otro|cambiaron/g] },
    { phrase: "producto dañado", patterns: [/destrozado|batido|derramado|regado|aplastado|roto|damage item/g] },
    { phrase: "empaque dañado", patterns: [/bolsa rota|empaque roto|tapa rota|damage packaging|mal empacado|mal empaque/g] },
    { phrase: "mala calidad", patterns: [/mala calidad|mal sabor|sabor malo|horrible|feo|muy malo|bad quality|quemado|crudo|duro|seco/g] },
    { phrase: "porción pequeña", patterns: [/poca porcion|poca porción|muy pequeno|muy pequeño|porcion pequena|porción pequeña|poca cantidad|muy poco/g] },
    { phrase: "mala presentación", patterns: [/mala presentacion|mala presentación|bad presentation|no tiene nada que ver|imagen|presentacion/g] },
    { phrase: "instrucciones no cumplidas", patterns: [/no siguieron instrucciones|no leyeron nota|restaurant missed request|sin toping|sin topping|sin salsa|pedido sin/g] },
    { phrase: "pedido no entregado", patterns: [/no entreg|nunca llego|nunca llegó|no recibi|no recibí|missing order/g] },
    { phrase: "problema con repartidor", patterns: [/domiciliario|repartidor|driver|rappi|didi|ubereats|delivery/g] },
    { phrase: "soporte no resolvió", patterns: [/soporte|reembolso|devolucion|devolución|no respond|atencion|atención|ayuda/g] },
    { phrase: "precio no justifica", patterns: [/caro|costoso|precio|valor|pague|pagué|no vale/g] },
  ];
  const counts = new Map();
  rows.forEach((item) => {
    const text = normalizeKey([item.comment, item.reason, item.reasonArea].join(" "));
    signals.forEach(({ phrase, patterns }) => {
      if (patterns.some((pattern) => pattern.test(text))) counts.set(phrase, (counts.get(phrase) || 0) + 1);
    });
  });
  const values = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18);
  const max = values[0]?.[1] || 1;
  return values.map(([word, count], index) => ({
    word,
    count,
    size: index === 0 ? 42 : 12 + Math.round(Math.pow(count / max, 0.75) * 24),
  }));
}

function summarizeComplaints(rows) {
  return {
    total: rows.length,
    categories: groupComplaintRows(rows, "category"),
    brands: groupComplaintRows(rows, "brand").slice(0, 10),
    kitchens: groupComplaintRows(rows, "kitchen").slice(0, 10),
    wordCloud: buildWordCloud(rows),
    samples: rows
      .filter((item) => item.comment)
      .sort((a, b) => b.complaint - a.complaint)
      .slice(0, 80),
  };
}

function buildComplaintAnalysis(rows, schema, filters, kitchenCityMap = new Map()) {
  const complaintRows = rows
    .map((row) => {
      const kitchen = normalizeText(getValue(row, schema, "kitchen"));
      const kitchenKey = kitchenMatchKey(kitchen);
      return {
        row,
        country: normalizeCountry(getValue(row, schema, "country")),
        city: kitchenCityMap.get(kitchen) || kitchenCityMap.get(kitchenKey) || "Sin dato",
        kitchen,
        kitchenKey,
        brand: normalizeText(getValue(row, schema, "brand")),
        hour: parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date")),
        comment: String(getValue(row, schema, "comment") || "").trim(),
        complaint: toNumber(getValue(row, schema, "complaint")),
        rating: toNumber(getValue(row, schema, "rating")),
        provider: normalizeText(getValue(row, schema, "provider")),
        reason: String(getValue(row, schema, "reason") || "").trim(),
        reasonArea: String(getValue(row, schema, "reasonArea") || "").trim(),
        ...classifyComplaint(row, schema),
      };
    })
    .filter((item) => (item.complaint > 0 || item.comment) && item.category)
    .filter((item) => (!filters.country || item.country === filters.country)
      && (!filters.city || item.city === filters.city || item.city === "Sin dato")
      && (!filters.kitchen || item.kitchen === filters.kitchen || item.kitchenKey === kitchenMatchKey(filters.kitchen))
      && (!filters.brand || item.brand === filters.brand)
      && (!filters.hour || item.hour === filters.hour));

  return { rows: complaintRows, ...summarizeComplaints(complaintRows) };
}

async function fetchCsv(spreadsheetId, sheetConfig) {
  const params = new URLSearchParams({ spreadsheetId });
  if (sheetConfig.gid) params.set("gid", sheetConfig.gid);
  if (sheetConfig.sheet) params.set("sheet", sheetConfig.sheet);
  const response = await fetchWithTimeout(`/api/sheet?${params.toString()}`, {}, 25000);
  if (!response.ok) throw new Error(`${sheetConfig.label}: ${response.status}`);
  return response.text();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`Tiempo de carga agotado para ${url}`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCsv(text, options = {}) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const rows = (parsed.data || []).filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
  return options.keepDuplicates ? rows : cleanRows(rows);
}

function parseKitchenMepCsv(text) {
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: false, dynamicTyping: false });
  const matrix = (parsed.data || []).map((row) => row.map((cell) => String(cell ?? "").trim()));
  const country = matrix[0]?.[1] || "";
  const kitchenId = matrix[1]?.[1] || "";
  const headerIndex = matrix.findIndex((row) => row.some((cell) => normalizeKey(cell) === "sku") && row.some((cell) => normalizeKey(cell) === "nombre"));
  if (headerIndex < 0) return [];

  const header = matrix[headerIndex].map((cell, index) => cell || `col_${index}`);
  const keyToIndex = new Map(header.map((cell, index) => [normalizeKey(cell), index]));
  const getIndex = (aliases) => aliases.map((alias) => keyToIndex.get(normalizeKey(alias))).find((index) => Number.isInteger(index));
  const skuIndex = getIndex(["SKU"]);
  const nameIndex = getIndex(["Nombre"]);
  const itemTypeIndex = getIndex(["Clasificacion Item"]);
  const stationIndex = getIndex(["Estacion"]);
  const categoryIndex = getIndex(["Categoria"]);
  const suggestedColumnOIndex = 14;

  return matrix.slice(headerIndex + 1).map((row) => {
    const suggestedUnits = toNumber(row[suggestedColumnOIndex]);
    return {
      country,
      city: "",
      kitchen_id: kitchenId,
      sku: row[skuIndex] || "",
      name: row[nameIndex] || "",
      product: row[nameIndex] || "",
      station: row[stationIndex] || "",
      category: row[categoryIndex] || "",
      item_type: row[itemTypeIndex] || "",
      mep_classification: row[0] || "",
      suggested_units: suggestedUnits,
    };
  }).filter((row) => row.sku && row.name && row.suggested_units);
}

function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const columns = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function mergeComparison(currentByKitchen, previousByKitchen) {
  const previousMap = new Map(previousByKitchen.map((item) => [item.kitchen, item]));
  return currentByKitchen.map((item) => {
    const prev = previousMap.get(item.kitchen) || {};
    const orderGrowth = prev.orders ? ((item.orders - prev.orders) / prev.orders) * 100 : null;
    const rtwtInflation = item.rtwt - (prev.rtwt || 0);
    const cookingInflation = item.cooking - (prev.cooking || 0);
    const rtwtGrowth = prev.rtwt ? ((item.rtwt - prev.rtwt) / prev.rtwt) * 100 : 0;
    const cookingGrowth = prev.cooking ? ((item.cooking - prev.cooking) / prev.cooking) * 100 : 0;
    return {
      ...item,
      prevOrders: prev.orders || 0,
      prevRtwt: prev.rtwt || 0,
      prevCooking: prev.cooking || 0,
      orderGrowth,
      rtwtInflation,
      cookingInflation,
      rtwtGrowth,
      cookingGrowth,
      pressureIndex: (orderGrowth || 0) + rtwtGrowth + cookingGrowth,
    };
  });
}

function computeMepComparison(suggestedRows, suggestedSchema, realRows, realSchema) {
  const suggestedFiltered = suggestedRows.filter((row) => {
    const type = normalizeKey(getValue(row, suggestedSchema, "suggestedType"));
    const kitchen = normalizeKey(getValue(row, suggestedSchema, "kitchen"));
    return (type === "madres" || type.includes("mep de madres") || type.includes("madre"))
      && !kitchen.includes("plaza claro cinna");
  });

  const suggestedQtyCol = suggestedSchema.suggestedQty;
  const suggestedMap = new Map();
  suggestedFiltered.forEach((row) => {
    const key = [
      normalizeText(getValue(row, suggestedSchema, "kitchen")),
      normalizeSku(getValue(row, suggestedSchema, "sku")),
    ].join("||");
    if (!suggestedMap.has(key)) {
      suggestedMap.set(key, {
        city: normalizeText(getValue(row, suggestedSchema, "city")),
        kitchen: normalizeText(getValue(row, suggestedSchema, "kitchen")),
        sku: normalizeSku(getValue(row, suggestedSchema, "sku")),
        product: normalizeText(getValue(row, suggestedSchema, "product")),
        suggested: 0,
      });
    }
    suggestedMap.get(key).suggested += suggestedQtyCol ? toNumber(row[suggestedQtyCol]) : toNumber(getValue(row, suggestedSchema, "units"));
  });

  const realAgg = aggregate(realRows, realSchema, ["city", "kitchen", "sku", "product"], { countRowsAsOrders: true });
  const realMap = new Map();
  realAgg.forEach((item) => {
    const key = [item.kitchen, normalizeSku(item.sku)].join("||");
    if (!realMap.has(key)) realMap.set(key, { ...item, units: 0, gmv: 0 });
    const current = realMap.get(key);
    current.units += item.units;
    current.gmv += item.gmv;
    if (current.product === "Sin dato" && item.product !== "Sin dato") current.product = item.product;
    if (current.city === "Sin dato" && item.city !== "Sin dato") current.city = item.city;
  });

  return [...suggestedMap.keys()].map((key) => {
    const sug = suggestedMap.get(key) || {};
    const real = realMap.get(key) || {};
    const suggestedValue = sug.suggested || 0;
    const realValue = real.units || 0;
    const diff = realValue - suggestedValue;
    return {
      city: sug.city || real.city,
      kitchen: sug.kitchen || real.kitchen,
      sku: sug.sku || real.sku,
      product: sug.product || real.product,
      suggested: suggestedValue,
      real: realValue,
      diff,
      compliance: suggestedValue ? (realValue / suggestedValue) * 100 : null,
      accuracy: suggestedValue ? Math.max(0, (1 - Math.abs(diff) / suggestedValue) * 100) : null,
      status: diff > 0 ? "Subestimación" : diff < 0 ? "Sobreproducción" : "Exacto",
    };
  }).filter((row) => !normalizeKey(row.kitchen).includes("plaza claro"));
}

function classifyKitchen(row, medians, mep) {
  const highVolume = row.orders >= medians.orders || row.gmv >= medians.gmv;
  const highTime = row.rtwt >= medians.rtwt || row.cooking >= medians.cooking;
  const mepRow = mep.find((item) => item.kitchen === row.kitchen);
  const mepSignal = mepRow?.compliance > 115 ? "Venta real superó el MEP sugerido, posible subestimación." : mepRow?.compliance < 85 ? "MEP sugerido por encima de venta real, posible sobrepreparación." : "";
  if (highVolume && !highTime) return { type: "Alto voleo eficiente", comment: `Alta demanda con tiempos controlados. ${mepSignal}`.trim(), color: "ok" };
  if (highVolume && highTime) return { type: "Alto voleo tensionado", comment: `Alta demanda con presión operativa. RTWT elevado posiblemente asociado a saturación de cocina. ${mepSignal}`.trim(), color: "bad" };
  if (!highVolume && !highTime) return { type: "Bajo voleo estable", comment: `Demanda contenida con operación estable. ${mepSignal}`.trim(), color: "ok" };
  return { type: "Bajo voleo crítico", comment: `Bajo volumen con tiempos altos; revisar sincronización de cocina y RT. ${mepSignal}`.trim(), color: "warn" };
}

function median(values) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!clean.length) return 0;
  return clean[Math.floor(clean.length / 2)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function useDashboardData() {
  const [state, setState] = React.useState({ status: "idle", data: {}, warnings: [], errors: [] });

  const load = React.useCallback(async () => {
    setState({ status: "loading", data: {}, warnings: [], errors: [] });
    const warnings = [];
    const errors = [];
    const data = {};

    async function loadOne(spreadsheetId, config) {
      try {
        const text = config.localPath
          ? await fetchWithTimeout(`${config.localPath}?v=${DATA_VERSION}`, {}, 10000).then((response) => {
              if (!response.ok) throw new Error(`${config.label}: ${response.status}`);
              return response.text();
            })
          : await fetchCsv(spreadsheetId, config);
        const rows = config.parser === "kitchenMep" ? parseKitchenMepCsv(text) : parseCsv(text, { keepDuplicates: config.keepDuplicates });
        const detected = detectSchema(rows);
        if (!rows.length) warnings.push(`${config.label}: no se encontraron filas.`);
        if (config.key === "comparison" && !detected.schema.orders && !detected.schema.cooking) {
          warnings.push(`${config.label}: no se detectaron columnas operativas de domingo anterior. Revisa el gid de la pestaña Orders Comparison.`);
        }
        Object.entries({ city: "ciudad", kitchen: "cocina", gmv: "GMV/venta", units: "unidades", orderId: "orden", rtwt: "RTWT", cooking: "cooking time", rtWait: "espera RT" })
          .forEach(([field, label]) => {
            if (!detected.schema[field]) warnings.push(`${config.label}: no se detectó columna de ${label}.`);
          });
        const dataKey = config.appendTo || config.key;
        if (config.appendTo && data[dataKey]) {
          const mergedRows = [...data[dataKey].rows, ...rows];
          data[dataKey] = { rows: mergedRows, ...detectSchema(mergedRows), label: data[dataKey].label };
        } else {
          data[dataKey] = { rows, ...detected, label: config.appendTo ? "Sugerido MEP" : config.label };
        }
      } catch (error) {
        errors.push(`${config.label}: ${error.message}`);
        if (!config.appendTo) data[config.key] = { rows: [], columns: [], schema: {}, label: config.label };
      }
    }

    await Promise.all([
      ...DEFAULT_SHEETS.map((config) => loadOne(MAIN_SHEET_ID, config)),
      ...SUGGESTED_SHEETS.map((config) => loadOne(SUGGESTED_MEP_ID, config)),
    ]);

    setState({ status: "ready", data, warnings, errors });
  }, []);

  React.useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

function buildModel(data, filters) {
  const orders = data.orders || { rows: [], schema: {} };
  const ventas = data.ventas || { rows: [], schema: {} };
  const mep = data.mep || { rows: [], schema: {} };
  const ddmrp = data.ddmrp || { rows: [], schema: {} };
  const comparison = data.comparison || { rows: [], schema: {} };
  const protocolos = data.protocolos || { rows: [], schema: {} };
  const infull = data.infull || { rows: [], schema: {} };
  const quejas = data.quejas || { rows: [], schema: {} };
  const comparisonUsable = Boolean(comparison.schema.orders || comparison.schema.cooking || comparison.schema.rtwt || comparison.schema.rtWait);
  const suggestedMep = data.suggestedMep || { rows: [], schema: {} };
  const suggestedMepKitchenCount = new Set(
    suggestedMep.rows.map((row) => normalizeText(getValue(row, suggestedMep.schema, "kitchen"))).filter((value) => value !== "Sin dato")
  ).size;
  const protocolosRows = protocolos.rows
    .map((row) => ({
      country: normalizeCountry(getValue(row, protocolos.schema, "country")),
      kitchen: normalizeText(getValue(row, protocolos.schema, "kitchen")),
      protocols: toNumber(getValue(row, protocolos.schema, "protocols")),
    }))
    .filter((row) => !filters.country || row.country === filters.country)
    .filter((row) => row.kitchen !== "Sin dato")
    .sort((a, b) => b.protocols - a.protocols);
  PROTOCOL_KITCHENS.clear();
  protocolosRows.forEach((row) => {
    if (row.protocols > 0) PROTOCOL_KITCHENS.add(row.kitchen);
  });

  const filterRows = (source, schema) => source.filter((row) => {
    const country = normalizeCountry(getValue(row, schema, "country"));
    const city = normalizeCity(getValue(row, schema, "city"));
    const kitchen = normalizeText(getValue(row, schema, "kitchen"));
    const brand = normalizeText(getValue(row, schema, "brand"));
    const sku = normalizeText(getValue(row, schema, "sku"));
    const period = normalizeText(getValue(row, schema, "period") || inferPeriod(parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"))));
    const hour = parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"));
    return (!filters.country || country === filters.country)
      && (!filters.city || city === filters.city)
      && (!filters.kitchen || kitchen === filters.kitchen)
      && (!filters.brand || brand === filters.brand || brand === "Sin dato")
      && (!filters.sku || sku === filters.sku)
      && (!filters.period || period === filters.period)
      && (!filters.hour || hour === filters.hour);
  });

  const kitchenCityMap = new Map();
  [orders, ventas, mep, ddmrp].forEach((source) => {
    source.rows.forEach((row) => {
      const kitchen = normalizeText(getValue(row, source.schema, "kitchen"));
      const city = normalizeCity(getValue(row, source.schema, "city"));
      if (kitchen !== "Sin dato" && city !== "Sin dato" && !kitchenCityMap.has(kitchen)) {
        kitchenCityMap.set(kitchen, city);
      }
      if (kitchen !== "Sin dato" && city !== "Sin dato" && !kitchenCityMap.has(kitchenMatchKey(kitchen))) {
        kitchenCityMap.set(kitchenMatchKey(kitchen), city);
      }
    });
  });

  const filterInFullRows = (source, schema) => source.filter((row) => {
    const country = normalizeCountry(getValue(row, schema, "country"));
    const kitchen = normalizeText(getValue(row, schema, "kitchen"));
    const city = normalizeCity(getValue(row, schema, "city") || kitchenCityMap.get(kitchen));
    const brand = normalizeText(getValue(row, schema, "brand"));
    const hour = parseHour(getValue(row, schema, "hour") || getValue(row, schema, "date"));
    return (!filters.country || country === filters.country)
      && (!filters.city || city === filters.city)
      && (!filters.kitchen || kitchen === filters.kitchen)
      && (!filters.brand || brand === filters.brand)
      && (!filters.hour || hour === filters.hour);
  });

  const filterSuggestedMepRows = (source, schema) => source.filter((row) => {
    const country = normalizeCountry(getValue(row, schema, "country"));
    const city = normalizeCity(getValue(row, schema, "city"));
    const kitchen = normalizeText(getValue(row, schema, "kitchen"));
    const sku = normalizeText(getValue(row, schema, "sku"));
    return (!filters.country || country === filters.country)
      && (!filters.city || city === filters.city)
      && (!filters.kitchen || kitchen === filters.kitchen)
      && (!filters.sku || sku === filters.sku);
  });

  const orderRows = filterRows(orders.rows, orders.schema);
  const inFullRows = filterInFullRows(infull.rows, infull.schema);
  const salesRowsAllDates = ventas.rows.length ? filterRows(ventas.rows, ventas.schema) : orderRows;
  const salesRows = ventas.rows.length
    ? selectCurrentGmvRows(salesRowsAllDates, ventas.schema)
    : orderRows;
  const mepRows = filterRows(mep.rows, mep.schema);
  const ddmrpRows = filterRows(ddmrp.rows, ddmrp.schema);
  const prevRows = comparisonUsable ? filterRows(comparison.rows, comparison.schema) : [];

  const salesByKitchen = aggregate(salesRows, ventas.rows.length ? ventas.schema : orders.schema, ["city", "kitchen"], { orderSet: new Set() })
    .filter((item) => item.kitchen !== "Sin dato")
    .sort((a, b) => b.gmv - a.gmv);
  const opsByKitchen = aggregate(orderRows, orders.schema, ["city", "kitchen"], { orderSet: new Set() });
  const prevByKitchen = aggregate(prevRows, comparison.schema, ["city", "kitchen"], { orderSet: new Set() });
  const kitchenCombined = mergeComparison(
    salesByKitchen.map((sale) => ({ ...sale, ...(opsByKitchen.find((op) => op.kitchen === sale.kitchen) || {}) })),
    prevByKitchen
  );
  const total = {
    gmv: salesByKitchen.reduce((sum, item) => sum + item.gmv, 0),
    orders: opsByKitchen.reduce((sum, item) => sum + item.orders, 0) || salesByKitchen.reduce((sum, item) => sum + item.orders, 0),
    units: aggregate(mepRows, mep.schema, ["sku"], { countRowsAsOrders: true }).reduce((sum, item) => sum + item.units, 0),
    rtwt: median(opsByKitchen.map((item) => item.rtwt)),
    cooking: median(opsByKitchen.map((item) => item.cooking)),
    rtWait: median(opsByKitchen.map((item) => item.rtWait)),
  };
  total.ticket = total.orders ? total.gmv / total.orders : 0;
  const gmvHistoricalDaily = buildGmvHistoricalDaily(salesRowsAllDates, ventas.rows.length ? ventas.schema : orders.schema, total.gmv);
  const gmvHistoricalByKitchen = buildGmvHistoricalByKitchen(salesRowsAllDates, ventas.rows.length ? ventas.schema : orders.schema, total.gmv);

  const prevTotal = aggregate(prevRows, comparison.schema, ["kitchen"], { orderSet: new Set() }).reduce((acc, item) => {
    acc.orders += item.orders; acc.rtwt += item.rtwt; acc.cooking += item.cooking; acc.count += 1; return acc;
  }, { orders: 0, rtwt: 0, cooking: 0, count: 0 });
  const orderVariation = prevTotal.orders ? ((total.orders - prevTotal.orders) / prevTotal.orders) * 100 : null;
  const prevRtwtAvg = prevTotal.count ? prevTotal.rtwt / prevTotal.count : 0;
  const prevCookingAvg = prevTotal.count ? prevTotal.cooking / prevTotal.count : 0;
  const rtwtVariation = prevRtwtAvg ? ((total.rtwt - prevRtwtAvg) / prevRtwtAvg) * 100 : null;
  const cookingVariation = prevCookingAvg ? ((total.cooking - prevCookingAvg) / prevCookingAvg) * 100 : null;

  const byHourCurrent = aggregate(orderRows, orders.schema, ["hour"], { orderSet: new Set() }).sort((a, b) => a.hour.localeCompare(b.hour));
  const byHourPrev = aggregate(prevRows, comparison.schema, ["hour"], { orderSet: new Set() }).sort((a, b) => a.hour.localeCompare(b.hour));
  const prevHourMap = new Map(byHourPrev.map((item) => [item.hour, item]));
  const hourly = byHourCurrent.map((item) => {
    const prev = prevHourMap.get(item.hour) || {};
    return { ...item, prevOrders: prev.orders || 0, demandGrowth: prev.orders ? ((item.orders - prev.orders) / prev.orders) * 100 : null };
  });
  const cookingHourly = [...new Set([...byHourCurrent, ...byHourPrev].map((item) => item.hour))]
    .sort()
    .map((hour) => {
      const current = byHourCurrent.find((item) => item.hour === hour) || {};
      const prev = prevHourMap.get(hour) || {};
      return {
        hour,
        cooking: current.cooking || 0,
        prevCooking: prev.cooking || 0,
        rtwt: current.rtwt || 0,
        prevRtwt: prev.rtwt || 0,
        rtWait: current.rtWait || 0,
        prevRtWait: prev.rtWait || 0,
      };
    });
  const gmvBenchmarkHourly = buildGmvBenchmarkByHour(salesRowsAllDates, ventas.rows.length ? ventas.schema : orders.schema);

  const productSourceRows = ddmrpRows.length ? ddmrpRows : mepRows;
  const productSchema = ddmrpRows.length ? ddmrp.schema : mep.schema;
  const skuRanking = aggregate(productSourceRows, productSchema, ["city", "kitchen", "period", "sku", "product"], { countRowsAsOrders: true })
    .sort((a, b) => b.units - a.units);
  const morningRows = mepRows.filter((row) => {
    const hour = hourNumber(getValue(row, mep.schema, "hour") || getValue(row, mep.schema, "date"));
    const itemType = normalizeKey(getValue(row, mep.schema, "itemType"));
    return hour >= 7 && hour <= 11 && itemType === "principal" && !isBeverageProduct(row, mep.schema);
  });
  const morningProductTop = aggregate(morningRows, mep.schema, ["sku", "product"], { countRowsAsOrders: true })
    .filter((item) => item.product !== "Sin dato")
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);
  const morningProductWorst = aggregate(morningRows, mep.schema, ["sku", "product"], { countRowsAsOrders: true })
    .filter((item) => item.product !== "Sin dato" && item.units > 0)
    .filter((item) => filters.country !== "MEX" || !["smashed deluxe burger combo", "salsa de miel picante"].includes(normalizeKey(item.product)))
    .sort((a, b) => a.units - b.units)
    .slice(0, 10);
  const morningOrderRows = orderRows.filter((row) => {
    const hour = hourNumber(getValue(row, orders.schema, "hour") || getValue(row, orders.schema, "date"));
    return hour >= 7 && hour <= 11;
  });
  const morningBrandTop = aggregate(morningOrderRows, orders.schema, ["brand"], { orderSet: new Set() })
    .filter((item) => item.brand !== "Sin dato")
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);
  const morningBrandWorst = aggregate(morningOrderRows, orders.schema, ["brand"], { orderSet: new Set() })
    .filter((item) => item.brand !== "Sin dato" && item.orders > 0)
    .sort((a, b) => a.orders - b.orders)
    .slice(0, 5);

  const inFullComparison = buildInFullComparison(inFullRows, infull.schema, kitchenCityMap);
  const complaints = buildComplaintAnalysis(quejas.rows, quejas.schema, filters, kitchenCityMap);

  const suggestedMepRows = filterSuggestedMepRows(suggestedMep.rows, suggestedMep.schema);
  const mepComparison = computeMepComparison(suggestedMepRows, suggestedMep.schema, ddmrpRows, ddmrp.schema);
  const mepKitchenMap = new Map();
  mepComparison.forEach((row) => {
    const key = [row.city, row.kitchen].join("||");
    if (!mepKitchenMap.has(key)) {
      mepKitchenMap.set(key, { city: row.city, kitchen: row.kitchen, suggested: 0, real: 0, absoluteDeviation: 0, skuCount: 0 });
    }
    const item = mepKitchenMap.get(key);
    item.suggested += row.suggested;
    item.real += row.real;
    item.absoluteDeviation += Math.abs(row.diff);
    item.skuCount += 1;
  });
  const mepByKitchen = [...mepKitchenMap.values()].map((item) => ({
    ...item,
    diff: item.real - item.suggested,
    compliance: item.suggested ? (item.real / item.suggested) * 100 : null,
    accuracy: item.suggested ? Math.max(0, (1 - item.absoluteDeviation / item.suggested) * 100) : null,
    signedDeviationPercent: item.suggested ? ((item.real - item.suggested) / item.suggested) * 100 : null,
    deviationPercent: item.suggested ? (item.absoluteDeviation / item.suggested) * 100 : null,
  })).sort((a, b) => Math.abs(b.signedDeviationPercent || 0) - Math.abs(a.signedDeviationPercent || 0));
  const inFullKitchenMap = new Map(inFullComparison.byKitchen.map((row) => [row.kitchen, row]));

  const medians = {
    orders: median(kitchenCombined.map((item) => item.orders)),
    gmv: median(kitchenCombined.map((item) => item.gmv)),
    rtwt: median(kitchenCombined.map((item) => item.rtwt)),
    cooking: median(kitchenCombined.map((item) => item.cooking)),
  };

  const diagnosis = kitchenCombined.map((item) => {
    const mepItem = mepByKitchen.find((row) => row.kitchen === item.kitchen) || {};
    const inFullItem = inFullKitchenMap.get(item.kitchen) || {};
    const rtwtAbsPenalty = clamp(Math.max(0, (item.rtwt / (medians.rtwt || 1)) - 1) * 22, 0, 28);
    const cookingAbsPenalty = clamp(Math.max(0, (item.cooking / (medians.cooking || 1)) - 1) * 22, 0, 28);
    const rtwtGrowthPenalty = clamp(Math.max(0, item.rtwtGrowth || 0) * 0.12, 0, 14);
    const cookingGrowthPenalty = clamp(Math.max(0, item.cookingGrowth || 0) * 0.12, 0, 14);
    const waitPenalty = clamp(Math.max(0, (item.rtWait / (medians.rtwt || 1)) - 0.8) * 8, 0, 8);
    const mepShortfallPenalty = Number.isFinite(mepItem.signedDeviationPercent)
      ? clamp(Math.max(0, mepItem.signedDeviationPercent) * 0.05, 0, 6)
      : 0;
    const mepInaccuracyPenalty = Number.isFinite(mepItem.accuracy)
      ? clamp(Math.max(0, 100 - mepItem.accuracy) * 0.12, 0, 12)
      : 0;
    const inFullPenalty = Number.isFinite(inFullItem.inFull)
      ? clamp(Math.max(0, 95 - inFullItem.inFull) * 1.2, 0, 18)
      : 0;
    const highVolume = item.orders >= medians.orders;
    const controlledTimes = item.rtwt <= medians.rtwt && item.cooking <= medians.cooking;
    const volumeCredit = highVolume && controlledTimes
      ? clamp((item.orders / (medians.orders || 1)) * 7, 0, 16)
      : clamp((item.orders / (medians.orders || 1)) * 2, 0, 5);
    const mepWasShort = mepItem.signedDeviationPercent > 0;
    const strongExecutionWithShortMep = mepWasShort && inFullItem.inFull >= 95 && controlledTimes;
    const weakExecutionWithShortMep = mepWasShort && (inFullItem.inFull < 90 || item.rtwt > medians.rtwt || item.cooking > medians.cooking);
    const resilienceCredit = strongExecutionWithShortMep
      ? clamp(Math.max(0, mepItem.signedDeviationPercent) * 0.18, 0, 14)
      : 0;
    const score = clamp(Math.round(
      100
      - rtwtAbsPenalty
      - cookingAbsPenalty
      - rtwtGrowthPenalty
      - cookingGrowthPenalty
      - waitPenalty
      - mepShortfallPenalty
      - mepInaccuracyPenalty
      - inFullPenalty
      + volumeCredit
      + resilienceCredit
    ), 0, 100);
    const classification = classifyKitchen(item, medians, mepByKitchen);
    const diagnosticSignals = [];
    if (mepItem.signedDeviationPercent > 15 && strongExecutionWithShortMep) diagnosticSignals.push("MEP sugerido quedó corto, pero la cocina mantuvo buen InFull y tiempos: buena gestión pese a una planeación exigente.");
    else if (mepItem.signedDeviationPercent > 15 && weakExecutionWithShortMep) diagnosticSignals.push("MEP sugerido quedó corto y la operación se deterioró; el bajo sugerido probablemente aumentó la presión sobre cocina e InFull.");
    else if (mepItem.signedDeviationPercent > 15) diagnosticSignals.push("MEP sugerido quedó corto frente a la venta real; interpretar desempeño considerando esa presión adicional.");
    if (mepItem.signedDeviationPercent < -15) diagnosticSignals.push("MEP sugerido quedó por encima de la venta real; posible sobrepreparación.");
    if (Number.isFinite(mepItem.accuracy) && mepItem.accuracy < 75) diagnosticSignals.push("Exactitud MEP baja, revisar planeación por SKU.");
    if (Number.isFinite(inFullItem.inFull) && inFullItem.inFull < 90) diagnosticSignals.push("InFull bajo: la operación absorbió peor el volumen o generó más quejas.");
    if (mepItem.signedDeviationPercent > 0 && inFullItem.inFull >= 95 && controlledTimes) diagnosticSignals.push("Buena respuesta aun con MEP subestimado.");
    const comment = [classification.comment, ...diagnosticSignals].filter(Boolean).join(" ");
    return {
      ...item,
      voleoScore: score,
      mepCompliance: mepItem.compliance,
      mepAccuracy: mepItem.accuracy,
      mepDeviation: mepItem.signedDeviationPercent,
      inFull: inFullItem.inFull,
      inFullDelta: inFullItem.inFullDelta,
      classification: classification.type,
      color: classification.color,
      comment,
    };
  }).sort((a, b) => b.gmv - a.gmv);
  const rtwtByKitchenOrdered = [...kitchenCombined].sort((a, b) => a.orders - b.orders);
  const timeGrowthByKitchen = [...kitchenCombined].sort((a, b) => ((b.rtwtGrowth || 0) + (b.cookingGrowth || 0)) - ((a.rtwtGrowth || 0) + (a.cookingGrowth || 0)));

  const filterOptions = {
    countries: [...new Set([orders, ventas, mep, ddmrp, comparison, suggestedMep, infull, quejas].flatMap((source) => source.rows.map((row) => normalizeCountry(getValue(row, source.schema, "country")))).filter((value) => value !== "Sin dato"))].sort(),
    cities: [...new Set([orders, ventas, ddmrp].flatMap((source) => filterRows(source.rows, source.schema).map((row) => normalizeCity(getValue(row, source.schema, "city")))).filter((value) => value !== "Sin dato"))].sort(),
    kitchens: [...new Set([orders, ventas, ddmrp, suggestedMep, infull].flatMap((source) => filterRows(source.rows, source.schema).map((row) => normalizeText(getValue(row, source.schema, "kitchen")))).filter((value) => value !== "Sin dato"))].sort(),
    brands: [...new Set([orders, mep, infull, quejas].flatMap((source) => filterRows(source.rows, source.schema).map((row) => normalizeText(getValue(row, source.schema, "brand")))).filter((value) => value !== "Sin dato"))].sort(),
    skus: [...new Set([mep, ddmrp, suggestedMep].flatMap((source) => filterRows(source.rows, source.schema).map((row) => normalizeText(getValue(row, source.schema, "sku")))).filter((value) => value !== "Sin dato"))].sort(),
    periods: ["Desayuno", "Almuerzo", "Cena", "Noche"],
    hours: [...new Set([orders, infull].flatMap((source) => source.rows.map((row) => parseHour(getValue(row, source.schema, "hour") || getValue(row, source.schema, "date")))).filter((value) => value !== "Sin hora"))].sort(),
  };

  const topCity = aggregate(salesRows, ventas.rows.length ? ventas.schema : orders.schema, ["city"], { orderSet: new Set() }).sort((a, b) => b.gmv - a.gmv)[0];
  const topKitchen = salesByKitchen[0];
  const topSku = skuRanking[0];

  return {
    total,
    orderVariation,
    rtwtVariation,
    cookingVariation,
    topCity,
    topKitchen,
    topSku,
    salesByKitchen,
    kitchenCombined,
    rtwtByKitchenOrdered,
    timeGrowthByKitchen,
    hourly,
    cookingHourly,
    gmvBenchmarkHourly,
    gmvHistoricalDaily,
    gmvHistoricalByKitchen,
    skuRanking,
    morningProductTop,
    morningBrandTop,
    morningProductWorst,
    morningBrandWorst,
    inFullTotal: inFullComparison.total,
    inFullPreviousTotal: inFullComparison.previousTotal,
    inFullTotalDelta: inFullComparison.totalDelta,
    inFullTotalVariation: inFullComparison.totalVariation,
    inFullByKitchen: inFullComparison.byKitchen,
    inFullByBrand: inFullComparison.byBrand,
    inFullByHour: inFullComparison.byHour,
    inFullWorstCurrent: inFullComparison.worstCurrent,
    inFullWorstPrevious: inFullComparison.worstPrevious,
    inFullDetail: inFullComparison.detail,
    complaints,
    mepComparison,
    mepByKitchen,
    suggestedMepKitchenCount,
    protocolosRows,
    diagnosis,
    filterOptions,
  };
}

function StatusPill({ value, inverse = false }) {
  const numeric = Number(value);
  const cls = !Number.isFinite(numeric)
    ? "bg-slate-100 text-slate-600"
    : inverse
              ? numeric <= 100 ? "bg-[#E6F4F8] text-ok" : numeric <= 130 ? "bg-[#F3EDF1] text-warn" : "bg-[#F0E6EC] text-bad"
      : numeric >= 90 ? "bg-[#E6F4F8] text-ok" : numeric >= 70 ? "bg-[#F3EDF1] text-warn" : "bg-[#F0E6EC] text-bad";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${cls}`}>{Number.isFinite(numeric) ? formatPercent(numeric) : "N/D"}</span>;
}

function AccuracyPill({ value }) {
  const numeric = Number(value);
  const cls = !Number.isFinite(numeric)
    ? "bg-mist text-muted"
    : numeric < 50
      ? "bg-[#C19EB1] text-ink"
      : numeric < 75
        ? "bg-[#e8d2aeff] text-ink"
        : "bg-[#156082] text-white";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${cls}`}>{Number.isFinite(numeric) ? formatPercent(numeric) : "N/D"}</span>;
}

function Card({ title, value, subtitle, tone = "blue" }) {
  const valueText = String(value ?? "");
  const valueSize = valueText.length > 14 ? "text-base" : valueText.length > 9 ? "text-lg" : "text-xl";
  return (
    <div className="min-h-[92px] rounded-md border border-line bg-white p-3 shadow-soft">
      <p className="text-[11px] font-semibold uppercase leading-tight text-muted">{title}</p>
      <p className={`mt-1 break-words ${valueSize} font-bold leading-tight text-${tone}`}>{value}</p>
      {subtitle && <p className="mt-1 text-[11px] leading-snug text-muted">{subtitle}</p>}
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <section className="border-t border-line bg-white/65 py-4">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function ChartBox({ title, children, className = "h-64", wrapperClassName = "" }) {
  return (
    <div className={`rounded-md border border-line bg-white p-3 shadow-soft ${wrapperClassName}`}>
      <h3 className="mb-2 text-xs font-semibold text-ink">{title}</h3>
      <div className={`${className} min-w-0`}>{children}</div>
    </div>
  );
}

function ChartStack({ title, children, className = "h-[532px]" }) {
  return (
    <div className="rounded-md border border-line bg-white p-3 shadow-soft">
      <h3 className="mb-2 text-xs font-semibold text-ink">{title}</h3>
      <div className={`${className} min-w-0`}>{children}</div>
    </div>
  );
}

function RtwtBubbleLabel({ x, y, value }) {
  if (x == null || y == null || !Number.isFinite(Number(value))) return null;
  return (
    <text x={x} y={y - 8} textAnchor="middle" className="fill-ink text-[8px] font-semibold">
      {formatNumber(value, 1)}
    </text>
  );
}

function MetricBubbleLabel({ x, y, value }) {
  if (x == null || y == null || !Number.isFinite(Number(value))) return null;
  return (
    <text x={x} y={y - 8} textAnchor="middle" className="fill-ink text-[8px] font-semibold">
      {formatNumber(value, 1)}
    </text>
  );
}

function RtwtTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  return (
    <div className="rounded-md border border-line bg-white p-2 text-[10px] shadow-soft">
      <p className={`text-ink ${hasProtocolKitchen(row.kitchen) ? "font-extrabold" : "font-bold"}`}>{row.kitchen || "Cocina"}</p>
      <p className="text-muted">Órdenes: <span className="font-semibold text-ink">{formatNumber(row.orders)}</span></p>
      <p className="text-muted">RTWT: <span className="font-semibold text-ink">{formatNumber(row.rtwt, 1)} min</span></p>
    </div>
  );
}

function CookingTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  return (
    <div className="rounded-md border border-line bg-white p-2 text-[10px] shadow-soft">
      <p className={`text-ink ${hasProtocolKitchen(row.kitchen) ? "font-extrabold" : "font-bold"}`}>{row.kitchen || "Cocina"}</p>
      <p className="text-muted">Órdenes: <span className="font-semibold text-ink">{formatNumber(row.orders)}</span></p>
      <p className="text-muted">Cooking time: <span className="font-semibold text-ink">{formatNumber(row.cooking, 1)} min</span></p>
    </div>
  );
}

function KitchenAxisTick({ x, y, payload }) {
  const label = String(payload?.value || "");
  return (
    <text x={x} y={y + 3} textAnchor="end" className={`fill-muted text-[7px] ${hasProtocolKitchen(label) ? "font-bold" : "font-medium"}`}>
      {label}
    </text>
  );
}

function CompactAxisTick({ x, y, payload }) {
  const label = String(payload?.value || "");
  return (
    <text x={x} y={y + 3} textAnchor="end" className={`fill-muted text-[6px] ${hasProtocolKitchen(label) ? "font-bold" : "font-medium"}`}>
      {label}
    </text>
  );
}

function ProductAxisTick({ x, y, payload }) {
  const label = String(payload?.value || "");
  const shouldFit = label.length > 34;
  return (
    <text
      x={x}
      y={y + 3}
      textAnchor="end"
      textLength={shouldFit ? 210 : undefined}
      lengthAdjust={shouldFit ? "spacingAndGlyphs" : undefined}
      className="fill-muted text-[6px] font-medium"
    >
      {label}
    </text>
  );
}

function BrandAxisTick({ x, y, payload }) {
  const label = String(payload?.value || "");
  const shouldFit = label.length > 24;
  return (
    <text
      x={x}
      y={y + 3}
      textAnchor="end"
      textLength={shouldFit ? 142 : undefined}
      lengthAdjust={shouldFit ? "spacingAndGlyphs" : undefined}
      className="fill-muted text-[6px] font-medium"
    >
      {label}
    </text>
  );
}

function InsideBarName({ x, y, width, height, value }) {
  if (x == null || y == null || !value) return null;
  return (
    <text x={x + 6} y={y + height / 2 + 3} textAnchor="start" className="fill-white text-[8px] font-semibold">
      {String(value)}
    </text>
  );
}

function InsideBarValue({ x, y, width, height, value }) {
  if (x == null || y == null || !Number.isFinite(Number(value))) return null;
  return (
    <text x={x + width - 6} y={y + height / 2 + 3} textAnchor="end" className="fill-white text-[8px] font-bold">
      {formatNumber(value)}
    </text>
  );
}

function OutsideBarValue({ x, y, width, height, value }) {
  if (x == null || y == null || !Number.isFinite(Number(value))) return null;
  return (
    <text x={x + width + 6} y={y + height / 2 + 3} textAnchor="start" className="fill-ink text-[8px] font-bold">
      {formatNumber(value)}
    </text>
  );
}

function InFullKitchenLabel({ x, y, width, height, value, payload, row }) {
  const item = row || payload;
  if (x == null || y == null || !item) return null;
  const delta = item.inFullDelta;
  const deltaText = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${formatNumber(delta, 1)} pp` : "N/D";
  const barWidth = Number(width) || 0;
  if (barWidth < 72) return null;
  return (
    <g>
      <text x={x + 7} y={y + height / 2 + 3} textAnchor="start" className="fill-[#F5CFE0] text-[7px] font-bold">
        {formatPercent(item.prevInFull, 1)}
      </text>
      <text
        x={x + width - 54}
        y={y + height / 2 + 3}
        textAnchor="end"
        fill={Number.isFinite(delta) && delta > 0 ? "#0F9ED5" : "#E8E8E8"}
        className="text-[6px] font-bold"
      >
        {deltaText}
      </text>
      <text x={x + width - 7} y={y + height / 2 + 3} textAnchor="end" className="fill-white text-[8px] font-bold">
        {formatPercent(value, 1)}
      </text>
    </g>
  );
}

function WorstHourMarker({ point, valueKey, color, label }) {
  if (!point?.hour || !Number.isFinite(Number(point[valueKey]))) return null;
  return (
    <ReferenceDot
      x={point.hour}
      y={point[valueKey]}
      r={4}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      label={{
        value: `${label} ${formatPercent(point[valueKey], 1)}`,
        position: "bottom",
        fill: color,
        fontSize: 9,
        fontWeight: 700,
      }}
    />
  );
}

function DataTable({ rows, columns, filename, maxHeightClass = "max-h-72" }) {
  return (
    <div className="rounded-md border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="text-xs font-semibold text-ink">{rows.length} registros</p>
        <button onClick={() => downloadCsv(filename, rows)} className="rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white">Descargar CSV</button>
      </div>
      <div className={`thin-scrollbar ${maxHeightClass} overflow-auto`}>
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-muted">
            <tr>{columns.map((column) => <th key={column.key} className="px-2 py-1.5">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 250).map((row, index) => (
              <tr key={index} className="border-t border-line">
                {columns.map((column) => <td key={column.key} className={`px-2 py-1.5 ${column.key === "kitchen" && hasProtocolKitchen(row[column.key]) ? "font-bold text-ink" : ""}`}>{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplaintsView({ model, onBack }) {
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const complaintRows = selectedCategory
    ? model.complaints.rows.filter((row) => row.category === selectedCategory)
    : model.complaints.rows;
  const complaints = React.useMemo(() => summarizeComplaints(complaintRows), [complaintRows]);
  return (
    <div>
      <Section
        title="Análisis de Quejas"
        action={<button onClick={onBack} className="rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white">Volver al dashboard</button>}
      >
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          <Card title="Quejas analizadas" value={formatNumber(model.complaints.total)} subtitle="Comentarios clasificados automáticamente" />
          <Card title="Categoría seleccionada" value={selectedCategory || "Todas"} subtitle={selectedCategory ? `${formatNumber(complaints.total)} quejas filtradas` : "Haz clic en una barra para filtrar"} />
          <Card title="Marca más mencionada" value={complaints.brands[0]?.brand || "N/D"} subtitle={`${formatNumber(complaints.brands[0]?.complaints)} quejas`} />
        </div>
        {selectedCategory && (
          <button onClick={() => setSelectedCategory("")} className="mb-3 rounded border border-line bg-mist px-3 py-1.5 text-xs font-semibold text-ink">Limpiar categoría</button>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="Categorías de queja IA" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.complaints.categories} layout="vertical" margin={{ left: 8, right: 42 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" width={148} tick={<BrandAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar
                  dataKey="complaints"
                  name="Quejas"
                  fill="#96607D"
                  radius={[0, 5, 5, 0]}
                  className="cursor-pointer"
                  onClick={(row) => {
                    const category = row?.category || row?.payload?.category;
                    if (category) setSelectedCategory(category === selectedCategory ? "" : category);
                  }}
                >
                  {model.complaints.categories.map((row) => (
                    <Cell key={row.category} fill={row.category === selectedCategory ? "#0F9ED5" : "#96607D"} />
                  ))}
                  <LabelList dataKey="complaints" content={<OutsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Quejas por marca" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaints.brands} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="brand" width={148} tick={<BrandAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="complaints" name="Quejas" fill="#156082" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="complaints" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Quejas por cocina" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaints.kitchens} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="kitchen" width={148} tick={<BrandAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="complaints" name="Quejas" fill="#0B769F" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="complaints" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <DataTable
            filename="analisis_quejas_comentarios.csv"
            maxHeightClass="max-h-80"
            rows={complaints.samples}
            columns={[
              { key: "country", label: "País" },
              { key: "kitchen", label: "Cocina" },
              { key: "brand", label: "Marca" },
              { key: "category", label: "Categoría IA" },
              { key: "owner", label: "Responsable probable" },
              { key: "reasonArea", label: "Área sheet" },
              { key: "comment", label: "Comentario" },
            ]}
          />
          <div className="rounded-md border border-line bg-white p-3 shadow-soft lg:col-span-2">
            <h3 className="mb-2 text-xs font-semibold text-ink">Word cloud de comentarios</h3>
            <div className="flex min-h-[240px] flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded bg-white px-8 py-5">
              {complaints.wordCloud.map((item, index) => (
                <span
                  key={item.word}
                  className="whitespace-nowrap font-bold leading-none"
                  style={{
                    fontSize: `${item.size}px`,
                    color: ["#153D64", "#156082", "#0B769F", "#467886", "#96607D", "#345964"][index % 6],
                  }}
                  title={`${item.count} menciones`}
                >
                  {item.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function App() {
  const { status, data, warnings, errors, reload } = useDashboardData();
  const [filters, setFilters] = React.useState({ country: "COL", city: "", kitchen: "", brand: "", sku: "", period: "", hour: "" });
  const [activeView, setActiveView] = React.useState("dashboard");
  const model = React.useMemo(() => buildModel(data, filters), [data, filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const updateCountry = (country) => setFilters({ country, city: "", kitchen: "", brand: "", sku: "", period: "", hour: "" });
  const clearFilters = () => setFilters((current) => ({ country: current.country, city: "", kitchen: "", brand: "", sku: "", period: "", hour: "" }));

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold text-cyan">Dark Kitchens Operations</p>
              <h1 className="text-2xl font-bold">Dashboard Día de la Madre</h1>
              <p className="mt-1 max-w-3xl text-xs text-slate-300">Ventas, demanda, tiempos, voleo, RT y cumplimiento MEP.</p>
            </div>
            <button onClick={reload} className="w-fit rounded bg-mist px-3 py-1.5 text-xs font-bold text-ink">{status === "loading" ? "Cargando..." : "Actualizar datos"}</button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-muted">Pais</span>
            {["COL", "MEX"].map((country) => (
              <button
                key={country}
                onClick={() => updateCountry(country)}
                className={`rounded px-3 py-1.5 text-xs font-bold ${filters.country === country ? "bg-blue text-white" : "border border-line bg-mist text-ink"}`}
              >
                {country}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
          {[
            ["city", "Ciudad", model.filterOptions.cities],
            ["kitchen", "Cocina", model.filterOptions.kitchens],
            ["hour", "Hora", model.filterOptions.hours],
            ["period", "Periodo", model.filterOptions.periods],
            ["brand", "Marca", model.filterOptions.brands],
            ["sku", "SKU", model.filterOptions.skus],
          ].map(([key, label, options]) => (
            <label key={key} className="text-[11px] font-semibold uppercase text-muted">
              {label}
              <select value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="mt-1 w-full rounded border border-line bg-white p-1.5 text-xs font-medium normal-case text-ink">
                <option value="">Todos</option>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
          <button onClick={clearFilters} className="mt-4 rounded border border-line bg-mist px-3 py-1.5 text-xs font-semibold text-ink">Limpiar</button>
          </div>
        </div>
      </div>

      {false && (warnings.length > 0 || errors.length > 0) && (
        <details className="mx-auto max-w-7xl px-4 py-2 text-xs text-ink">
          <summary className="cursor-pointer rounded-md border border-warn bg-[#F5EFF3] px-3 py-2 font-bold">
            Advertencias de carga ({errors.length + warnings.length})
          </summary>
          <div className="max-h-36 overflow-auto rounded-b-md border-x border-b border-warn bg-[#F5EFF3] px-3 py-2">
            {[...errors, ...warnings].slice(0, 18).map((item, index) => <p key={index} className="mt-1">{item}</p>)}
            {[...errors, ...warnings].length > 18 && <p className="mt-1">Hay más advertencias; revisa nombres de columnas o permisos públicos del Sheet.</p>}
          </div>
        </details>
      )}

      {activeView === "complaints" ? (
        <ComplaintsView model={model} onBack={() => setActiveView("dashboard")} />
      ) : (
      <>
      <Section title="Resumen Ejecutivo">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <Card title="GMV total" value={formatCurrency(model.total.gmv)} subtitle="Día de la Madre" />
          <Card title="Órdenes totales" value={formatNumber(model.total.orders)} subtitle={`Vs domingo anterior: ${formatPercent(model.orderVariation)}`} />
          <Card title="Unidades vendidas" value={formatNumber(model.total.units)} subtitle={`Ticket promedio: ${formatCurrency(model.total.ticket)}`} />
          <Card title="RTWT promedio" value={`${formatNumber(model.total.rtwt, 1)} min`} subtitle={`Variación RTWT: ${formatPercent(model.rtwtVariation)}`} />
          <Card title="Cooking time promedio" value={`${formatNumber(model.total.cooking, 1)} min`} subtitle={`Variación cooking: ${formatPercent(model.cookingVariation)}`} />
          <Card title="Espera RT en cocina" value={`${formatNumber(model.total.rtWait, 1)} min`} />
          <Card title="Top ciudad por venta" value={model.topCity?.city || "N/D"} subtitle={formatCurrency(model.topCity?.gmv)} />
          <Card title="Top SKU vendido" value={model.topSku?.sku || "N/D"} subtitle={`${formatNumber(model.topSku?.units)} unidades`} />
        </div>
      </Section>

      <Section title="Ventas y Demanda">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartStack title="Ranking de cocinas por GMV" className="h-[620px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.salesByKitchen} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <YAxis type="category" dataKey="kitchen" width={96} tick={<KitchenAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="gmv" name="GMV" fill="#156082" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStack>
          <div className="grid gap-3">
            <ChartBox title="Órdenes por hora vs domingo anterior">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="orders" name="Día de la Madre" stroke="#0F9ED5" strokeWidth={3} />
                  <Line dataKey="prevOrders" name="Domingo anterior" stroke="#96607D" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Cooking time promedio por hora vs domingo anterior">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.cookingHourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => `${formatNumber(value, 0)}m`} />
                  <Tooltip formatter={(value) => `${formatNumber(value, 1)} min`} />
                  <Legend />
                  <Line dataKey="cooking" name="Día de la Madre" stroke="#153D64" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line dataKey="prevCooking" name="Domingo anterior" stroke="#96607D" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
          <div className="grid gap-3 lg:col-span-2 lg:grid-cols-[minmax(0,2.35fr)_minmax(220px,0.65fr)]">
          <ChartBox title="GMV histórico por cocina" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.gmvHistoricalByKitchen} margin={{ top: 34, right: 20, bottom: 38, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="kitchen"
                  interval={0}
                  height={38}
                  tick={{ fontSize: 5, angle: -28, textAnchor: "end" }}
                />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(value), name]}
                  labelFormatter={(label) => label}
                />
                <Legend verticalAlign="top" align="center" height={24} wrapperStyle={{ top: 0, fontSize: 9 }} />
                <Line dataKey="currentGmv" name="Día de la Madre 2026" stroke="#156082" strokeWidth={3} dot={false} />
                <Line dataKey="lastYearGmv" name="Día de la Madre anterior" stroke="#96607D" strokeWidth={3} dot={false} />
                <Line dataKey="priorSundaysAvgGmv" name="Promedio domingos anteriores" stroke="#467886" strokeWidth={3} strokeDasharray="6 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
            <div className="rounded-md border border-line bg-white p-3 shadow-soft">
              <h3 className="mb-2 text-xs font-semibold text-ink">Protocolos activos</h3>
              <div className="thin-scrollbar h-72 overflow-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="sticky top-0 bg-mist text-muted">
                    <tr>
                      <th className="px-2 py-1.5">Cocina</th>
                      <th className="px-2 py-1.5 text-right">Activos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.protocolosRows.map((row) => (
                      <tr key={row.kitchen} className="border-t border-line">
                        <td className="px-2 py-1.5 font-medium text-ink">{row.kitchen}</td>
                        <td className="px-2 py-1.5 text-right font-bold text-blue">{formatNumber(row.protocols)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <DataTable
            filename="ventas_por_cocina.csv"
            rows={model.salesByKitchen.map((row) => ({ ...row, share: model.total.gmv ? (row.gmv / model.total.gmv) * 100 : 0 }))}
            columns={[
              { key: "city", label: "Ciudad" },
              { key: "kitchen", label: "Cocina" },
              { key: "gmv", label: "GMV", render: formatCurrency },
              { key: "orders", label: "Órdenes", render: formatNumber },
              { key: "ticket", label: "Ticket", render: formatCurrency },
              { key: "share", label: "Share", render: formatPercent },
            ]}
          />
        </div>
      </Section>

      <Section title="Operación y Tiempos">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="Órdenes vs RTWT" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 18, right: 20, bottom: 38, left: 8 }}>
                <CartesianGrid />
                <XAxis
                  dataKey="kitchen"
                  name="Cocina"
                  type="category"
                  interval={0}
                  height={42}
                  tick={{ fontSize: 6, angle: -35, textAnchor: "end" }}
                />
                <YAxis dataKey="rtwt" name="RTWT" />
                <ZAxis dataKey="orders" range={[60, 420]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<RtwtTooltip />} />
                <Scatter data={model.rtwtByKitchenOrdered} name="Cocina" fill="#156082">
                  <LabelList dataKey="rtwt" content={<RtwtBubbleLabel />} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Órdenes vs cooking time" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 18, right: 20, bottom: 38, left: 8 }}>
                <CartesianGrid />
                <XAxis
                  dataKey="kitchen"
                  name="Cocina"
                  type="category"
                  interval={0}
                  height={42}
                  tick={{ fontSize: 6, angle: -35, textAnchor: "end" }}
                />
                <YAxis dataKey="cooking" name="Cooking" />
                <ZAxis dataKey="orders" range={[60, 420]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CookingTooltip />} />
                <Scatter data={model.rtwtByKitchenOrdered} name="Cocina" fill="#0B769F">
                  <LabelList dataKey="cooking" content={<MetricBubbleLabel />} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </Section>

      <Section title="Voleo y Respuesta de Cocina">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="Gestión del voleo con MEP e InFull (peor a mejor)" className="h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...model.diagnosis].sort((a, b) => a.voleoScore - b.voleoScore)} layout="vertical" margin={{ left: 6, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="kitchen" width={92} tick={<KitchenAxisTick />} interval={0} />
                <Tooltip />
                <Bar dataKey="voleoScore" name="Gestión del voleo" radius={[0, 5, 5, 0]}>
                  {[...model.diagnosis].sort((a, b) => a.voleoScore - b.voleoScore).map((entry, index) => (
                    <Cell key={entry.kitchen} fill={index < 8 ? "#C19EB1" : "#153D64"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Incremento % de tiempos por cocina" className="h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.timeGrowthByKitchen.slice(0, Math.max(0, model.timeGrowthByKitchen.length - 7))} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${formatNumber(value, 0)}%`} />
                <YAxis type="category" dataKey="kitchen" width={96} tick={<KitchenAxisTick />} interval={0} />
                <Tooltip formatter={(value) => `${formatNumber(value, 1)}%`} />
                <Legend />
                <Bar dataKey="rtwtGrowth" name="RTWT" fill="#96607D" />
                <Bar dataKey="cookingGrowth" name="Cooking time" fill="#C19EB1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </Section>

      <Section title="Productos y SKUs">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="Top 10 productos vendidos 7:00-11:00" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.morningProductTop} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="product" width={230} tick={<ProductAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="units" name="Unidades" fill="#0B769F" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="units" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Top 5 marcas por órdenes 7:00-11:00" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.morningBrandTop} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="brand" width={158} tick={<BrandAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="orders" name="Órdenes" fill="#156082" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="orders" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Bottom 10 productos vendidos 7:00-11:00" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.morningProductWorst} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="product" width={230} tick={<ProductAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="units" name="Unidades" fill="#96607D" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="units" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Bottom 5 marcas por órdenes 7:00-11:00" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.morningBrandWorst} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="brand" width={158} tick={<BrandAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="orders" name="Órdenes" fill="#C19EB1" radius={[0, 5, 5, 0]}>
                  <LabelList dataKey="orders" content={<InsideBarValue />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </Section>

      <Section title="MEP Sugerido vs Venta Real">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="Desviación MEP por cocina" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.mepByKitchen} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" height={22} tickFormatter={(value) => `${formatNumber(value, 0)}%`} />
                <YAxis type="category" dataKey="kitchen" width={96} tick={<KitchenAxisTick />} interval={0} />
                <Tooltip formatter={(value) => `${formatNumber(value, 1)}%`} />
                <Bar dataKey="signedDeviationPercent" name="Real - sugerido" radius={[0, 5, 5, 0]}>
                  {model.mepByKitchen.map((row) => (
                    <Cell key={row.kitchen} fill={(row.signedDeviationPercent || 0) >= 0 ? "#156082" : "#96607D"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <DataTable
            filename="mep_sugerido_vs_real.csv"
            maxHeightClass="max-h-80"
            rows={model.mepComparison.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 120)}
            columns={[
              { key: "kitchen", label: "Cocina" },
              { key: "sku", label: "SKU" },
              { key: "product", label: "Producto" },
              { key: "suggested", label: "Sugerido", render: formatNumber },
              { key: "real", label: "Real", render: formatNumber },
              { key: "diff", label: "Diferencia", render: formatNumber },
              { key: "compliance", label: "Cumplimiento", render: (value) => <StatusPill value={value} /> },
              { key: "accuracy", label: "Exactitud", render: (value) => <AccuracyPill value={value} /> },
              { key: "status", label: "Lectura" },
            ]}
          />
        </div>
      </Section>

      <Section
        title="InFull"
        action={<button onClick={() => setActiveView("complaints")} className="rounded bg-rose px-3 py-1.5 text-xs font-semibold text-white">Quejas</button>}
      >
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          <Card
            title="InFull general"
            value={formatPercent(model.inFullTotal.inFull)}
            subtitle={(
              <span>
                <span>{formatNumber(model.inFullTotal.inFullNoi)} órdenes sin quejas / {formatNumber(model.inFullTotal.orders)} órdenes</span>
                <br />
                <span className="font-bold text-rose">Anterior: {formatPercent(model.inFullPreviousTotal.inFull)}</span>
                <span> | </span>
                <span className={model.inFullTotalDelta < 0 ? "font-bold text-rose" : "font-bold text-ok"}>
                  {model.inFullTotalDelta < 0 ? "Cayó" : "Subió"} {formatNumber(Math.abs(model.inFullTotalDelta || 0), 1)} pp ({formatPercent(Math.abs(model.inFullTotalVariation || 0))})
                </span>
              </span>
            )}
          />
          <Card
            title="Cocina con menor InFull"
            value={model.inFullByKitchen[0]?.kitchen || "N/D"}
            subtitle={model.inFullByKitchen[0] ? `${formatPercent(model.inFullByKitchen[0].inFull)} | ${formatNumber(model.inFullByKitchen[0].orders)} órdenes` : ""}
          />
          <Card
            title="Marca con menor InFull"
            value={model.inFullByBrand[0]?.brand || "N/D"}
            subtitle={model.inFullByBrand[0] ? `${formatPercent(model.inFullByBrand[0].inFull)} | ${formatNumber(model.inFullByBrand[0].orders)} órdenes` : ""}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartBox title="InFull por cocina (menor a mayor)" className="h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.inFullByKitchen} layout="vertical" margin={{ left: 32, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${formatNumber(value, 0)}%`} />
                <YAxis type="category" dataKey="kitchen" width={96} tick={<KitchenAxisTick />} interval={0} />
                <Tooltip formatter={(value) => formatPercent(value)} />
                <Bar dataKey="inFull" name="InFull" radius={[0, 5, 5, 0]}>
                  {model.inFullByKitchen.map((row) => (
                    <Cell key={row.kitchen} fill={row.inFull >= 90 ? "#156082" : row.inFull >= 75 ? "#e8d2aeff" : "#C19EB1"} />
                  ))}
                  <LabelList
                    dataKey="inFull"
                    content={(props) => <InFullKitchenLabel {...props} row={model.inFullByKitchen[props.index]} />}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div className="grid gap-3">
            <ChartBox title="InFull por hora" className="h-[252px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.inFullByHour} margin={{ top: 16, left: 0, right: 16, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${formatNumber(value, 0)}%`} />
                  <Tooltip formatter={(value) => formatPercent(value)} />
                  <Legend />
                  <Line
                    dataKey="inFull"
                    name="Día de la Madre"
                    stroke="#156082"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    dataKey="prevInFull"
                    name="Domingo anterior"
                    stroke="#96607D"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  {model.inFullWorstCurrent?.hour && Number.isFinite(Number(model.inFullWorstCurrent.inFull)) && (
                    <ReferenceDot
                      x={model.inFullWorstCurrent.hour}
                      y={model.inFullWorstCurrent.inFull}
                      r={5}
                      fill="#156082"
                      stroke="#ffffff"
                      strokeWidth={2}
                      ifOverflow="visible"
                      label={{
                        value: `Peor día ${formatPercent(model.inFullWorstCurrent.inFull, 1)}`,
                        position: "bottom",
                        fill: "#156082",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  {model.inFullWorstPrevious?.hour && Number.isFinite(Number(model.inFullWorstPrevious.prevInFull)) && (
                    <ReferenceDot
                      x={model.inFullWorstPrevious.hour}
                      y={model.inFullWorstPrevious.prevInFull}
                      r={5}
                      fill="#96607D"
                      stroke="#ffffff"
                      strokeWidth={2}
                      ifOverflow="visible"
                      label={{
                        value: `Peor ant. ${formatPercent(model.inFullWorstPrevious.prevInFull, 1)}`,
                        position: "bottom",
                        fill: "#96607D",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Marcas con menor InFull" className="h-[252px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.inFullByBrand} layout="vertical" margin={{ left: 8, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${formatNumber(value, 0)}%`} />
                  <YAxis type="category" dataKey="brand" width={118} tick={<CompactAxisTick />} interval={0} />
                  <Tooltip formatter={(value) => formatPercent(value)} />
                  <Bar dataKey="inFull" name="InFull" fill="#0B769F" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        </div>
        <div className="mt-3">
          <DataTable
            filename="infull_por_cocina_marca_hora.csv"
            rows={model.inFullDetail}
            columns={[
              { key: "city", label: "Ciudad" },
              { key: "kitchen", label: "Cocina" },
              { key: "brand", label: "Marca" },
              { key: "hour", label: "Hora" },
              { key: "inFullNoi", label: "Órdenes sin quejas", render: formatNumber },
              { key: "orders", label: "Total órdenes", render: formatNumber },
              { key: "inFull", label: "InFull", render: (value) => <StatusPill value={value} /> },
            ]}
          />
        </div>
      </Section>

      <Section title="Diagnóstico Final por Cocina">
        <DataTable
          filename="diagnostico_final_cocina.csv"
          rows={model.diagnosis}
          columns={[
            { key: "city", label: "Ciudad" },
            { key: "kitchen", label: "Cocina" },
            { key: "gmv", label: "GMV", render: formatCurrency },
            { key: "orders", label: "Órdenes", render: formatNumber },
            { key: "orderGrowth", label: "Var órdenes", render: formatPercent },
            { key: "rtwt", label: "RTWT", render: (value) => `${formatNumber(value, 1)} min` },
            { key: "cooking", label: "Cooking", render: (value) => `${formatNumber(value, 1)} min` },
            { key: "rtWait", label: "Espera RT", render: (value) => `${formatNumber(value, 1)} min` },
            { key: "voleoScore", label: "Score voleo", render: formatNumber },
            { key: "mepCompliance", label: "Cumplimiento MEP", render: (value) => <StatusPill value={value} /> },
            { key: "mepAccuracy", label: "Exactitud MEP", render: (value) => <AccuracyPill value={value} /> },
            { key: "mepDeviation", label: "Desv. MEP", render: formatPercent },
            { key: "inFull", label: "InFull", render: formatPercent },
            { key: "inFullDelta", label: "Var IF", render: (value) => Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${formatNumber(value, 1)} pp` : "N/D" },
            { key: "classification", label: "Clasificación" },
            { key: "comment", label: "Comentario automático" },
          ]}
        />
      </Section>
      </>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
