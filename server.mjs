import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function extractSpreadsheetId(value) {
  if (!value) return "";
  const match = String(value).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || String(value);
}

function csvUrl({ spreadsheetId, gid, sheet }) {
  const id = extractSpreadsheetId(spreadsheetId);
  if (sheet && !gid) {
    const params = new URLSearchParams({ tqx: "out:csv", sheet });
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?${params.toString()}`;
  }
  const params = new URLSearchParams({ format: "csv" });
  if (gid) params.set("gid", gid);
  if (sheet) params.set("sheet", sheet);
  return `https://docs.google.com/spreadsheets/d/${id}/export?${params.toString()}`;
}

async function handleSheet(req, res, url) {
  const spreadsheetId = url.searchParams.get("spreadsheetId") || url.searchParams.get("url");
  const gid = url.searchParams.get("gid") || "";
  const sheet = url.searchParams.get("sheet") || "";

  if (!spreadsheetId) {
    sendJson(res, 400, { error: "Missing spreadsheetId or url" });
    return;
  }

  try {
    const targetUrl = csvUrl({ spreadsheetId, gid, sheet });
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Codex Dashboard Loader",
      },
    });
    const text = await response.text();
    if (!response.ok) {
      sendJson(res, response.status, { error: `Google Sheets returned ${response.status}`, details: text.slice(0, 500) });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(text);
  } catch (error) {
    sendJson(res, 502, { error: "Could not fetch Google Sheet", details: error.message });
  }
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  } catch {
    const fallback = await fs.readFile(path.join(__dirname, "index.html"));
    res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
    res.end(fallback);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/sheet") {
    await handleSheet(req, res, url);
    return;
  }
  await serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Dashboard Dia de la Madre running at http://localhost:${PORT}`);
});
