import { readFileSync } from "node:fs";
const lh = JSON.parse(readFileSync(new URL("../data/lh-raw-accueil-mobile.json", import.meta.url), "utf8"));
const a = lh.audits;

console.log("=== ELEMENT LCP ===");
const lcp = a["largest-contentful-paint-element"]?.details?.items ?? [];
for (const grp of lcp) {
  if (grp.node) console.log("  noeud : " + (grp.node.snippet ?? "").slice(0, 220));
  for (const it of grp.items ?? []) {
    if (it.node) console.log("  noeud : " + (it.node.snippet ?? "").slice(0, 220));
    if (it.phase) console.log(`  ${String(it.phase).padEnd(28)} ${Math.round(it.timing)} ms`);
  }
}

console.log("\n=== RESSOURCES > 20 Ko ===");
const net = (a["network-requests"]?.details?.items ?? [])
  .filter((x) => (x.transferSize ?? 0) > 20000)
  .sort((p, q) => q.transferSize - p.transferSize);
for (const r of net)
  console.log(
    `  ${String(Math.round(r.transferSize / 1024)).padStart(5)} Ko  ${String(Math.round((r.networkEndTime ?? 0) - (r.networkRequestTime ?? 0))).padStart(5)} ms  ${r.url.replace("https://gp-elec-49.com", "")}`
  );

console.log("\n=== CONTRASTE INSUFFISANT ===");
for (const it of a["color-contrast"]?.details?.items ?? [])
  console.log(`  ${(it.node?.snippet ?? "").slice(0, 160)}\n     ${(it.node?.explanation ?? "").replace(/\s+/g, " ").slice(0, 200)}`);

console.log("\n=== BF-CACHE ===");
for (const it of a["bf-cache"]?.details?.items ?? [])
  for (const s of it.reasons ?? [it]) console.log("  " + JSON.stringify(s).slice(0, 260));

console.log("\n=== IMAGES MAL DIMENSIONNEES / A OPTIMISER ===");
for (const id of ["uses-responsive-images", "uses-optimized-images", "modern-image-formats", "efficient-animated-content", "unsized-images"]) {
  const au = a[id];
  if (!au || au.score === 1 || au.score === null) continue;
  console.log(`  -- ${id} (${au.displayValue ?? ""})`);
  for (const it of au.details?.items ?? []) console.log("     " + (it.url ?? JSON.stringify(it)).replace("https://gp-elec-49.com", "").slice(0, 140));
}

console.log("\n=== JS INUTILISE ===");
for (const it of a["unused-javascript"]?.details?.items ?? [])
  console.log(`  ${String(Math.round((it.wastedBytes ?? 0) / 1024)).padStart(4)} Ko inutilises / ${String(Math.round((it.totalBytes ?? 0) / 1024)).padStart(4)} Ko  ${(it.url ?? "").replace("https://gp-elec-49.com", "")}`);

console.log("\n=== CHAINE CRITIQUE (mainthread) ===");
for (const it of (a["mainthread-work-breakdown"]?.details?.items ?? []).slice(0, 8))
  console.log(`  ${String(Math.round(it.duration)).padStart(5)} ms  ${it.group ?? it.groupLabel}`);
