import { expect, type Page } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
import { shelfView, slotHitArea, slots } from '../src/model';

export async function selectFirst3DSlot(page: Page, touch = false) {
  const canvas = page.locator('[aria-label$="3D 藥架"] canvas');
  // A visible canvas can precede the React Three Fiber scene and its hit meshes.
  await expect(canvas).toHaveAttribute('data-scene-ready', 'true');
  await canvas.scrollIntoViewIfNeeded();
  const { width, height } = await canvas.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }));
  const aspect = width / height;
  const camera = new PerspectiveCamera(shelfView.fov, aspect, shelfView.near);
  camera.position.set(...shelfView.position);
  camera.lookAt(...shelfView.target);
  camera.zoom = Math.min(1, aspect / shelfView.minAspect);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const slot = slots[0];
  const point = new Vector3(
    slot.x,
    slot.y + slotHitArea.height / 2,
    slotHitArea.z,
  ).project(camera);
  const position = {
    x: ((point.x + 1) * width) / 2,
    y: ((1 - point.y) * height) / 2,
  };
  if (touch) await canvas.tap({ position });
  else await canvas.click({ position });
}
