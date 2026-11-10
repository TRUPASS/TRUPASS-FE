// 두 PNG를 브라우저 캔버스에 올려 채널 차이가 큰 픽셀을 센다 (외부 의존성 없이 비교하기 위해).
export async function pixelDiff(page, ref, shot) {
  return page.evaluate(async ([a, b]) => {
    const load = async s => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return { c, g, w: i.width, h: i.height }; };
    const A = await load(a), B = await load(b);
    if (A.w !== B.w || A.h !== B.h) return { err: `size ref ${A.w}x${A.h} vs ${B.w}x${B.h}` };
    const da = A.g.getImageData(0, 0, A.w, A.h), db = B.g.getImageData(0, 0, A.w, A.h), out = A.g.createImageData(A.w, A.h);
    let n = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      const hit = d > 64; if (hit) n++;
      const g = 255 - (255 - (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 3) * 0.25;
      out.data[i] = hit ? 220 : g; out.data[i + 1] = hit ? 30 : g; out.data[i + 2] = hit ? 30 : g; out.data[i + 3] = 255;
    }
    A.g.putImageData(out, 0, 0);
    return { n, total: A.w * A.h, pct: n / (A.w * A.h) * 100, png: A.c.toDataURL('image/png').split(',')[1] };
  }, [ref.toString('base64'), shot.toString('base64')]);
}
