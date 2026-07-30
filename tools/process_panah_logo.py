from pathlib import Path

from PIL import Image

src = Path(
    r"C:\Users\Mehrab\.cursor\projects\c-Users-Mehrab-Desktop\assets"
    r"\c__Users_Mehrab_AppData_Roaming_Cursor_User_workspaceStorage"
    r"_ddb16ea53969d8c9f2f4f77e2a3fa3e9_images"
    r"_ChatGPT_Image_Jul_28__2026__10_53_18_PM-a02f275e-3108-412c-85a3-fc8986030d54.png"
)
public = Path(r"c:\Users\Mehrab\Desktop\مدیریت بحران\frontend\public")
assets = Path(r"c:\Users\Mehrab\Desktop\مدیریت بحران\frontend\src\assets\images")
assets.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()
kept = 0
for y in range(h):
    for x in range(w):
        r, g, b, _a = pixels[x, y]
        lum = (r + g + b) / 3
        # Logo body ~14-16; soft edges ~3-9; pure black is background.
        if lum >= 10:
            op[x, y] = (12, 12, 12, 255)
            kept += 1
        elif lum >= 3:
            alpha = int(min(255, (lum / 10) * 255))
            op[x, y] = (12, 12, 12, alpha)
            kept += 1

bbox = out.getbbox()
cropped = out.crop(bbox)
pad = int(max(cropped.size) * 0.14)
cw, ch = cropped.size
side = max(cw, ch) + pad * 2
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(cropped, ((side - cw) // 2, (side - ch) // 2), cropped)


def save_png(name: str, size: int, with_white_bg: bool = False) -> None:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = max(1, size // 14)
    target = size - inset * 2
    resized = square.resize((target, target), Image.Resampling.LANCZOS)
    canvas.paste(resized, (inset, inset), resized)
    path = public / name
    if with_white_bg:
        flat = Image.new("RGB", (size, size), (255, 255, 255))
        flat.paste(canvas, mask=canvas.split()[-1])
        flat.save(path, "PNG")
    else:
        canvas.save(path, "PNG")


save_png("favicon.png", 32)
save_png("favicon-192.png", 192)
save_png("apple-touch-icon.png", 180, with_white_bg=True)

brand = square.resize((512, 512), Image.Resampling.LANCZOS)
brand.save(assets / "panah-logo.png", "PNG")
brand.save(public / "panah-logo.png", "PNG")

# Prefer PNG favicon; keep a thin SVG wrapper that references raster via object is not portable.
# Overwrite favicon.svg with a minimal white-plate + embedded lookalike paths is hard;
# instead point HTML to PNG first and remove SVG preference.

(Path(__file__).parent.parent / "frontend" / "public" / ".logo_ok").write_text(
    f"kept={kept} bbox={bbox}\n", encoding="utf-8"
)
