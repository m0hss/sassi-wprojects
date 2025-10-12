/*
  Script: generate-manifests.js
  - Scans public/products/* directories
  - Creates or updates manifest.json in each product folder
  - The manifest will contain an `images` array ordered by filename (you can edit manually later)

  Usage: node scripts/generate-manifests.js
*/

const fs = require("fs");
const path = require("path");

const productsDir = path.join(process.cwd(), "public", "products");

if (!fs.existsSync(productsDir)) {
  console.error("No public/products directory found.");
  process.exit(1);
}

const productFolders = fs.readdirSync(productsDir).filter((f) => {
  const full = path.join(productsDir, f);
  return fs.statSync(full).isDirectory();
});

console.log(`Found ${productFolders.length} product folders.`);

productFolders.forEach((folder) => {
  const folderPath = path.join(productsDir, folder);
  const files = fs.readdirSync(folderPath).filter((f) => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f));

  // simple ordering: keep current listing sorted by name
  const images = files.sort();

  // Decide main image: prefer filenames that look like hero/main, else first file
  const heroCandidates = images.filter((n) => /(^|[-_\.])(?:hero|main|cover|primary)/i.test(n));
  const main = heroCandidates.length ? heroCandidates[0] : images[0];

  // Demos: up to 4 images not including main
  const demos = images.filter((n) => n !== main).slice(0, 4);

  const manifest = { main, demos };
  const manifestPath = path.join(folderPath, "manifest.json");

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote manifest for ${folder} (${images.length} images)`);
});

console.log("Done.");
