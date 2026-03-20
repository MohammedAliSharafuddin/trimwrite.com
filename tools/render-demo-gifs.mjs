import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sceneRoot = path.join(__dirname, 'demo-scenes');
const outputRoot = path.join(repoRoot, 'assets', 'animations');
const tempRoot = path.join(__dirname, '.tmp-gif-frames');

const scenes = [
  {
    name: 'quartopad-flow',
    file: 'quartopad-flow.html',
    frames: 18,
    width: 1280,
    height: 820
  },
  {
    name: 'trimwrite-flow',
    file: 'trimwrite-flow.html',
    frames: 18,
    width: 1280,
    height: 820
  }
];

fs.mkdirSync(outputRoot, { recursive: true });
fs.rmSync(tempRoot, { recursive: true, force: true });
fs.mkdirSync(tempRoot, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome'
});

for (const scene of scenes) {
  const sceneFrames = path.join(tempRoot, scene.name);
  fs.mkdirSync(sceneFrames, { recursive: true });

  const page = await browser.newPage({
    viewport: {
      width: scene.width,
      height: scene.height
    },
    deviceScaleFactor: 1
  });

  const url = `file://${path.join(sceneRoot, scene.file)}`;
  await page.goto(url, { waitUntil: 'load' });

  for (let index = 0; index < scene.frames; index += 1) {
    const progress = index / (scene.frames - 1);
    await page.evaluate(value => {
      window.setSceneProgress(value);
    }, progress);
    await page.screenshot({
      path: path.join(sceneFrames, `${String(index).padStart(2, '0')}.png`)
    });
  }

  await page.close();

  const framePaths = fs
    .readdirSync(sceneFrames)
    .filter(file => file.endsWith('.png'))
    .sort()
    .map(file => path.join(sceneFrames, file));

  execFileSync(
    'convert',
    [
      '-delay',
      '14',
      '-loop',
      '0',
      ...framePaths,
      '-layers',
      'Optimize',
      '-colors',
      '128',
      path.join(outputRoot, `${scene.name}.gif`)
    ],
    { stdio: 'inherit' }
  );
}

await browser.close();
