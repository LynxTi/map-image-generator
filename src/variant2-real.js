import path from 'node:path';
import mbgl from '@maplibre/maplibre-gl-native';
import sharp from 'sharp';
import { createStandalonePaperSvg } from './common/paper.js';
import { createStandaloneOverlaySvg } from './common/overlay.js';
import { compositeAndExportWebP } from './common/webp.js';

const WIDTH = 1232;
const HEIGHT = 522;

let cachedStyle = null;

async function getStyle() {
  if (!cachedStyle) {
    const styleRes = await fetch('https://demotiles.maplibre.org/style.json');
    cachedStyle = await styleRes.json();
    
    // Recolor layers to parchment style
    for (const layer of cachedStyle.layers) {
      if (layer.type === 'background') {
        layer.paint = layer.paint || {};
        layer.paint['background-color'] = '#EBE3D5';
      } else if (layer.type === 'fill') {
        layer.paint = layer.paint || {};
        layer.paint['fill-color'] = '#DBCDB5';
      } else if (layer.type === 'line') {
        layer.paint = layer.paint || {};
        layer.paint['line-color'] = '#A6947B';
        layer.paint['line-opacity'] = 0.5;
        layer.paint['line-width'] = 2;
        layer.paint['line-blur'] = 1;
        
        layer.layout = layer.layout || {};
        layer.layout['line-join'] = 'round';
        layer.layout['line-cap'] = 'round';
      } else if (layer.type === 'symbol') {
        layer.layout = layer.layout || {};
        layer.layout['visibility'] = 'none';
      }
    }
  }
  return cachedStyle;
}

// Kept for compatibility with demo.js
export async function closeBrowser() {
  // No-op
}

export async function renderRealMap({ lat, lon, fileName }) {
  const style = await getStyle();

  const map = new mbgl.Map({
    request: function(req, callback) {
      fetch(req.url)
        .then(res => res.arrayBuffer())
        .then(buffer => callback(null, { data: Buffer.from(buffer) }))
        .catch(err => callback(err));
    }
  });

  map.load(style);

  const renderPromise = new Promise((resolve, reject) => {
    map.render({
      zoom: 3,
      center: [lon, lat],
      width: WIDTH,
      height: HEIGHT
    }, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });

  const rawBuffer = await renderPromise;
  
  // Convert raw RGBA buffer to PNG buffer for sharp compositing
  const baseBuffer = await sharp(rawBuffer, {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  }).png().toBuffer();

  // Create paper texture SVG and convert to buffer
  const paperSvg = createStandalonePaperSvg(WIDTH, HEIGHT, `${fileName}|variant2`);
  const paperBuffer = Buffer.from(paperSvg);

  // Overlay marker is always at the center since we centered the map on lat/lon
  const overlaySvg = createStandaloneOverlaySvg(WIDTH, HEIGHT, WIDTH / 2, HEIGHT / 2);
  const overlayBuffer = Buffer.from(overlaySvg);

  const outPath = path.resolve('out/variant2', `${fileName}.webp`);

  await compositeAndExportWebP(
    baseBuffer,
    [
      { input: paperBuffer, blend: 'multiply' }
    ],
    overlayBuffer,
    outPath,
    WIDTH,
    HEIGHT
  );

  // Free C++ map object memory
  map.release();

  return outPath;
}
