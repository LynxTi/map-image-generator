export function createOverlaySvg(width, height, markerX, markerY) {
  const scale = width / 1232;

  const markerOuter = 42 * scale;
  const markerInner = 20 * scale;

  return `
    <!-- Marker -->
    <g>
      <circle cx="${markerX}" cy="${markerY}" r="${markerOuter}" fill="#C8A96B" opacity="0.4" />
      <circle cx="${markerX}" cy="${markerY}" r="${markerInner}" fill="#C8A96B" />
    </g>
  `;
}

export function createStandaloneOverlaySvg(width, height, markerX, markerY) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${createOverlaySvg(width, height, markerX, markerY)}
  </svg>`;
}
