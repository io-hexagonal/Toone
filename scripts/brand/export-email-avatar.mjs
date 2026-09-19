// Re-encode the approved animation for email; never resize or change its poses.
// Usage: node scripts/brand/export-email-avatar.mjs /path/to/toone-playful-480-v4.webp
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = process.argv[2];
if (!source) throw new Error('Pass the approved lossless 480px v4 WebP source.');
const target = 'public/assets/email/toone-playful-v4.gif';
const input = await sharp(source, { animated: true }).metadata();
assert.equal(input.width, 480);
assert.equal(input.pageHeight, 480);
await sharp(source, { animated: true, limitInputPixels: false })
  .flatten({ background: '#f0ede6' })
  .gif({ colours: 256, dither: 0, effort: 10, loop: 0, delay: input.delay })
  .toFile(target);
const output = await sharp(target, { animated: true }).metadata();
assert.equal(output.width, 480);
assert.equal(output.pageHeight, 480);
assert.equal(output.loop, 0);
assert.equal(output.delay.reduce((a, b) => a + b, 0), 10800);
const { data, info } = await sharp(target, { animated: true, limitInputPixels: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(info.channels, 4);
const frameBytes = 480 * 480 * 4;
for (let frame = 0; frame < output.pages; frame++) {
  for (let pixel = 0; pixel < 480 * 480; pixel++) {
    const offset = frame * frameBytes + pixel * 4;
    assert.equal(data[offset + 3], 255, 'Decoded frames must remain opaque');
    const x = pixel % 480, y = Math.floor(pixel / 480);
    if (x < 2 || x > 477 || y < 2 || y > 477) {
      assert.deepEqual([...data.subarray(offset, offset + 3)], [240, 237, 230], 'Canvas border must not clip the avatar');
    }
  }
}
assert(data.subarray(0, frameBytes).equals(data.subarray(data.length-frameBytes)), 'Loop seam must match');
const metadata = { source: 'toone-playful-480-v4.webp', sourceSHA256: createHash('sha256').update(await readFile(source)).digest('hex'), file: 'toone-playful-v4.gif', encodedDimensions: [480, 480], displayDimensions: [240, 240], background: '#f0ede6', durationMs: 10800, frames: output.pages, loop: 'infinite', opaqueFrames: true, clearBorders: true, loopSeamVerified: true, bytes: (await readFile(target)).length };
await writeFile('public/assets/email/avatar-export.json', JSON.stringify(metadata, null, 2)+'\n');
console.log(JSON.stringify(metadata));
