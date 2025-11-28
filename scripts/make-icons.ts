import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import iconGen from 'icon-gen';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)=(.*)$/); 
  return m ? [m[1], m[2]] : [a, true];
}));

const SRC_SVG = args.in || path.join(rootDir, 'assets/icon.svg');
const OUT_DIR = args.out || path.join(rootDir, 'assets/icons');
const PNG_DIR = path.join(OUT_DIR, 'png');
const BASE = args.name || 'icon';

const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function renderPngVariants() {
  const svg = await fs.readFile(SRC_SVG, 'utf8');
  await ensureDir(PNG_DIR);

  for (const size of PNG_SIZES) {
    // icon-gen expects files named as just the size (e.g., "16.png")
    const pngPath = path.join(PNG_DIR, `${size}.png`);
    const resvg = new Resvg(svg, { 
      fitTo: { 
        mode: 'width', 
        value: size 
      },
      background: 'rgba(0,0,0,0)'
    });
    const png = resvg.render().asPng();
    await fs.writeFile(pngPath, png);
    
    // Also create the standard format for other uses
    const standardPath = path.join(PNG_DIR, `${size}x${size}.png`);
    await fs.writeFile(standardPath, png);
  }
  console.log(`✓ PNG generated: ${PNG_SIZES.join(', ')} px`);
}

async function makeIcnsIco() {
  await iconGen(PNG_DIR, OUT_DIR, {
    report: true,
    icns: { 
      name: BASE, 
      sizes: [16, 32, 64, 128, 256, 512, 1024] 
    },
    ico: { 
      name: BASE, 
      sizes: [16, 24, 32, 48, 64, 128, 256] 
    },
  });
  console.log(`✓ ICNS/ICO written to ${OUT_DIR}`);
}

async function cleanupPngDir() {
  try {
    // Keep 256x256.png for Linux
    const linuxIcon = path.join(PNG_DIR, '256x256.png');
    const keepFile = path.join(OUT_DIR, '256x256.png');
    
    // Copy the Linux icon to the main icons directory
    await fs.copyFile(linuxIcon, keepFile);
    
    // Remove the entire PNG directory
    await fs.rm(PNG_DIR, { recursive: true, force: true });
    
    console.log('✓ Cleaned up temporary PNG files (kept 256x256.png for Linux)');
  } catch (e) {
    console.warn('Warning: Could not clean up PNG directory:', e instanceof Error ? e.message : e);
  }
}

(async () => {
  try {
    console.log(`Building icons from: ${SRC_SVG}`);
    await renderPngVariants();
    await makeIcnsIco();
    
    // Clean up temporary PNG files
    await cleanupPngDir();
    
    // Clean up any old PNG files in the root icons directory
    const oldPngs = await fs.readdir(OUT_DIR);
    for (const file of oldPngs) {
      if (file.endsWith('.png') && file !== '256x256.png') {
        await fs.rm(path.join(OUT_DIR, file));
      }
    }
    
    console.log('\n✓ Icon generation complete!');
    console.log('\nGenerated files:');
    console.log(`  macOS:  ${path.join(OUT_DIR, `${BASE}.icns`)}`);
    console.log(`  Windows: ${path.join(OUT_DIR, `${BASE}.ico`)}`);
    console.log(`  Linux:   ${path.join(OUT_DIR, '256x256.png')}`);
  } catch (e) {
    console.error('Icon generation failed:', e);
    process.exit(1);
  }
})();