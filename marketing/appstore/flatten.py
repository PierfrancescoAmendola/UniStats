"""Stitches captured bands into one RGB PNG: App Store Connect rejects images with an alpha channel.

    python3 marketing/appstore/flatten.py --stitch out.png WIDTH HEIGHT band0.png [band1.png ...]

The band files are deleted afterwards.
"""
import os
import sys

from PIL import Image

_, flag, out, width, height, *parts = sys.argv
assert flag == '--stitch'
canvas = Image.new('RGB', (int(width), int(height)))
y = 0
for part in parts:
    with Image.open(part) as img:
        canvas.paste(img.convert('RGB'), (0, y))
        y += img.height
    os.remove(part)
canvas.save(out)
