// architecture.src.html의 %%ICON_x%%, %%FONT_x%% 자리에 로고와 글꼴을 넣어
// 외부 파일 없이 열리는 architecture.html을 만든다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const mime = { svg: "image/svg+xml", png: "image/png", webp: "image/webp" };
const b64 = (file) => fs.readFileSync(file).toString("base64");

let html = fs.readFileSync(path.join(dir, "architecture.src.html"), "utf8");
html = html.replaceAll("%%FONT_DISPLAY%%", b64(path.join(dir, "fonts/Geist.woff2")));
html = html.replaceAll("%%FONT_JBM%%", b64(path.join(dir, "fonts/JetBrainsMono.woff2")));
for (const file of fs.readdirSync(path.join(dir, "icons"))) {
  const ext = file.split(".").pop();
  if (!mime[ext]) continue;
  html = html.replaceAll(`%%ICON_${file.slice(0, -ext.length - 1)}%%`, `data:${mime[ext]};base64,${b64(path.join(dir, "icons", file))}`);
}
const left = [...new Set(html.match(/%%[A-Za-z0-9_-]+%%/g) ?? [])];
if (left.length) throw new Error(`unresolved tokens: ${left.join(", ")}`);
fs.writeFileSync(path.join(dir, "architecture.html"), html);
console.log(`built architecture.html (${Math.round(html.length / 1024)} KB)`);
