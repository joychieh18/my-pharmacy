import { useEffect, useRef, useState } from 'react';
import { labelSize } from './display';
import { cropLayout, decodeImage, type Crop } from './images';
import type { Package } from './model';

export function CropEditor({
  src,
  crop,
  template,
  onChange,
}: {
  src: string;
  crop: Crop;
  template: Package;
  onChange: (crop: Crop) => void;
}) {
  const surface = labelSize(template);
  const [photo, setPhoto] = useState<{
    src: string;
    image: HTMLImageElement;
  }>();
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    crop: Crop;
  } | null>(null);
  useEffect(() => {
    let active = true;
    void decodeImage(src)
      .then((image) => {
        if (active) setPhoto({ src, image });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [src]);
  const image = photo?.src === src ? photo.image : undefined;
  const layout =
    image && cropLayout(surface.width, surface.height, image, crop);
  const clamp = (value: number) => Math.min(1, Math.max(0, value));

  return (
    <section className="crop-editor" aria-label="2D 圖片裁切">
      <h3>2D 裁切預覽</h3>
      <div
        className={`crop-frame ${crop.mode === 'fill' ? 'crop-draggable' : ''}`}
        ref={frame}
        style={{ aspectRatio: surface.width / surface.height }}
        onPointerDown={(event) => {
          if (
            !layout ||
            crop.mode !== 'fill' ||
            event.button !== 0 ||
            drag.current
          )
            return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            crop,
          };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!layout || !start || event.pointerId !== start.pointer) return;
          const rect = frame.current!.getBoundingClientRect();
          const overflowX = (layout.w / surface.width - 1) * rect.width;
          const overflowY = (layout.h / surface.height - 1) * rect.height;
          onChange({
            ...crop,
            x:
              overflowX > 0.5
                ? clamp(start.crop.x - (event.clientX - start.x) / overflowX)
                : start.crop.x,
            y:
              overflowY > 0.5
                ? clamp(start.crop.y - (event.clientY - start.y) / overflowY)
                : start.crop.y,
          });
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        {layout && (
          <img
            alt="裁切後的包裝正面"
            src={src}
            draggable={false}
            style={{
              width: `${(layout.w / surface.width) * 100}%`,
              height: `${(layout.h / surface.height) * 100}%`,
              left: `${(layout.x / surface.width) * 100}%`,
              top: `${(layout.y / surface.height) * 100}%`,
            }}
          />
        )}
      </div>
      <small>
        {crop.mode === 'fill'
          ? '可用滑鼠或手指拖曳。放大後可移動更多範圍。'
          : '完整顯示模式保留全部圖片與必要留白。'}
      </small>
    </section>
  );
}
