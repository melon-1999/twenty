// Regenerates every app icon and the social card from the canonical brand
// mark at public/images/brand/logo.svg. The social card is composited from
// public/images/brand/wordmark-horizontal.png (generated via --brand-pngs-only),
// so when the wordmark SVGs changed, run --brand-pngs-only first, then this
// script in full mode:
//   node packages/twenty-front/scripts/generate-brand-assets.mjs --brand-pngs-only
//   node packages/twenty-front/scripts/generate-brand-assets.mjs
import { readdir, readFile, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Standalone mode keeps legacy generated assets untouched.
if (process.argv.includes('--brand-pngs-only')) {
  const brandDir = join(publicDir, 'images', 'brand');
  const brandPngs = [
    { basename: 'icon-dark', width: 1024, height: 1024 },
    { basename: 'icon-light', width: 1024, height: 1024 },
    { basename: 'mark-black', width: 1024, height: 1024 },
    { basename: 'mark-white', width: 1024, height: 1024 },
    { basename: 'wordmark-horizontal', width: 2048 },
    { basename: 'wordmark-horizontal-minimal', width: 2048 },
    { basename: 'wordmark-stacked', width: 2048 },
    { basename: 'wordmark-dark', width: 2048 },
  ];

  for (const { basename, width, height } of brandPngs) {
    const target = join(brandDir, `${basename}.png`);
    const image = sharp(join(brandDir, `${basename}.svg`), { density: 300 });

    if (height === undefined) {
      image.resize({ width });
    } else {
      image.resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    await image.ensureAlpha().png().toFile(target);
    const metadata = await sharp(target).metadata();
    console.log(
      `${target}: ${metadata.width}x${metadata.height}, hasAlpha=${metadata.hasAlpha}`,
    );
  }

  process.exit(0);
}

const logoPath = join(publicDir, 'images', 'brand', 'logo.svg');
const logoSvg = await readFile(logoPath);

const iconDirs = [
  join(publicDir, 'images', 'icons', 'android'),
  join(publicDir, 'images', 'icons', 'ios'),
  join(publicDir, 'images', 'icons', 'windows11'),
];

for (const dir of iconDirs) {
  const files = (await readdir(dir)).filter((file) => file.endsWith('.png'));
  for (const file of files) {
    const target = join(dir, file);
    const { width, height } = await sharp(target).metadata();
    await sharp(logoSvg, { density: 300 })
      .resize(width, height, { fit: 'contain', background: '#1b1b1b' })
      .png()
      .toFile(`${target}.tmp`);
    await copyFile(`${target}.tmp`, target);
    const { unlink } = await import('node:fs/promises');
    await unlink(`${target}.tmp`);
    console.log(`regenerated ${target} (${width}x${height})`);
  }
}

// In-app mark (onboarding header, splash loader, import badge, OAuth consent)
await copyFile(
  logoPath,
  join(publicDir, 'images', 'integrations', 'twenty-logo.svg'),
);
console.log('regenerated images/integrations/twenty-logo.svg');

// Social preview card referenced by index.html og:image / twitter:image
await mkdir(join(publicDir, 'images', 'brand'), { recursive: true });
// Wordmark (not the bare mark) reads better at social-card scale.
const wordmarkPng = await sharp(
  join(publicDir, 'images', 'brand', 'wordmark-horizontal.png'),
)
  .resize({ width: 720 })
  .png()
  .toBuffer();
await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#fcfcfc',
  },
})
  .composite([{ input: wordmarkPng, gravity: 'center' }])
  .png()
  .toFile(join(publicDir, 'images', 'brand', 'social-card.png'));
console.log('regenerated images/brand/social-card.png');
