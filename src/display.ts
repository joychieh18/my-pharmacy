import { packages, shelf, type Package, type Zone, type slots } from './model';

export const packageGap = 0.01;
const clearance = 0.01;
type Slot = (typeof slots)[number];

export function displayFor(slot: Slot, zone: Zone, template: Package) {
  const pkg = packages[template];
  // Reserve both post lines across the entire depth; this also works during side viewing.
  const innerEdge = shelf.width / 2 - shelf.post - clearance;
  const left = Math.max(slot.x - slot.width / 2 + clearance, -innerEdge);
  const right = Math.min(slot.x + slot.width / 2 - clearance, innerEdge);
  const front = shelf.depth / 2 - clearance;
  const back = -shelf.depth / 2 + (zone === 'RX' ? shelf.back : 0) + clearance;
  const top =
    slot.row === 0 ? shelf.height : shelf.levels[slot.row - 1] - shelf.board;
  const width = right - left;
  const depth = front - back;
  const count = (span: number, size: number) =>
    Math.floor((span + packageGap + 1e-9) / (size + packageGap));
  const columns = count(width, pkg.width);
  const rows =
    pkg.height <= top - slot.y - clearance ? count(depth, pkg.depth) : 0;
  const center = (left + right) / 2 - slot.x;
  const offsets = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, col): [number, number, number] => [
      center + (col - (columns - 1) / 2) * (pkg.width + packageGap),
      pkg.height / 2,
      front - pkg.depth / 2 - row * (pkg.depth + packageGap),
    ]),
  ).flat();
  return {
    left,
    right,
    front,
    back,
    top,
    width,
    depth,
    columns,
    rows,
    offsets,
  };
}

export const bottleAngle = (Math.PI * 2) / 3;
export function labelSize(template: Package) {
  const { width, height } = packages[template];
  return template === 'bottle'
    ? { width: (width / 2) * bottleAngle, height: height * 0.84 }
    : { width, height };
}
