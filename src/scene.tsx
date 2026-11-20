import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import {
  Matrix4,
  Vector3,
  type DirectionalLight,
  type InstancedMesh,
} from 'three';
import { displayFor } from './display';
import { Packaging } from './packaging';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  type Game,
  type MedicineInput,
  type Medicine,
  type Rack,
  type RackId,
  shelf,
  positions,
  slots,
  templateFor,
} from './model';

type Overlay = RefObject<HTMLDivElement>;
type XYZ = [number, number, number];
function Block({ size, at, color }: { size: XYZ; at: XYZ; color: string }) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function PackagePreview({ medicine }: { medicine: MedicineInput }) {
  return (
    <div className="package-preview">
      <Canvas
        frameloop="demand"
        camera={{ position: [0.12, 0.19, 0.55], fov: 33 }}
        fallback={<span>此瀏覽器無法顯示 WebGL 預覽。</span>}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[2, 4, 2]} intensity={2} />
        <Packaging medicine={medicine} />
        <OrbitControls
          target={[0, 0.108, 0]}
          enablePan={false}
          minDistance={0.24}
          maxDistance={0.95}
        />
      </Canvas>
    </div>
  );
}

const rackLabel = (rack: Rack) =>
  rack.name ? `${rack.id} · ${rack.name}` : rack.id;
function Shelf({
  rack,
  game,
  close,
  highlight,
  onSlot,
  overlay,
}: {
  overlay: Overlay;
  rack: Rack;
  game: Game;
  close: boolean;
  highlight?: boolean;
  onSlot?: (slot: number) => void;
}) {
  const zone = rack.id.startsWith('RX') ? 'RX' : 'OTC';
  return (
    <>
      {[-1, 1]
        .map((sign) => (sign * (shelf.width - shelf.post)) / 2)
        .map((x) =>
          [-1, 1]
            .map((sign) => (sign * (shelf.depth - shelf.post)) / 2)
            .map((z) => (
              <Block
                key={`${x}-${z}`}
                size={[shelf.post, shelf.height, shelf.post]}
                at={[x, shelf.height / 2, z]}
                color="#e3eae8"
              />
            )),
        )}
      {shelf.levels.map((y) => (
        <Block
          key={y}
          size={[shelf.width, shelf.board, shelf.depth]}
          at={[0, y - shelf.board / 2, 0]}
          color="#f2f5f1"
        />
      ))}
      {zone === 'RX' && (
        <Block
          size={[shelf.width, shelf.height, shelf.back]}
          at={[0, shelf.height / 2, (shelf.back - shelf.depth) / 2]}
          color="#fbfcfb"
        />
      )}
      {close &&
        slots.map((slot, i) => {
          const { x, y, width } = slot;
          const med = game.catalog.find((m) => m.id === rack.items[i]);
          const w = width - 0.055;
          const h = 0.31;
          const lineColor = highlight ? '#16ac75' : '#a9c3b9';
          return (
            <group key={i} position={[x, y, 0]}>
              {med && (
                <Packaging
                  medicine={med}
                  detail
                  offsets={displayFor(slot, zone, templateFor(med)).offsets}
                  onSelect={() => onSlot?.(i)}
                />
              )}
              {!med && (
                <>
                  {[-w / 2, w / 2].map((edge) => (
                    <Block
                      key={edge}
                      size={[0.005, h, 0.004]}
                      at={[edge, h / 2, 0.201]}
                      color={lineColor}
                    />
                  ))}
                  {[0.003, h].map((edge) => (
                    <Block
                      key={edge}
                      size={[w, 0.005, 0.004]}
                      at={[0, edge, 0.201]}
                      color={lineColor}
                    />
                  ))}
                </>
              )}
              {(med || highlight) && (
                <mesh
                  position={[0, h / 2, 0.205]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlot?.(i);
                  }}
                >
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      <Html
        portal={overlay}
        position={[0, 1.86, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <span className="rack-tag">{rackLabel(rack)}</span>
      </Html>
    </>
  );
}

function FloorTiles({ edge, light }: { edge: boolean; light: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const depth = edge ? 0.4 : 0.6;
  const coordinates = Array.from({ length: 15 }, (_, x) =>
    Array.from({ length: edge ? 1 : 11 }, (_, n) => [x, edge ? 11 : n]),
  )
    .flat()
    .filter(([x, z]) => Boolean((x + z) % 2) === light);
  useLayoutEffect(() => {
    const matrix = new Matrix4();
    coordinates.forEach(([x, z], i) => {
      mesh.current!.setMatrixAt(
        i,
        matrix.makeTranslation(x * 0.6 + 0.3, -0.0045, z * 0.6 + depth / 2),
      );
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
  }, [coordinates, depth]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, coordinates.length]}
      receiveShadow
    >
      <boxGeometry args={[0.593, 0.009, depth - 0.007]} />
      <meshStandardMaterial color={light ? '#e6eee9' : '#edf4ef'} />
    </instancedMesh>
  );
}

const Room = memo(function Room({ overlay }: { overlay: Overlay }) {
  return (
    <>
      <Block size={[9, 0.14, 7]} at={[4.5, -0.074, 3.5]} color="#d0e0d9" />
      <FloorTiles edge={false} light={false} />
      <FloorTiles edge={false} light />
      <FloorTiles edge light={false} />
      <FloorTiles edge light />
      <Block size={[9, 3, 0.12]} at={[4.5, 1.5, 7.06]} color="#e6f1e9" />
      <Block size={[0.12, 0.42, 7]} at={[-0.06, 0.21, 3.5]} color="#c5e2d4" />
      <Block size={[0.12, 0.42, 7]} at={[9.06, 0.21, 3.5]} color="#c5e2d4" />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          size={[0.06, 2.2, 0.12]}
          at={[4.5 + side * 0.78, 1.1, 0]}
          color="#308760"
        />
      ))}
      <Block size={[1.62, 0.06, 0.12]} at={[4.5, 2.23, 0]} color="#308760" />
      <Block size={[6.8, 1.0, 0.65]} at={[3.55, 0.5, 4.55]} color="#347e67" />
      <Block
        size={[6.8, 0.05, 0.65]}
        at={[3.55, 1.025, 4.55]}
        color="#f6fcf9"
      />
      <Block size={[1.4, 0.8, 0.6]} at={[1.25, 0.4, 6.1]} color="#e3eee8" />
      <Block size={[1.4, 0.05, 0.6]} at={[1.25, 0.825, 6.1]} color="#fcfefa" />
      {[2.2, 4.5, 6.8].map((x) => (
        <Block
          key={x}
          size={[0.75, 0.04, 0.16]}
          at={[x, 2.97, 6.84]}
          color="#ffffff"
        />
      ))}
      <Html
        portal={overlay}
        position={[2, 0.15, 1.1]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <span className="zone-tag">OTC 區</span>
      </Html>
      <Html
        portal={overlay}
        position={[7.4, 1.05, 6.85]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <span className="zone-tag">RX 區</span>
      </Html>
    </>
  );
});

function SceneCamera({ close }: { close: boolean }) {
  const { size, camera, invalidate } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  function constrainPan() {
    const target = controls.current?.target;
    if (!target) return;
    const clamped = new Vector3(
      Math.max(-0.51, Math.min(0.51, target.x)),
      Math.max(0.23, Math.min(1.59, target.y)),
      0,
    );
    camera.position.add(clamped.clone().sub(target));
    target.copy(clamped);
  }
  const aspect = size.width / size.height;
  const zoom = Math.min(1, aspect / (close ? 0.81 : 1.34));
  useEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, zoom]);
  return (
    <OrbitControls
      target={close ? [0, 0.92, 0] : [4.5, 0.45, 3.5]}
      minDistance={close ? 0.48 : 6}
      maxDistance={close ? 5 : 23}
      enablePan={close}
      zoomSpeed={close ? 2 : 1}
      onChange={close ? constrainPan : undefined}
      ref={controls}
      minPolarAngle={close ? 1.05 : 0.23}
      maxPolarAngle={close ? 1.7 : 1.38}
      minAzimuthAngle={close ? -0.8 : -Infinity}
      maxAzimuthAngle={close ? 0.8 : Infinity}
    />
  );
}

function RoomPackages({
  game,
  onRack,
}: {
  game: Game;
  onRack: (id: RackId) => void;
}) {
  const displays = useMemo(() => {
    const groups = new Map<
      string,
      {
        medicine: Medicine;
        offsets: XYZ[];
        angles: number[];
        rackIds: RackId[];
      }
    >();
    const catalog = new Map(
      game.catalog.map((medicine) => [medicine.id, medicine]),
    );
    for (const rack of game.racks) {
      const position = positions.find((entry) => entry.id === rack.id)!;
      const yaw = (position.degrees * Math.PI) / 180;
      const cosine = Math.cos(yaw);
      const sine = Math.sin(yaw);
      for (const [i, slot] of slots.entries()) {
        const medicine = catalog.get(rack.items[i]);
        if (!medicine) continue;
        let display = groups.get(medicine.id);
        if (!display) {
          display = { medicine, offsets: [], angles: [], rackIds: [] };
          groups.set(medicine.id, display);
        }
        for (const [dx, y, z] of displayFor(
          slot,
          position.zone,
          templateFor(medicine),
        ).offsets) {
          const x = slot.x + dx;
          display.offsets.push([
            position.x + cosine * x + sine * z,
            slot.y + y,
            position.z - sine * x + cosine * z,
          ]);
          display.angles.push(yaw);
          display.rackIds.push(rack.id);
        }
      }
    }
    return [...groups.values()];
  }, [game]);
  return displays.map(({ medicine, offsets, angles, rackIds }) => (
    <Packaging
      key={medicine.id}
      medicine={medicine}
      offsets={offsets}
      angles={angles}
      detail={false}
      onSelect={(index) => onRack(rackIds[index])}
    />
  ));
}

function SceneLight({
  close,
  rackLayout,
}: {
  close: boolean;
  rackLayout: string;
}) {
  const light = useRef<DirectionalLight>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    light.current!.shadow.needsUpdate = true;
    invalidate();
  }, [rackLayout, invalidate]);
  return (
    <directionalLight
      ref={light}
      position={close ? [1, 4, 3] : [3, 9, 1]}
      intensity={2.1}
      castShadow
      shadow-autoUpdate={false}
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-9}
      shadow-normalBias={0.02}
    />
  );
}

export function Scene({
  game,
  rack,
  reset,
  onRack,
  onAdd,
  onSlot,
  highlight,
}: {
  game: Game;
  rack?: Rack;
  reset: number;
  onRack: (id: RackId) => void;
  onAdd?: (id: RackId) => void;
  onSlot?: (i: number) => void;
  highlight?: boolean;
}) {
  // Canvas mounts after its sibling overlay. Keep that host stable across camera resets.
  const overlay = useRef<HTMLDivElement>(null) as Overlay;
  return (
    <div
      className="scene"
      aria-label={rack ? `${rack.id} 3D 藥架` : '3D 藥局總覽'}
    >
      <div className="scene-overlay" ref={overlay} />
      <Canvas
        frameloop="demand"
        key={`${rack?.id ?? 'room'}-${reset}`}
        shadows
        dpr={rack ? [1, 2] : [1, 1.5]}
        camera={{
          position: rack ? [0, 1.35, 3.1] : [8.9, 8.2, -6.4],
          fov: 43,
          near: 0.025,
        }}
        fallback={<p>此瀏覽器無法啟用 WebGL。仍可使用下方清單操作。</p>}
      >
        <color attach="background" args={[rack ? '#eff3f1' : '#e4f0e9']} />
        <ambientLight intensity={1.65} />
        <SceneLight
          close={Boolean(rack)}
          rackLayout={rack?.id ?? game.racks.map((item) => item.id).join(',')}
        />
        <SceneCamera close={Boolean(rack)} />
        {rack ? (
          <>
            <Block size={[3, 0.06, 2]} at={[0, -0.03, 0]} color="#e6eee9" />
            <Shelf
              overlay={overlay}
              rack={rack}
              game={game}
              close
              highlight={highlight}
              onSlot={onSlot}
            />
          </>
        ) : (
          <>
            <Room overlay={overlay} />
            <RoomPackages game={game} onRack={onRack} />
            {positions.map((position) => {
              const item = game.racks.find((r) => r.id === position.id);
              return (
                <group
                  key={position.id}
                  position={[position.x, 0, position.z]}
                  rotation-y={(position.degrees * Math.PI) / 180}
                >
                  {item ? (
                    <group
                      onClick={(e) => {
                        e.stopPropagation();
                        onRack(item.id);
                      }}
                    >
                      <Shelf
                        overlay={overlay}
                        rack={item}
                        game={game}
                        close={false}
                      />
                    </group>
                  ) : (
                    onAdd && (
                      <Html portal={overlay} position={[0, 0.06, 0]} center>
                        <button
                          className="floor-add"
                          aria-label={`新增 ${position.id} 藥架`}
                          onClick={() => onAdd(position.id)}
                        >
                          +
                        </button>
                      </Html>
                    )
                  )}
                </group>
              );
            })}
          </>
        )}
      </Canvas>
    </div>
  );
}
