import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const ICON_SIZE = 32; // Use 32px for retina displays (will be 16pt)

// Normal H icon
const normalIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 6v20m20-20v20M6 16h20" 
        stroke="black" 
        stroke-width="5" 
        stroke-linecap="round" 
        fill="none"/>
</svg>`;

// Translating H with single dot in bottom-right
const translatingIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Mask to cut out space for the dot -->
    <mask id="dotMask">
      <rect x="0" y="0" width="32" height="32" fill="white"/>
      <!-- Cut out a circle area for the dot with some padding -->
      <circle cx="26" cy="26" r="5" fill="black"/>
    </mask>
  </defs>
  <g>
    <!-- H letter with mask applied -->
    <path d="M6 6v20m20-20v20M6 16h20" 
          stroke="black" 
          stroke-width="5" 
          stroke-linecap="round" 
          fill="none"
          mask="url(#dotMask)"/>
    <!-- Single larger dot in bottom-right -->
    <circle cx="26" cy="26" r="3" fill="black"/>
  </g>
</svg>`;

async function generateIcon(svg, filename) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: ICON_SIZE,
    },
    background: 'rgba(0,0,0,0)',
  });
  
  const png = resvg.render().asPng();
  const outputPath = path.join(rootDir, 'src/ui', filename);
  await fs.writeFile(outputPath, png);
  console.log(`✓ Generated ${filename}`);
}

(async () => {
  try {
    await generateIcon(normalIconSvg, 'icon-normal.png');
    await generateIcon(translatingIconSvg, 'icon-translating.png');
    console.log('\nTray icons generated successfully!');
  } catch (e) {
    console.error('Failed to generate tray icons:', e);
    process.exit(1);
  }
})();