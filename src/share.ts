import { download, safeJson } from './download';
import { snapshot, type Game } from './model';

export async function exportShare(game: Game) {
  const response = await fetch(
    `${import.meta.env.BASE_URL}viewer-template.html`,
  );
  if (!response.ok) throw new Error('無法取得成果檢視器，請稍後再試。');
  const template = await response.text();
  const marker = 'PHARMACY_SNAPSHOT_PLACEHOLDER';
  if (!template.includes(marker)) throw new Error('成果檢視器格式無效。');
  const html = template.replace(marker, () => safeJson(snapshot(game)));
  download(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    '我的藥局-3D成果.html',
  );
}
