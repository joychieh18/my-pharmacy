import { maxImageBytes, maxImageSide } from '../src/images';
import { execFileSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  checkHistory,
  validateIndex,
  validatePack,
  type CodeIndex,
} from '../src/teaching';
import { identity } from '../src/model';

const directory = 'public/teaching';
const read = async (name: string) => {
  const path = `${directory}/${name}`;
  const parent = path.slice(0, path.lastIndexOf('/'));
  if (
    !(await lstat(directory)).isDirectory() ||
    !(await lstat(parent)).isDirectory() ||
    !(await lstat(path)).isFile()
  ) {
    throw new Error(`教材必須使用普通檔案：${name}`);
  }
  return readFile(path);
};
const current = validateIndex(
  JSON.parse((await read('index.json')).toString()),
);
const oldRef = process.argv[2] || undefined;
if (oldRef && !/^[a-f0-9]{40}$/.test(oldRef))
  throw new Error('基準 Git SHA 無效。');
const historical = (name: string) =>
  execFileSync('git', ['show', `${oldRef}:${directory}/${name}`]);
const priorFiles =
  oldRef && !/^0+$/.test(oldRef)
    ? new Set(
        execFileSync(
          'git',
          ['ls-tree', '-r', '--name-only', oldRef, '--', directory],
          { encoding: 'utf8' },
        )
          .trim()
          .split('\n'),
      )
    : new Set<string>();
const before: CodeIndex | undefined = priorFiles.has(`${directory}/index.json`)
  ? validateIndex(JSON.parse(historical('index.json').toString()))
  : undefined;
if (before) checkHistory(before, current);

const files = new Map<string, Buffer>();
const isOld = (path: string) => priorFiles.has(`${directory}/${path}`);
async function checkFile(path: string) {
  const existing = files.get(path);
  if (existing) return existing;
  const data = await read(path);
  if (isOld(path) && !historical(path).equals(data))
    throw new Error(`已發布的資源不得改寫：${path}`);
  files.set(path, data);
  return data;
}

for (const [code, entry] of Object.entries(current.codes)) {
  const pack = validatePack(
    JSON.parse((await checkFile(entry.manifest)).toString()),
    entry.manifest,
  );
  if (before?.codes[code] && !isOld(entry.manifest))
    throw new Error(`歷史版本缺少原始檔案：${code}`);
  const ids = new Set<string>();
  for (const med of pack.medicines) {
    const key = identity(med);
    if (ids.has(key))
      throw new Error(`${code} 中含有重複藥品：${med.genericName}`);
    ids.add(key);
    if (!med.image) continue;
    const bytes = await checkFile(med.image);
    if (bytes.length > maxImageBytes)
      throw new Error(`教材圖片檔案過大：${med.image}`);
    const img = sharp(bytes, {
      limitInputPixels: maxImageSide ** 2,
      failOn: 'warning',
    });
    const meta = await img.metadata();
    const expected = med.image.endsWith('.jpg')
      ? 'jpeg'
      : med.image.split('.').at(-1);
    if (
      meta.format !== expected ||
      Math.max(meta.width, meta.height) > maxImageSide ||
      (meta.pages ?? 1) > 1
    ) {
      throw new Error(`教材圖片格式或尺寸錯誤：${med.image}`);
    }
    await img.raw().toBuffer();
  }
}
for (const file of priorFiles) {
  const relative = file.slice(directory.length + 1);
  if (/^(versions|images)\//.test(relative) && !files.has(relative))
    await checkFile(relative);
}
console.log(
  `已驗證 ${Object.keys(current.codes).length} 組教材代碼及 ${files.size} 個版本或圖片檔案。`,
);
