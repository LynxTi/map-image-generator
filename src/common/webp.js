import sharp from 'sharp';
import path from 'node:path';

export async function exportWebP(bufferOrSvg, overlayBuffer, outputPath, width, height) {
  // We apply rounded corners via sharp composite using an SVG mask
  const cornerRadius = 24 * (width / 1232);
  const maskSvg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#fff" />
  </svg>`;

  const maskBuffer = Buffer.from(maskSvg);
  
  // Resize the texture to match the map dimensions
  const textureBuffer = await sharp(path.resolve('src/common/texture.png'))
    .resize(width, height, { fit: 'fill' })
    .toBuffer();

  const image = sharp(Buffer.isBuffer(bufferOrSvg) ? bufferOrSvg : Buffer.from(bufferOrSvg));
  
  await image
    .composite([
      { input: textureBuffer, blend: 'multiply' },
      { input: overlayBuffer }, // Marker goes ON TOP of texture
      { input: maskBuffer, blend: 'dest-in' }
    ])
    .webp({ quality: 92, alphaQuality: 96 })
    .toFile(outputPath);
}

export async function compositeAndExportWebP(baseBuffer, layers, overlayBuffer, outputPath, width, height) {
  const cornerRadius = 24 * (width / 1232);
  const maskSvg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#fff" />
  </svg>`;

  const maskBuffer = Buffer.from(maskSvg);
  
  // Resize the texture to match the map dimensions
  const textureBuffer = await sharp(path.resolve('src/common/texture.png'))
    .resize(width, height, { fit: 'fill' })
    .toBuffer();
  
  const compositeLayers = [
    ...layers,
    { input: textureBuffer, blend: 'multiply' },
    { input: overlayBuffer }, // Marker goes ON TOP of texture
    { input: maskBuffer, blend: 'dest-in' }
  ];

  await sharp(baseBuffer)
    .composite(compositeLayers)
    .webp({ quality: 92, alphaQuality: 96 })
    .toFile(outputPath);
}
