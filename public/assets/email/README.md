# Toone email avatar

`toone-playful-v4.gif` is encoded at **480 × 480**, displayed at **240 × 240** in all emails. It uses the approved v4 animation, with no crop or stretching.

Source: `toone/assets/launch/product-hunt/toone-neutral/toone-playful-480-v4.webp`. This lossless animation preserves partial alpha at the silhouette. The email export composites it onto the template's exact cream `#f0ede6` before GIF quantization, preserving smooth edges without GIF's binary-transparency jaggies.

Regenerate from the website checkout with:

```sh
node scripts/brand/export-email-avatar.mjs /path/to/toone/assets/launch/product-hunt/toone-neutral/toone-playful-480-v4.webp
```

`avatar-export.json` records source hash, dimensions, timing, opaque-frame validation, clear canvas borders and the verified loop seam. Keep the image panel background `#f0ede6`.
