// One-shot logo prep: auto-trim transparent padding around public/logo.png
// and emit a compressed WebP variant for the nav.

import sharp from "sharp";
import { statSync } from "node:fs";

async function main() {
  const src = "public/logo.png";
  const trimmedPng = "public/logo.png";
  const webp = "public/logo.webp";

  console.log(`Source: ${src}`);
  const origStat = statSync(src);
  const origMeta = await sharp(src).metadata();
  console.log(`  Original: ${origMeta.width}×${origMeta.height} · ${(origStat.size / 1024).toFixed(1)} KB`);

  // Auto-trim transparent borders, max-shrink to a tight bounding box around content.
  // threshold=10 means treat near-fully-transparent pixels as background.
  const buf = await sharp(src).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 }).toBuffer();
  const trimmedMeta = await sharp(buf).metadata();
  console.log(`  Trimmed:  ${trimmedMeta.width}×${trimmedMeta.height}`);

  // Save trimmed PNG (overwrite source)
  await sharp(buf).png({ compressionLevel: 9, palette: false }).toFile(trimmedPng);
  const newPngSize = statSync(trimmedPng).size;
  console.log(`  ✓ Saved PNG: ${(newPngSize / 1024).toFixed(1)} KB`);

  // Also emit a WebP (massively smaller for transparent images)
  await sharp(buf).webp({ quality: 90, alphaQuality: 100 }).toFile(webp);
  const webpSize = statSync(webp).size;
  console.log(`  ✓ Saved WebP: ${(webpSize / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error("[error]", (e as Error).message);
  process.exit(1);
});
