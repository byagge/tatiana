"""Generate a portrait + price list banner for Tatiana's services."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PORTRAIT = ROOT / "apps/web/public/images/tatiana-portrait.png"
OUT = ROOT / "apps/web/public/images/services-prices.png"
FONTS = ROOT / "apps/web/public/fonts"

PRICES = [
    ("Личная консультация", "6 000 руб."),
    ("Супервизия", "3 000 руб."),
    ("Групповые", "3 000 руб."),
    ("Видео курсы", "от 3 000 руб."),
]


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = FONTS / name
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main() -> None:
    portrait = Image.open(PORTRAIT).convert("RGBA")
    w, h = portrait.size
    canvas = portrait.copy()
    draw = ImageDraw.Draw(canvas)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((0, int(h * 0.52), w, h), fill=(28, 24, 22, 190))
    canvas = Image.alpha_composite(canvas, overlay)
    draw = ImageDraw.Draw(canvas)

    title_font = load_font("PlayfairDisplay-Regular.ttf", max(34, w // 22))
    row_font = load_font("AvenirNextCyr-Regular.ttf", max(28, w // 28))
    price_font = load_font("AvenirNextCyr-Light.ttf", max(28, w // 28))

    y = int(h * 0.56)
    draw.text((w * 0.06, y - 52), "Услуги и стоимость", fill=(245, 240, 235, 255), font=title_font)

    for label, price in PRICES:
        draw.text((w * 0.06, y), label, fill=(245, 240, 235, 255), font=row_font)
        bbox = draw.textbbox((0, 0), price, font=price_font)
        price_w = bbox[2] - bbox[0]
        draw.text((w * 0.94 - price_w, y), price, fill=(230, 220, 210, 255), font=price_font)
        y += max(42, h // 22)

    canvas.convert("RGB").save(OUT, quality=92)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    main()
