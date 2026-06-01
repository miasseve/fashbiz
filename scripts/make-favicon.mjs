import sharp from "sharp";

// Fit the wide logo onto a 512x512 transparent square (pad, don't crop).
await sharp("public/new_ree_icon.png")
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile("public/favicon.png");

const meta = await sharp("public/favicon.png").metadata();
console.log(`favicon.png written: ${meta.width}x${meta.height}`);
