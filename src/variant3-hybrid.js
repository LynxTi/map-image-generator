import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import sharp from 'sharp';
import { getViewport, createProjection } from './common/geo.js';
import { createStandalonePaperSvg } from './common/paper.js';
import { createStandaloneOverlaySvg } from './common/overlay.js';
import { compositeAndExportWebP } from './common/webp.js';

const require = createRequire(import.meta.url);
const countriesTopo = require('world-atlas/countries-110m.json');
const landTopo = require('world-atlas/land-110m.json');

const WIDTH = 1232;
const HEIGHT = 522;

export async function renderHybridMap({ lat, lon, fileName }) {
  const bounds = getViewport(lat, lon);
  const projection = createProjection(bounds, WIDTH, HEIGHT);
  const pathGenerator = geoPath(projection);

  const countries = feature(countriesTopo, countriesTopo.objects.countries);
  const land = feature(landTopo, landTopo.objects.land);
  const graticule = geoGraticule().step([20, 10])();

  const landPath = pathGenerator(land);
  const graticulePath = pathGenerator(graticule);

  const scale = WIDTH / 1232;

  const countryPaths = countries.features
    .map((item) => {
      const d = pathGenerator(item);
      if (!d) return '';
      return `<path d="${d}" class="country" />`;
    })
    .join('\n');

  const point = projection([lon, lat]) || [WIDTH / 2, HEIGHT / 2];
  const [markerX, markerY] = point.map((value) => Number(value.toFixed(2)));

  // Clean vector map without paper texture
  const cleanSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>
      .country {
        fill: #F1E6CF;
        fill-opacity: 0.8;
        stroke: #9B7B4C;
        stroke-width: ${1.5 * scale};
        stroke-opacity: 0.4;
        vector-effect: non-scaling-stroke;
      }
      .land-main {
        fill: none;
        stroke: #8b6d42;
        stroke-width: ${2 * scale};
        stroke-opacity: 0.3;
        vector-effect: non-scaling-stroke;
      }
      .graticule {
        fill: none;
        stroke: #8c6a40;
        stroke-width: ${0.8 * scale};
        stroke-dasharray: ${6 * scale} ${8 * scale};
        stroke-opacity: 0.15;
        vector-effect: non-scaling-stroke;
      }
    </style>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#F8F5F0" />

  <g opacity="0.9">
    <path d="${graticulePath}" class="graticule" />
    <path d="${landPath}" class="land-main" />
    ${countryPaths}
  </g>
</svg>
`;

  const cleanBuffer = Buffer.from(cleanSvg);

  const paperSvg = createStandalonePaperSvg(WIDTH, HEIGHT, `${fileName}|variant3`);
  const paperBuffer = Buffer.from(paperSvg);

  const overlaySvg = createStandaloneOverlaySvg(WIDTH, HEIGHT, markerX, markerY);
  const overlayBuffer = Buffer.from(overlaySvg);

  const outPath = path.resolve('out/variant3', `${fileName}.webp`);

  await compositeAndExportWebP(
    cleanBuffer,
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
