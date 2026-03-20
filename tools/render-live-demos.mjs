import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'assets', 'animations');
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const quartoUrl = process.env.QUARTOPAD_URL || 'http://127.0.0.1:7496/';
const trimwriteUrl = process.env.TRIMWRITE_URL || 'http://127.0.0.1:4000/index.html';

async function ensureOutputRoot() {
  await fs.mkdir(outputRoot, { recursive: true });
}

function makeFrameWriter(dir, clip) {
  let index = 0;

  return async function capture(page, label) {
    index += 1;
    const file = path.join(dir, `${String(index).padStart(2, '0')}-${label}.png`);
    await page.screenshot({ path: file, clip });
    return file;
  };
}

function duplicateFrames(frames, copies) {
  const out = [];
  for (const frame of frames) {
    for (let i = 0; i < copies; i += 1) out.push(frame);
  }
  return out;
}

function buildGif(frameSpecs, outputFile) {
  const args = [];
  for (const frame of frameSpecs) {
    args.push('-delay', String(frame.delay), frame.path);
  }
  args.push(
    '-strip',
    '-resize', '1280x',
    '+dither',
    '-colors', '256',
    '-loop', '0',
    '-layers', 'Optimize',
    outputFile
  );

  const result = spawnSync('convert', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`convert failed for ${outputFile}`);
  }
}

async function captureQuartoPad(browser, frameRoot) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 940 },
    deviceScaleFactor: 2
  });
  const clip = { x: 0, y: 0, width: 1560, height: 760 };
  const capture = makeFrameWriter(frameRoot, clip);

  const docParts = [
    '---\n' +
      'title: "QuartoPad Demo Report"\n' +
      'format: html\n' +
      '---\n\n' +
      '# Live Render\n\n',
    'This draft was typed in the running QuartoPad app and rendered in the live preview.\n\n',
    'The source stays on the left while the HTML output updates on the right.\n'
  ];

  await page.goto(quartoUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#file-list .fi');
  await page.evaluate(() => { document.body.style.zoom = '1.1'; });
  await page.click('#file-list .fi');
  await page.click('.tb-view[data-view="split"]');
  await page.waitForTimeout(800);
  await capture(page, 'quartopad-open');

  await page.locator('.cm-content').click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');

  const typedFrames = [];
  for (let i = 0; i < docParts.length; i += 1) {
    await page.keyboard.type(docParts[i], { delay: 14 });
    await page.waitForTimeout(300);
    typedFrames.push(await capture(page, `quartopad-type-${i + 1}`));
  }

  const content = await page.evaluate(() => window.editorGetContent());
  if (!content.includes('# Live Render')) {
    throw new Error('QuartoPad editor did not receive the typed content');
  }

  await page.click('#btn-render');
  await page.waitForTimeout(250);
  const renderingFrame = await capture(page, 'quartopad-rendering');

  await page.waitForSelector('#preview-frame[src]');
  const frame = page.frameLocator('#preview-frame');
  await frame.locator('text=Live Render').waitFor({ timeout: 10000 });
  await page.waitForTimeout(900);
  const finalFrame = await capture(page, 'quartopad-final');

  await page.close();

  return [
    { path: typedFrames[0], delay: 70 },
    { path: typedFrames[1], delay: 60 },
    { path: typedFrames[2], delay: 70 },
    { path: renderingFrame, delay: 75 },
    ...duplicateFrames([{ path: finalFrame, delay: 130 }], 3)
  ];
}

async function captureTrimWrite(browser, frameRoot) {
  const page = await browser.newPage({
    viewport: { width: 1680, height: 960 },
    deviceScaleFactor: 2
  });
  const clip = { x: 0, y: 0, width: 1600, height: 940 };
  const capture = makeFrameWriter(frameRoot, clip);
  const input = [
    "In today's rapidly evolving landscape, our team launched a truly transformative initiative ",
    "to unlock meaningful synergies across the warehouse operation. ",
    "The report reads polished, but the phrasing still feels generic."
  ];

  await page.goto(trimwriteUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.body.style.zoom = '1.02'; });
  await page.click('#textInput');

  const typedFrames = [];
  for (let i = 0; i < input.length; i += 1) {
    await page.keyboard.type(input[i], { delay: 18 });
    await page.waitForTimeout(300);
    typedFrames.push(await capture(page, `trimwrite-type-${i + 1}`));
  }

  await page.click('#analyseButton');
  await page.waitForTimeout(250);
  const runningFrame = await capture(page, 'trimwrite-analysing');

  await page.waitForFunction(() => {
    const score = document.getElementById('aiScore');
    return !!score && score.textContent && score.textContent.trim() !== '--';
  }, { timeout: 10000 });
  await page.waitForTimeout(1000);
  const finalFrame = await capture(page, 'trimwrite-final');

  await page.close();

  return [
    { path: typedFrames[0], delay: 60 },
    { path: typedFrames[1], delay: 55 },
    { path: typedFrames[2], delay: 65 },
    { path: runningFrame, delay: 70 },
    ...duplicateFrames([{ path: finalFrame, delay: 130 }], 3)
  ];
}

async function main() {
  await ensureOutputRoot();

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'trimwrite-live-demos-'));
  const quartoFrames = path.join(tempRoot, 'quartopad');
  const trimwriteFrames = path.join(tempRoot, 'trimwrite');
  await fs.mkdir(quartoFrames, { recursive: true });
  await fs.mkdir(trimwriteFrames, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  try {
    const quartoGif = path.join(outputRoot, 'quartopad-flow.gif');
    const trimwriteGif = path.join(outputRoot, 'trimwrite-flow.gif');

    const quartoFrameSpecs = await captureQuartoPad(browser, quartoFrames);
    buildGif(quartoFrameSpecs, quartoGif);

    const trimwriteFrameSpecs = await captureTrimWrite(browser, trimwriteFrames);
    buildGif(trimwriteFrameSpecs, trimwriteGif);

    console.log(`Wrote ${quartoGif}`);
    console.log(`Wrote ${trimwriteGif}`);
  } finally {
    await browser.close();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
