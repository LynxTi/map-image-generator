import path from 'node:path';
import puppeteer from 'puppeteer';
import { createStandalonePaperSvg } from './common/paper.js';
import { createStandaloneOverlaySvg } from './common/overlay.js';
import { compositeAndExportWebP } from './common/webp.js';

const WIDTH = 1232;
const HEIGHT = 522;

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function renderRealMap({ lat, lon, fileName }) {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
      <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .maplibregl-control-container { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new maplibregl.Map({
          container: 'map',
          style: 'https://demotiles.maplibre.org/style.json',
          center: [${lon}, ${lat}],
          zoom: 3,
          interactive: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0
        });

        map.on('load', () => {
          // Recolor layers to parchment style
          const layers = map.getStyle().layers;
          for (const layer of layers) {
            if (layer.type === 'background') {
              // Цвет воды (фона под сушей)
              map.setPaintProperty(layer.id, 'background-color', '#EBE3D5');
              
            } else if (layer.type === 'fill') {
              // Цвет суши (материков)
              map.setPaintProperty(layer.id, 'fill-color', '#DBCDB5');
            } else if (layer.type === 'line') {
              // ЦВЕТ ГРАНИЦ И ЛИНИЙ
              map.setPaintProperty(layer.id, 'line-color', '#B8B2A6');
              map.setPaintProperty(layer.id, 'line-color', '#A6947B');
              map.setPaintProperty(layer.id, 'line-opacity', 0.2);
              map.setLayoutProperty(layer.id, 'line-join', 'round');
              map.setLayoutProperty(layer.id, 'line-cap', 'round');
              
              // --- START: SMOOTHING EXPERIMENT (Easy to remove) ---
              map.setPaintProperty(layer.id, 'line-width', 2);
              map.setPaintProperty(layer.id, 'line-blur', 1);
              // --- END: SMOOTHING EXPERIMENT ---
            } else if (layer.type === 'symbol') {
              map.setLayoutProperty(layer.id, 'visibility', 'none'); // Hide labels
            }
          }
          window.mapLoaded = true;
        });
      </script>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.mapLoaded === true', { timeout: 10000 });
  
  // Wait a bit more for tiles to render
  await new Promise(r => setTimeout(r, 1000));

  const screenshotBuffer = await page.screenshot({ type: 'png' });
  await page.close();

  // Create paper texture SVG and convert to buffer
  const paperSvg = createStandalonePaperSvg(WIDTH, HEIGHT, `${fileName}|variant2`);
  const paperBuffer = Buffer.from(paperSvg);

  // Overlay marker is always at the center since we centered the map on lat/lon
  const overlaySvg = createStandaloneOverlaySvg(WIDTH, HEIGHT, WIDTH / 2, HEIGHT / 2);
  const overlayBuffer = Buffer.from(overlaySvg);

  const outPath = path.resolve('out/variant2', `${fileName}.webp`);

  await compositeAndExportWebP(
    screenshotBuffer,
    [
      { input: paperBuffer, blend: 'multiply' }
    ],
    overlayBuffer,
    outPath,
    WIDTH,
    HEIGHT
  );

  return outPath;
}
