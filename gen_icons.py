from PIL import Image, ImageDraw, ImageFont

BLUE = (0, 80, 170, 255)
BLUE_DARK = (0, 61, 128, 255)
YELLOW = (255, 209, 0, 255)
RED = (221, 7, 65, 255)


def make_icon(size, maskable=False, path="icon.png"):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.12) if maskable else 0
    inner = size - pad * 2

    # háttér kör / négyzet
    if maskable:
        draw.rectangle([0, 0, size, size], fill=BLUE)
    else:
        draw.rounded_rectangle([0, 0, size, size], radius=int(size * 0.22), fill=BLUE)

    # sárga csík (mint a Lidl logó alsó háromszöge, stilizálva)
    stripe_h = int(inner * 0.30)
    stripe_y = pad + int(inner * 0.62)
    draw.rectangle([pad, stripe_y, pad + inner, stripe_y + stripe_h], fill=YELLOW)

    # piros kör balra (kosár "L" monogramhoz háttér)
    circle_r = int(inner * 0.34)
    cx, cy = pad + int(inner * 0.5), pad + int(inner * 0.42)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        fill=RED,
        outline=YELLOW,
        width=max(2, int(size * 0.015)),
    )

    # "L" betű középre
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(circle_r * 1.3)
        )
    except Exception:
        font = ImageFont.load_default()

    text = "L"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text, fill="white", font=font)

    img.save(path)


make_icon(192, maskable=False, path="icons/icon-192.png")
make_icon(512, maskable=False, path="icons/icon-512.png")
make_icon(512, maskable=True, path="icons/icon-maskable-512.png")
print("Ikonok elkészültek.")
