import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('published asset credits stay synchronized with the project credits', () => {
  const source = readFileSync(new URL('../assets/CREDITS.md', import.meta.url), 'utf8');
  const published = readFileSync(new URL('../public/assets/CREDITS.md', import.meta.url), 'utf8');
  assert.equal(published, source, 'Copy every credit update into the public deployment');
});

test('the deployed Earth globe has a closed, outward-facing surface', () => {
  const glb = readFileSync(new URL('../public/assets/models/earth-globe.glb', import.meta.url));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  assert.ok(glb.length < 4 * 1024 * 1024, 'keep the tablet download under 4 MiB');
  const jsonEnd = 20 + glb.readUInt32LE(12);
  const model = JSON.parse(glb.toString('utf8', 20, jsonEnd));
  const binaryStart = jsonEnd + 8;
  const primitive = model.meshes[0].primitives[0];
  const [position, index] = [primitive.attributes.POSITION, primitive.indices].map(id => {
    const accessor = model.accessors[id];
    const view = model.bufferViews[accessor.bufferView];
    return { ...accessor, start: binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) };
  });
  assert.equal(position.componentType, 5126);
  assert.ok([5123, 5125].includes(index.componentType));
  const points = Array.from({ length: position.count }, (_, i) =>
    [0, 4, 8].map(component => glb.readFloatLE(position.start + i * 12 + component)));
  const welded = new Map();
  const vertexIds = points.map(point => {
    const key = point.map(value => Math.round(value * 1e6)).join(',');
    if (!welded.has(key)) welded.set(key, welded.size);
    return welded.get(key);
  });
  const edges = new Map();
  const readIndex = index.componentType === 5123
    ? offset => glb.readUInt16LE(index.start + 2 * offset)
    : offset => glb.readUInt32LE(index.start + 4 * offset);
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [readIndex(i), readIndex(i + 1), readIndex(i + 2)];
    const [a, b, c] = triangle.map(vertex => points[vertex]);
    const [ux, uy, uz] = b.map((value, axis) => value - a[axis]);
    const [vx, vy, vz] = c.map((value, axis) => value - a[axis]);
    const signedArea = (uy*vz - uz*vy)*a[0] + (uz*vx - ux*vz)*a[1] + (ux*vy - uy*vx)*a[2];
    assert.ok(signedArea > 0, `triangle ${i / 3} faces outward and has nonzero area`);
    const [first, second, third] = triangle.map(vertex => vertexIds[vertex]);
    for (const [start, end] of [[first, second], [second, third], [third, first]]) {
      const key = `${Math.min(start, end)},${Math.max(start, end)}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  assert.ok([...edges.values()].every(count => count === 2), 'each welded edge must join exactly two faces');
});
