import { useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type InstancedMesh,
} from 'three';
import { bottleAngle, labelSize } from './display';
import { decodeImage, legacyCrop, paintImage, type Crop } from './images';
import {
  packages,
  paletteFor,
  palettes,
  templateFor,
  type MedicineInput,
  type Package,
} from './model';

type XYZ = [number, number, number];
const white = new MeshStandardMaterial({ color: '#fff', roughness: 0.72 });
const previewOffsets = Object.fromEntries(
  Object.entries(packages).map(([key, pkg]) => [key, [[0, pkg.height / 2, 0]]]),
) as Record<Package, XYZ[]>;

function makeGeometry(template: Package) {
  const { width, height, depth } = packages[template];
  const label = labelSize(template);
  return template === 'bottle'
    ? {
        body: new CylinderGeometry(width / 2, width / 2, height, 48),
        // The 16 label segments align with the bottle's 48 segments exactly.
        label: new CylinderGeometry(
          width / 2,
          width / 2,
          label.height,
          16,
          1,
          true,
          -bottleAngle / 2,
          bottleAngle,
        ),
      }
    : {
        body: new BoxGeometry(width, height, depth),
        label: new PlaneGeometry(label.width, label.height),
      };
}

type Resource<T> = {
  value: T;
  refs: number;
  timer?: ReturnType<typeof setTimeout>;
};
function retain<K, T>(
  cache: Map<K, Resource<T>>,
  key: K,
  create: () => T,
  dispose: (value: T) => void,
) {
  let resource = cache.get(key);
  if (!resource) {
    resource = { value: create(), refs: 0 };
    cache.set(key, resource);
  }
  const entry = resource;
  clearTimeout(entry.timer);
  entry.refs++;
  return {
    value: entry.value,
    release: () => {
      if (--entry.refs !== 0) return;
      // Keep resources through the same-frame replacement of a scene or preview.
      entry.timer = setTimeout(() => {
        cache.delete(key);
        dispose(entry.value);
      }, 0);
    },
  };
}

const geometry = new Map<Package, Resource<ReturnType<typeof makeGeometry>>>();
const labels = new Map<string, Resource<Label>>();
const decoded = new Map<string, Resource<Promise<HTMLImageElement>>>();

function makeLabel(template: Package, resolution: number, anisotropy: number) {
  const { width, height } = labelSize(template);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((resolution * width) / Math.max(width, height));
  canvas.height = Math.round((resolution * height) / Math.max(width, height));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = anisotropy;
  const material = new MeshStandardMaterial({
    map: texture,
    roughness: 0.84,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  return { canvas, texture, material, ready: Promise.resolve() };
}
type Label = ReturnType<typeof makeLabel>;
function disposeLabel(label: Label) {
  label.material.dispose();
  label.texture.dispose();
  label.canvas.width = label.canvas.height = 1;
}

function paintText(
  ctx: CanvasRenderingContext2D,
  text: string,
  top: number,
  bottom: number,
  initialSize: number,
) {
  const { width } = ctx.canvas;
  const maxWidth = width * 0.84;
  for (let size = initialSize; size >= 1; size *= 0.92) {
    ctx.font = `700 ${size}px Arial, sans-serif`;
    const lines: string[] = [];
    let line = '';
    for (const word of text.trim().split(/\s+/u)) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > maxWidth) {
          lines.push(line);
          line = '';
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    const lineHeight = size * 1.15;
    if (lines.length * lineHeight > bottom - top && size * 0.92 >= 1) continue;
    const lineStep = Math.min(
      lineHeight,
      (bottom - top) / Math.max(1, lines.length),
    );
    lines.forEach((value, i) =>
      ctx.fillText(
        value,
        width / 2,
        (top + bottom) / 2 + (i - (lines.length - 1) / 2) * lineStep,
        maxWidth,
      ),
    );
    break;
  }
}
function paintColor(
  label: Label,
  text: { genericName: string; strength: string },
  color: string,
) {
  const { width, height } = label.canvas;
  const ctx = label.canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height * 0.18);
  ctx.fillRect(0, height * 0.92, width, height * 0.08);
  ctx.fillStyle = '#172a32';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  paintText(
    ctx,
    text.genericName,
    height * 0.23,
    height * 0.65,
    Math.min(width * 0.2, height * 0.24),
  );
  ctx.fillStyle = color;
  paintText(
    ctx,
    text.strength,
    height * 0.68,
    height * 0.89,
    Math.min(width * 0.15, height * 0.17),
  );
  label.texture.needsUpdate = true;
}
function paintPhoto(label: Label, img: HTMLImageElement, crop: Crop) {
  const ctx = label.canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, label.canvas.width, label.canvas.height);
  paintImage(ctx, img, crop);
  label.texture.needsUpdate = true;
}

function useLabel(
  medicine: MedicineInput,
  template: Package,
  detail: boolean,
  preview: boolean,
) {
  const { gl, invalidate } = useThree();
  const resolution = Math.min(
    gl.capabilities.maxTextureSize,
    detail ? 2048 : 512,
  );
  const anisotropy = Math.min(
    detail ? 8 : 4,
    gl.capabilities.getMaxAnisotropy(),
  );
  const { genericName, strength, image } = medicine;
  const { mode, x, y, zoom } = medicine.crop ?? legacyCrop;
  const color = palettes[paletteFor(medicine)][1];
  const [label, setLabel] = useState<Label>();
  const [photo, setPhoto] = useState<{ src: string; img: HTMLImageElement }>();

  useEffect(() => {
    if (preview) {
      const next = makeLabel(template, resolution, anisotropy);
      setLabel(next);
      return () => disposeLabel(next);
    }
  }, [preview, template, resolution, anisotropy]);

  useEffect(() => {
    if (!preview || !image) return;
    let active = true;
    const source = retain(
      decoded,
      image,
      () => decodeImage(image),
      () => {},
    );
    void source.value
      .then((img) => {
        if (active) setPhoto({ src: image, img });
      })
      .catch(() => {});
    return () => {
      active = false;
      source.release();
    };
  }, [preview, image]);

  useEffect(() => {
    if (!preview || !label) return;
    // One canvas per preview; merge pointer updates into the next frame.
    const frame = requestAnimationFrame(() => {
      if (!image) paintColor(label, { genericName, strength }, color);
      else if (photo?.src === image)
        paintPhoto(label, photo.img, { mode, x, y, zoom });
      else {
        const ctx = label.canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, label.canvas.width, label.canvas.height);
        label.texture.needsUpdate = true;
      }
      invalidate();
    });
    return () => cancelAnimationFrame(frame);
  }, [
    preview,
    label,
    photo,
    image,
    genericName,
    strength,
    color,
    mode,
    x,
    y,
    zoom,
    invalidate,
  ]);

  useEffect(() => {
    if (preview) return;
    const key = JSON.stringify([
      template,
      resolution,
      anisotropy,
      image ? [image, mode, x, y, zoom] : [genericName, strength, color],
    ]);
    const resource = retain(
      labels,
      key,
      () => {
        const next = makeLabel(template, resolution, anisotropy);
        if (!image) paintColor(next, { genericName, strength }, color);
        else {
          const source = retain(
            decoded,
            image,
            () => decodeImage(image),
            () => {},
          );
          next.ready = source.value
            .then((img) => {
              if (next.canvas.width > 1)
                paintPhoto(next, img, { mode, x, y, zoom });
            })
            .catch(() => {})
            .finally(source.release);
          const ctx = next.canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, next.canvas.width, next.canvas.height);
        }
        return next;
      },
      disposeLabel,
    );
    setLabel(resource.value);
    let active = true;
    void resource.value.ready.then(() => {
      if (active) invalidate();
    });
    return () => {
      active = false;
      resource.release();
    };
  }, [
    preview,
    template,
    resolution,
    anisotropy,
    image,
    genericName,
    strength,
    color,
    mode,
    x,
    y,
    zoom,
    invalidate,
  ]);

  return label;
}

export function Packaging({
  medicine,
  offsets,
  angles,
  detail = true,
  onSelect,
}: {
  medicine: MedicineInput;
  offsets?: XYZ[];
  angles?: number[];
  detail?: boolean;
  onSelect?: (index: number) => void;
}) {
  const template = templateFor(medicine);
  const positions = offsets ?? previewOffsets[template];
  const label = useLabel(medicine, template, detail, !offsets);
  const [meshGeometry, setMeshGeometry] =
    useState<ReturnType<typeof makeGeometry>>();
  const body = useRef<InstancedMesh>(null);
  const face = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    const resource = retain(
      geometry,
      template,
      () => makeGeometry(template),
      (parts) => {
        parts.body.dispose();
        parts.label.dispose();
      },
    );
    setMeshGeometry(resource.value);
    return resource.release;
  }, [template]);
  useLayoutEffect(() => {
    const matrix = new Matrix4();
    for (const [mesh, zFace] of [
      [body.current, 0],
      [face.current, template === 'bottle' ? 0 : packages[template].depth / 2],
    ] as const) {
      if (!mesh) continue;
      positions.forEach(([x, y, z], i) => {
        const yaw = angles?.[i] ?? 0;
        matrix
          .makeRotationY(yaw)
          .setPosition(x + Math.sin(yaw) * zFace, y, z + Math.cos(yaw) * zFace);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    invalidate();
  }, [positions, angles, label, meshGeometry, template, invalidate]);

  if (!meshGeometry || !positions.length) return null;
  return (
    <group>
      <instancedMesh
        ref={body}
        args={[meshGeometry.body, white, positions.length]}
        onClick={
          onSelect
            ? (event) => {
                event.stopPropagation();
                if (event.instanceId !== undefined) onSelect(event.instanceId);
              }
            : undefined
        }
      />
      {label && (
        <instancedMesh
          ref={face}
          args={[meshGeometry.label, label.material, positions.length]}
        />
      )}
    </group>
  );
}
