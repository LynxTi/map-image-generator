import { geoEquirectangular } from 'd3-geo';

// A fixed span in degrees to show around the point
const LON_SPAN = 120;
const LAT_SPAN = 50;

export function getViewport(lat, lon) {
  return {
    minLon: lon - LON_SPAN / 2,
    maxLon: lon + LON_SPAN / 2,
    minLat: lat - LAT_SPAN / 2,
    maxLat: lat + LAT_SPAN / 2,
  };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function createProjection(bounds, width, height) {
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const lonRange = Math.max(1, bounds.maxLon - bounds.minLon);
  const latRange = Math.max(1, bounds.maxLat - bounds.minLat);

  const scaleX = width / degreesToRadians(lonRange);
  const scaleY = height / degreesToRadians(latRange);
  const scale = Math.min(scaleX, scaleY);

  return geoEquirectangular()
    .scale(scale)
    .center([centerLon, centerLat])
    .translate([width / 2, height / 2]);
}
