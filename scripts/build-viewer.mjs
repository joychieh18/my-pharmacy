import { build } from 'vite';
import { copyFile, readFile, writeFile } from 'node:fs/promises';

const target = process.argv[2] ?? 'dist';
const output = await build({
  configFile: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    write: false,
    lib: { entry: 'src/viewer.tsx', name: 'PharmacyViewer', formats: ['iife'] },
    cssCodeSplit: false,
  },
});
const files = output.flatMap((bundle) => bundle.output);
const js = files
  .find((file) => file.type === 'chunk')
  .code.replace(/<\/script/gi, '<\\/script');
const notices = (await readFile('THIRD_PARTY_NOTICES.md', 'utf8')).replace(
  /<\/script/gi,
  '<\\/script',
);
const css = files.find(
  (file) => file.type === 'asset' && file.fileName.endsWith('.css'),
).source;
await writeFile(
  `${target}/viewer-template.html`,
  `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>我的藥局｜3D 成果</title><style>${css}</style></head><body><div id="root"></div><script type="text/plain" id="pharmacy-licenses">${notices}</script><script type="application/json" id="pharmacy-data">PHARMACY_SNAPSHOT_PLACEHOLDER</script><script>${js}</script></body></html>`,
);

if (target !== 'public')
  await copyFile('THIRD_PARTY_NOTICES.md', `${target}/THIRD_PARTY_NOTICES.md`);
