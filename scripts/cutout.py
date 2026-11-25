"""Remove o fundo branco de imagens do mascote (flood-fill a partir das bordas) e corta o excesso.
Uso: python3 scripts/cutout.py entrada.(jpg|png) saida.png [x0 y0 x1 y1]"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

def cutout(src, dst, box=None, thresh=22):
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    w, h = im.size
    # marca o fundo com magenta via flood fill a partir de todas as bordas
    work = im.copy()
    MAG = (255, 0, 255)
    seeds = [(x, 0) for x in range(0, w, 8)] + [(x, h - 1) for x in range(0, w, 8)] + \
            [(0, y) for y in range(0, h, 8)] + [(w - 1, y) for y in range(0, h, 8)]
    for s in seeds:
        if work.getpixel(s) != MAG and sum(work.getpixel(s)) > 3 * 225:
            ImageDraw.floodfill(work, s, MAG, thresh=thresh)
    px = work.load()
    mask = Image.new('L', (w, h), 255)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == MAG:
                mp[x, y] = 0
    # remove sombra/branco do chão que ficou entre as pernas e embaixo dos pés (parte baixa da imagem)
    import numpy as np
    arr = np.array(im).astype(int)
    mn = arr.min(axis=2)
    sat = arr.max(axis=2) - mn
    m = np.array(mask)
    ys = np.arange(h)[:, None]
    floor = (ys > h * 0.70) & (mn > 190) & (sat < 30)
    floor2 = (ys > h * 0.50) & (mn > 226) & (sat < 14)
    m[floor | floor2] = 0
    mask = Image.fromarray(m.astype('uint8'))
    # suaviza a borda
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst)
    print(dst, out.size)

if __name__ == '__main__':
    a = sys.argv
    box = tuple(map(int, a[3:7])) if len(a) >= 7 else None
    cutout(a[1], a[2], box)
