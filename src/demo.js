import { renderVectorMap } from './variant1-vector.js';
import { renderRealMap, closeBrowser } from './variant2-real.js';
import { renderHybridMap } from './variant3-hybrid.js';

const LOCATIONS = [
  { lat: 45.6210, lon: 63.3140, fileName: 'baikonur' },
  { lat: 35.6764, lon: 139.6500, fileName: 'tokyo' },
  { lat: 42.3601, lon: -71.0589, fileName: 'boston' },
  { lat: 19.4326, lon: -99.1332, fileName: 'mexicocity' },
  { lat: -22.9068, lon: -43.1729, fileName: 'rio' },
  { lat: -34.6037, lon: -58.3816, fileName: 'buenosaires' },
  { lat: 30.0444, lon: 31.2357, fileName: 'cairo' },
  { lat: -33.8688, lon: 151.2093, fileName: 'sydney' },
  { lat: 41.3874, lon: 2.1686, fileName: 'barcelona' },
  { lat: 64.1466, lon: -21.9426, fileName: 'reykjavik' }
];

async function runDemo() {
  console.log('Starting map generation...');

  for (const loc of LOCATIONS) {
    console.log(`\nGenerating maps for ${loc.fileName}...`);
    
    // try {
    //   const v1 = await renderVectorMap(loc);
    //   console.log(`  [Variant 1] Vector: ${v1}`);
    // } catch (e) {
    //   console.error(`  [Variant 1] Error:`, e.message);
    // }

    try {
      const v2 = await renderRealMap(loc);
      console.log(`  [Variant 2] Real:   ${v2}`);
    } catch (e) {
      console.error(`  [Variant 2] Error:`, e.message);
    }

  //   try {
  //     const v3 = await renderHybridMap(loc);
  //     console.log(`  [Variant 3] Hybrid: ${v3}`);
  //   } catch (e) {
  //     console.error(`  [Variant 3] Error:`, e.message);
  //   }
  }

  await closeBrowser();
  console.log('\nDone!');
}

runDemo().catch(console.error);
