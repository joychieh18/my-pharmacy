import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { displayFor } from '../src/display';
import { safeJson } from '../src/download';
import {
  positions,
  slots,
  type Game,
  type Medicine,
  type Package,
} from '../src/model';

test('七十格滿載渲染測量與截圖', async ({ page }, info) => {
  test.setTimeout(180_000);
  const template = await readFile('dist/viewer-template.html', 'utf8');
  await page.addInitScript(() => {
    const stats = { calls: 0, instanced: 0, textures: 0, buffers: 0, lost: 0 };
    Object.assign(window, { shelfStats: stats });
    document.addEventListener('webglcontextlost', () => stats.lost++, true);
    const p = WebGL2RenderingContext.prototype;
    const draw = p.drawElements;
    const drawArrays = p.drawArrays;
    const instances = p.drawElementsInstanced;
    const instanceArrays = p.drawArraysInstanced;
    const texture = p.createTexture;
    const buffer = p.createBuffer;
    const deleteTexture = p.deleteTexture;
    const deleteBuffer = p.deleteBuffer;
    p.drawElements = function (...args) {
      stats.calls++;
      return draw.apply(this, args);
    };
    p.drawArrays = function (...args) {
      stats.calls++;
      return drawArrays.apply(this, args);
    };
    p.drawElementsInstanced = function (...args) {
      stats.calls++;
      stats.instanced += args[4];
      return instances.apply(this, args);
    };
    p.drawArraysInstanced = function (...args) {
      stats.calls++;
      stats.instanced += args[3];
      return instanceArrays.apply(this, args);
    };
    p.createTexture = function () {
      stats.textures++;
      return texture.call(this);
    };
    p.deleteTexture = function (value) {
      if (value) stats.textures--;
      return deleteTexture.call(this, value);
    };
    p.createBuffer = function () {
      stats.buffers++;
      return buffer.call(this);
    };
    p.deleteBuffer = function (value) {
      if (value) stats.buffers--;
      return deleteBuffer.call(this, value);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let fixtureHtml = '';
  await page.route('**/my-pharmacy/benchmark', (route) =>
    route.fulfill({ contentType: 'text/html', body: fixtureHtml }),
  );
  const types: Package[] = ['box', 'bottle', 'pouch'];
  const samples: Record<Package, Medicine> = {
    box: {
      id: 'box',
      genericName: 'Extended Release Training Sample',
      strength: '0.5 mg/mL',
      dosageFormId: 'tablet',
      template: 'box',
      palette: 'blue',
    },
    bottle: {
      id: 'bottle',
      genericName: 'Bottle Example',
      strength: '12.5%',
      dosageFormId: 'syrup',
      template: 'bottle',
      palette: 'coral',
    },
    pouch: {
      id: 'pouch',
      genericName: 'Pouch Example',
      strength: '75 mg/5 mL',
      dosageFormId: 'powder',
      template: 'pouch',
      palette: 'teal',
    },
  };
  const cases = [
    { name: 'boxes', select: () => 'box' as const },
    { name: 'pouches', select: () => 'pouch' as const },
    { name: 'mixed', select: (i: number) => types[i % 3] },
    { name: 'same-across-racks', select: () => 'bottle' as const },
    {
      name: 'different-images',
      select: (i: number) => types[i % 3],
      imageSize: 384,
    },
    {
      name: 'high-resolution',
      select: (i: number) => types[i % 3],
      imageSize: 2048,
    },
  ];
  const output: unknown[] = [];
  for (const scenario of cases) {
    const images: Medicine[] = [];
    if (scenario.imageSize) {
      for (let i = 0; i < 10; i++) {
        const type = scenario.select(i);
        const color = (i * 1304099 + 38439).toString(16).padStart(6, '0');
        const image = await sharp({
          create: {
            width: scenario.imageSize,
            height: scenario.imageSize / 2,
            channels: 3,
            background: '#' + color,
          },
        })
          .webp()
          .toBuffer();
        images.push({
          ...samples[type],
          id: `image-${i}`,
          image: 'data:image/webp;base64,' + image.toString('base64'),
        });
      }
    }
    let models = 0;
    const fixture: Game = {
      catalog: images.length ? images : Object.values(samples),
      racks: positions.map((position) => ({
        id: position.id,
        name: '',
        items: Object.fromEntries(
          slots.map((slot, i) => {
            const med = images[i] ?? samples[scenario.select(i)];
            models += displayFor(slot, position.zone, med.template!).offsets
              .length;
            return [i, med.id];
          }),
        ),
      })),
    };
    fixtureHtml = template.replace('PHARMACY_SNAPSHOT_PLACEHOLDER', () =>
      safeJson(fixture),
    );
    const start = Date.now();
    await page.goto('./benchmark');
    const canvas = page.locator('.scene canvas');
    await expect(canvas).toBeVisible();
    await page.waitForFunction(
      () =>
        (window as unknown as { shelfStats: { instanced: number } }).shelfStats
          .instanced > 800,
    );
    const firstDrawMs = Date.now() - start;
    if (scenario.name === 'mixed')
      await page.screenshot({ path: info.outputPath('v23-full-overview.png') });
    const rect = (await canvas.boundingBox())!;
    const metrics = await page.evaluate(async () => {
      const stats = (
        window as unknown as {
          shelfStats: {
            calls: number;
            instanced: number;
            textures: number;
            buffers: number;
            lost: number;
          };
        }
      ).shelfStats;
      const c = document.querySelector('canvas')!;
      const b = c.getBoundingClientRect();
      const coords = {
        clientX: b.x + b.width / 2,
        clientY: b.y + b.height / 2,
        pointerId: 41,
        pointerType: 'mouse',
        button: 0,
        buttons: 1,
        bubbles: true,
      };
      // Native automation handles pointer capture. Sample the demand-rendered orbit via wheel events.
      const samples: number[] = [];
      const calls: number[] = [];
      let previous = stats.calls;
      let timestamp = performance.now();
      for (let i = 0; i < 8; i++) {
        c.dispatchEvent(
          new WheelEvent('wheel', {
            ...coords,
            deltaY: i % 2 ? 23 : -23,
            cancelable: true,
          }),
        );
        for (let frame = 0; frame < 2; frame++) {
          await new Promise(requestAnimationFrame);
          calls.push(stats.calls - previous);
          previous = stats.calls;
        }
        const now = performance.now();
        samples.push(now - timestamp);
        timestamp = now;
      }
      return {
        avgTwoRafMs: Math.round(
          samples.reduce((a, b) => a + b) / samples.length,
        ),
        peakCallsPerRafWindow: Math.max(...calls),
        liveTextures: stats.textures,
        liveBuffers: stats.buffers,
        contextLoss: stats.lost,
      };
    });
    expect(metrics.peakCallsPerRafWindow).toBeGreaterThan(0);
    expect(metrics.contextLoss).toBe(0);
    output.push({ scenario: scenario.name, models, firstDrawMs, ...metrics });
    await page.getByRole('button', { name: 'OTC-01', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'OTC-01' })).toBeVisible();
    if (
      [
        'boxes',
        'pouches',
        'mixed',
        'same-across-racks',
        'high-resolution',
      ].includes(scenario.name)
    ) {
      await page.screenshot({
        path: info.outputPath(`v23-${scenario.name}.png`),
      });
    }
    if (scenario.name === 'mixed') {
      const shelfBounds = (await canvas.boundingBox())!;
      await page.mouse.move(
        shelfBounds.x + shelfBounds.width / 2,
        shelfBounds.y + shelfBounds.height / 2,
      );
      for (let i = 0; i < 13; i++) await page.mouse.wheel(0, -85);
      await page.mouse.down({ button: 'right' });
      await page.mouse.move(
        shelfBounds.x + shelfBounds.width / 2,
        shelfBounds.y + shelfBounds.height / 2 + 110,
        { steps: 7 },
      );
      await page.mouse.up({ button: 'right' });
      await page.screenshot({ path: info.outputPath('v23-zoom-pan.png') });
      await page.getByRole('button', { name: '恢復預設視角' }).click();
      await expect(canvas).toBeVisible();
    }
    if (['boxes', 'pouches', 'same-across-racks'].includes(scenario.name)) {
      const r = (await canvas.boundingBox())!;
      await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await page.mouse.down();
      await page.mouse.move(r.x + r.width / 2 + 46, r.y + r.height / 2 + 10, {
        steps: 8,
      });
      await page.mouse.up();
      await page.screenshot({
        path: info.outputPath(`v23-${scenario.name}-angle.png`),
      });
    }
    expect(rect.width).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath('shelf-metrics.json'),
    JSON.stringify(output, null, 2) + '\n',
  );
  await info.attach('shelf-metrics', {
    body: JSON.stringify(output, null, 2),
    contentType: 'application/json',
  });
});
