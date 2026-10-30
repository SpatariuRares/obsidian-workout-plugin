#!/usr/bin/env python3
"""Frame plugin screenshots for the README: purple gradient, rounded cards, phone bezels.

  phone OUT SHOT [SHOT ...]   phones side by side (the README hero)
  card  OUT SHOT [SHOT ...]   desktop cards side by side
  pair  OUT DESKTOP PHONE     a desktop card next to a phone

SHOT is a path, optionally cropped: path.png:x0,y0,x1,y1 (device pixels).
Needs Pillow (pip install pillow).
"""

import argparse

from PIL import Image, ImageDraw, ImageFilter

TOP, BOTTOM = (24, 12, 48), (88, 40, 170)
BORDER = (70, 60, 95, 255)
BEZEL = (18, 18, 22, 255)


def load(spec):
    path, _, box = spec.partition(":")
    im = Image.open(path).convert("RGB")
    return im.crop(tuple(int(v) for v in box.split(","))) if box else im


def gradient(w, h):
    vertical = Image.linear_gradient("L").resize((w, h))
    return Image.composite(Image.new("RGB", (w, h), BOTTOM), Image.new("RGB", (w, h), TOP), vertical).convert("RGBA")


def rounded_mask(w, h, radius):
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    return mask


def card(im, width, padding=30):
    # Pad with the screenshot's own background so the block does not touch the border
    bg = im.getpixel((5, 5))
    padded = Image.new("RGB", (im.width + 2 * padding, im.height + 2 * padding), bg)
    padded.paste(im, (padding, padding))
    padded = padded.resize((width, round(padded.height * width / padded.width)), Image.LANCZOS)
    out = Image.new("RGBA", padded.size, (0, 0, 0, 0))
    out.paste(padded.convert("RGBA"), (0, 0), rounded_mask(*padded.size, 26))
    ImageDraw.Draw(out).rounded_rectangle((0, 0, out.width - 1, out.height - 1), 26, outline=BORDER, width=3)
    return out


def phone(im, height):
    bezel, radius = round(height * 0.018), round(height * 0.06)
    sh = height - 2 * bezel
    sw = round(im.width * sh / im.height)
    out = Image.new("RGBA", (sw + 2 * bezel, height), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle((0, 0, out.width - 1, height - 1), radius + bezel, fill=BEZEL, outline=BORDER, width=3)
    out.paste(im.resize((sw, sh), Image.LANCZOS), (bezel, bezel), rounded_mask(sw, sh, radius))
    return out


def compose(items, out, out_width, offsets=None, pad=90, gap=80):
    w = 2 * pad + sum(i.width for i in items) + gap * (len(items) - 1)
    h = 2 * pad + max(i.height for i in items) + max(offsets or [0])
    bg = gradient(w, h)
    x = pad
    for n, item in enumerate(items):
        y = (h - item.height) // 2 + (offsets[n] if offsets else 0)
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((x + 8, y + 24, x + item.width + 8, y + item.height + 24), 40, fill=(0, 0, 0, 150))
        bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(30)))
        bg.alpha_composite(item, (x, y))
        x += item.width + gap
    bg = bg.convert("RGB")
    bg.resize((out_width, round(h * out_width / w)), Image.LANCZOS).save(out, optimize=True)
    print(out, f"{out_width}x{round(h * out_width / w)}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["phone", "card", "pair"])
    ap.add_argument("out")
    ap.add_argument("shots", nargs="+")
    ap.add_argument("--width", type=int, default=1600, help="output width in pixels (default 1600)")
    ap.add_argument("--phone-ratio", type=float, default=1.0, help="pair: phone height relative to the desktop card")
    ap.add_argument("--desktop-width", type=int, default=1300, help="pair/card: card width before scaling")
    a = ap.parse_args()
    shots = [load(s) for s in a.shots]

    if a.mode == "phone":
        phones = [phone(s, 1240) for s in shots]
        # Middle phone sits higher, as in the hero
        offsets = [0 if n == len(phones) // 2 else 80 for n in range(len(phones))] if len(phones) == 3 else None
        compose(phones, a.out, a.width, offsets, gap=110)
    elif a.mode == "card":
        compose([card(s, a.desktop_width) for s in shots], a.out, a.width, gap=60)
    else:
        if len(shots) != 2:
            ap.error("pair takes DESKTOP and PHONE")
        desktop = card(shots[0], a.desktop_width)
        compose([desktop, phone(shots[1], round(desktop.height * a.phone_ratio))], a.out, a.width)


if __name__ == "__main__":
    main()
