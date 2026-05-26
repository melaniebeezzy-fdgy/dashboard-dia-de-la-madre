import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist-static");
const outFile = path.join(outDir, "dashboard-dia-madre.html");

const dataFiles = {
  "/data/mep.csv": "data/mep.csv",
  "/data/orders.csv": "data/orders.csv",
  "/data/ddmrp.csv": "data/ddmrp.csv",
  "/data/gmv.csv": "data/gmv.csv",
  "/data/orders-comparison.csv": "data/orders-comparison.csv",
  "/data/protocolos.csv": "data/protocolos.csv",
  "/data/if.csv": "data/if.csv",
  "/data/quejas.csv": "data/quejas.csv",
  "/data/suggested-mep-all.csv": "data/suggested-mep-all.csv",
};

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

async function main() {
  const [indexHtml, appSource] = await Promise.all([
    fs.readFile(path.join(root, "index.html"), "utf8"),
    fs.readFile(path.join(root, "src", "app.jsx"), "utf8"),
  ]);

  const staticCsv = {};
  for (const [publicPath, relativePath] of Object.entries(dataFiles)) {
    staticCsv[publicPath] = await fs.readFile(path.join(root, relativePath), "utf8");
  }

  const staticLoader = `
    <script>
      window.__STATIC_CSV__ = ${safeScriptJson(staticCsv)};
      window.__DASHBOARD_STATIC__ = true;
      (() => {
        const originalFetch = window.fetch.bind(window);
        const csvResponse = (text) => new Response(text, {
          status: 200,
          headers: { "Content-Type": "text/csv; charset=utf-8" }
        });
        window.fetch = async (input, init) => {
          const rawUrl = typeof input === "string" ? input : input?.url;
          if (window.__STATIC_CSV__[rawUrl] !== undefined) {
            return csvResponse(window.__STATIC_CSV__[rawUrl]);
          }
          if (rawUrl?.startsWith("/api/sheet")) {
            const queryIndex = rawUrl.indexOf("?");
            const params = new URLSearchParams(queryIndex >= 0 ? rawUrl.slice(queryIndex + 1) : "");
            const sheet = params.get("sheet") || "";
            const gid = params.get("gid") || "";
            if (sheet.toLowerCase() === "mep") return csvResponse(window.__STATIC_CSV__["/data/mep.csv"]);
            if (gid === "215821120") return csvResponse(window.__STATIC_CSV__["/data/orders.csv"]);
          }
          const url = new URL(rawUrl, window.location.href);
          const direct = window.__STATIC_CSV__[url.pathname] || window.__STATIC_CSV__[url.pathname.replace(/^\\/C:/i, "")];
          if (direct !== undefined) return csvResponse(direct);
          if (url.pathname === "/api/sheet") {
            const sheet = url.searchParams.get("sheet") || "";
            const gid = url.searchParams.get("gid") || "";
            if (sheet.toLowerCase() === "mep") return csvResponse(window.__STATIC_CSV__["/data/mep.csv"]);
            if (gid === "215821120") return csvResponse(window.__STATIC_CSV__["/data/orders.csv"]);
          }
          return originalFetch(input, init);
        };
      })();
    </script>`;

  const babelScript = '<script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>';
  const inlineApp = `<script type="text/babel" data-type="module">\n${appSource.replace(/<\/script/gi, "<\\/script")}\n</script>`;
  let standalone = indexHtml
    .replace(/<!-- IMPORTANTE:[\s\S]*?-->\s*/g, "")
    .replace(/<script\s+type="module"\s+src="\/src\/app\.jsx"><\/script>/g, inlineApp)
    .replace(/<script\s+type="text\/babel"\s+data-type="module"\s+src="\/src\/app\.jsx"><\/script>/g, inlineApp)
    .replace("<title>Dashboard Día de la Madre</title>", "<title>Dashboard Día de la Madre - estático</title>");

  if (standalone.includes(babelScript)) {
    standalone = standalone.replace(babelScript, `${babelScript}\n${staticLoader}`);
  } else {
    standalone = standalone.replace("</head>", `${babelScript}\n${staticLoader}\n</head>`);
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, standalone, "utf8");
  console.log(outFile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
