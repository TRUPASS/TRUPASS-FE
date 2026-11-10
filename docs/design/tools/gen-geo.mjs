// 검색 중 화면의 지구본이 쓰는 지도 데이터와 투영 라이브러리를 assets 로 옮긴다.
//   assets/geo/world.js      window.TP_GEO = { world: 110m 국가 경계(TopoJSON), detail: 확대해서 보는 나라들의 50m 경계(GeoJSON) }
//   assets/vendor/*.min.js   d3-array · d3-geo · topojson-client (ISC)
// 지도 데이터는 Natural Earth(퍼블릭 도메인)를 world-atlas 가 TopoJSON 으로 묶은 것이다.
// 사용: node tools/gen-geo.mjs <패키지를 풀어 둔 폴더>   (world-atlas, d3-geo, d3-array, topojson-client 가 <이름>-<버전>/package 로 들어 있는 곳)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const src = process.argv[2];
if (!src) throw new Error('usage: node tools/gen-geo.mjs <dir with unpacked npm packages>');
const pkg = name => join(src, readdirSync(src).find(d => d.startsWith(name + '-') && !d.endsWith('.tgz')), 'package');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topojson = createRequire(import.meta.url)(join(pkg('topojson-client'), 'dist/topojson-client.js'));

// 확대해서 보는 나라: 대한민국 · 북한 · 일본 · 대만 · 중국 (ISO 3166-1 숫자 코드)
const DETAIL = ['410', '408', '392', '158', '156'];
const w110 = JSON.parse(readFileSync(join(pkg('world-atlas'), 'countries-110m.json'), 'utf8'));
const w50 = JSON.parse(readFileSync(join(pkg('world-atlas'), 'countries-50m.json'), 'utf8'));
const r3 = v => Math.round(v * 1000) / 1000;
const round = c => (typeof c[0] === 'number' ? [r3(c[0]), r3(c[1])] : c.map(round));
const detail = {
  type: 'FeatureCollection',
  features: topojson.feature(w50, w50.objects.countries).features.filter(f => DETAIL.includes(String(f.id)))
    .map(f => ({ type: 'Feature', id: String(f.id), properties: { name: f.properties.name }, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) } })),
};
// 110m 쪽은 나라 경계만 남긴다 (land 오브젝트는 쓰지 않는다)
const world = { type: w110.type, transform: w110.transform, arcs: w110.arcs, objects: { countries: w110.objects.countries } };
mkdirSync(join(root, 'assets/geo'), { recursive: true });
const body = `// 생성 파일 — tools/gen-geo.mjs 가 만든다. 지도 데이터: Natural Earth (퍼블릭 도메인), world-atlas 2.0.2 의 TopoJSON.\nwindow.TP_GEO = ${JSON.stringify({ world, detail, detailIds: DETAIL })};\n`;
writeFileSync(join(root, 'assets/geo/world.js'), body);
mkdirSync(join(root, 'assets/vendor'), { recursive: true });
for (const [name, file] of [['d3-array', 'dist/d3-array.min.js'], ['d3-geo', 'dist/d3-geo.min.js'], ['topojson-client', 'dist/topojson-client.min.js']]) {
  copyFileSync(join(pkg(name), file), join(root, 'assets/vendor', file.split('/').pop()));
}
console.log('world.js', (body.length / 1024).toFixed(0) + ' KB', '| detail', detail.features.map(f => `${f.properties.name}(${JSON.stringify(f.geometry.coordinates).length >> 10}KB)`).join(' '));
