import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/site-data.js", ["site-data.js", "text/javascript; charset=utf-8"]],
  ["/assets/hero-lifestyle-desktop.webp", ["assets/hero-lifestyle-desktop.webp", "image/webp"]],
  ["/assets/hero-lifestyle-tablet-v2.webp", ["assets/hero-lifestyle-tablet-v2.webp", "image/webp"]],
  ["/assets/hero-lifestyle-mobile.webp", ["assets/hero-lifestyle-mobile.webp", "image/webp"]],
  ["/assets/trust-inspection-v2.webp", ["assets/trust-inspection-v2.webp", "image/webp"]],
  ["/assets/product-dish-lifestyle.webp", ["assets/product-dish-lifestyle.webp", "image/webp"]],
  ["/assets/product-laundry-lifestyle.webp", ["assets/product-laundry-lifestyle.webp", "image/webp"]],
  ["/assets/product-multi-lifestyle.webp", ["assets/product-multi-lifestyle.webp", "image/webp"]],
  ["/assets/benefits-home-illustration.svg", ["assets/benefits-home-illustration.svg", "image/svg+xml"]],
  ["/assets/infographic-flow-a.svg", ["assets/infographic-flow-a.svg", "image/svg+xml"]],
  ["/assets/infographic-compare-a.svg", ["assets/infographic-compare-a.svg", "image/svg+xml"]],
  ["/assets/infographic-progress-c.svg", ["assets/infographic-progress-c.svg", "image/svg+xml"]],
]);

createServer(async (request, response) => {
  const entry = files.get(new URL(request.url, "http://localhost").pathname);
  if (!entry) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(join(import.meta.dirname, entry[0]));
    response.writeHead(200, { "content-type": entry[1] }).end(body);
  } catch {
    response.writeHead(500).end();
  }
}).listen(4173, "127.0.0.1", () => {
  process.stdout.write("Preview: http://127.0.0.1:4173/\n");
});
