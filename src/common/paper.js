function hashString(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(random, min, max) {
  return min + (max - min) * random();
}

export function createPaperTextureSvg(width, height, seedText) {
  const random = mulberry32(hashString(seedText));
  const stains = [];
  const speckles = [];
  const scratches = [];

  const stainCount = Math.round((width * height) / 20000);
  const speckleCount = Math.round((width * height) / 2300);
  const scratchCount = Math.round((width * height) / 70000);

  for (let i = 0; i < stainCount; i += 1) {
    const cx = randBetween(random, -width * 0.05, width * 1.05).toFixed(1);
    const cy = randBetween(random, -height * 0.05, height * 1.05).toFixed(1);
    const rx = randBetween(random, width * 0.012, width * 0.09).toFixed(1);
    const ry = randBetween(random, height * 0.012, height * 0.11).toFixed(1);
    const opacity = randBetween(random, 0.012, 0.06).toFixed(3);
    const color = random() > 0.5 ? '#8f7149' : '#ffffff';
    stains.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}" transform="rotate(${randBetween(
        random,
        -25,
        25
      ).toFixed(1)} ${cx} ${cy})" />`
    );
  }

  for (let i = 0; i < speckleCount; i += 1) {
    const cx = randBetween(random, 0, width).toFixed(1);
    const cy = randBetween(random, 0, height).toFixed(1);
    const r = randBetween(random, 0.35, 1.45).toFixed(2);
    const opacity = randBetween(random, 0.025, 0.13).toFixed(3);
    const color = random() > 0.33 ? '#85663e' : '#fff7e8';
    speckles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" />`);
  }

  for (let i = 0; i < scratchCount; i += 1) {
    const x1 = randBetween(random, 0, width).toFixed(1);
    const y1 = randBetween(random, 0, height).toFixed(1);
    const length = randBetween(random, width * 0.04, width * 0.22);
    const angle = randBetween(random, -0.35, 0.35);
    const x2 = (Number(x1) + Math.cos(angle) * length).toFixed(1);
    const y2 = (Number(y1) + Math.sin(angle) * length).toFixed(1);
    const opacity = randBetween(random, 0.025, 0.08).toFixed(3);
    scratches.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a6a42" stroke-width="${randBetween(
        random,
        0.6,
        1.8
      ).toFixed(1)}" opacity="${opacity}" />`
    );
  }

  return `
    <defs>
      <radialGradient id="paperGradient" cx="44%" cy="42%" r="82%">
        <stop offset="0%" stop-color="#f2e7d2" />
        <stop offset="48%" stop-color="#ead9bc" />
        <stop offset="100%" stop-color="#d1b98f" />
      </radialGradient>
      <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="11" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="
          0.55 0    0    0 0.50
          0    0.43 0    0 0.38
          0    0    0.25 0 0.19
          0    0    0    0.30 0" />
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="#efe2ca" />
    <rect width="${width}" height="${height}" fill="url(#paperGradient)" opacity="0.86" />
    <rect width="${width}" height="${height}" filter="url(#paperNoise)" opacity="0.34" />
    <g opacity="0.78">${stains.join('\n')}</g>
    <g opacity="0.75">${speckles.join('\n')}</g>
    <g opacity="0.55">${scratches.join('\n')}</g>
  `;
}

export function createStandalonePaperSvg(width, height, seedText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${createPaperTextureSvg(width, height, seedText)}
  </svg>`;
}
