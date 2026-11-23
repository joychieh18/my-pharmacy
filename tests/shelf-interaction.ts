import type { Page } from '@playwright/test';

export async function selectFirst3DSlot(page: Page, touch = false) {
  const canvas = page.locator('.scene canvas');
  await canvas.scrollIntoViewIfNeeded();
  const { width, height } = (await canvas.boundingBox())!;
  // On the default shelf camera, slot 1 is above and left of the optical center.
  const position = { x: width / 2 - height * 0.11, y: height * 0.23 };
  if (touch) await canvas.tap({ position });
  else await canvas.click({ position });
}
