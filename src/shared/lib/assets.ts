// 화면에 쓰는 그림(배경 사진 · 장소 사진 · 지도 · 이용 방법 그림 · 항공사 로고)의 주소.
// 자료에는 'photos/room_d.jpg' 처럼 src/assets 아래의 경로만 적고, 여기서 빌드된 주소로 바꾼다.
const files = import.meta.glob<string>(
  '../../assets/{bg,brands,map,photos,tutorial}/*.{jpg,webp,svg}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

export function asset(path: string): string {
  const url = files[`../../assets/${path}`];
  if (!url) throw new Error(`unknown asset: ${path}`);
  return url;
}
