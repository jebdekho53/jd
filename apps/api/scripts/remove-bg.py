#!/usr/bin/env python3
"""Remove the background from a product image.

Reads raw image bytes from stdin and writes a PNG (with transparent
background) to stdout. Used by the merchant AI product image pipeline to
clean the background of an uploaded photo while preserving the exact product
and its printed label. Requires `rembg` installed in the runtime venv.
"""
import sys


def main() -> int:
    data = sys.stdin.buffer.read()
    if not data:
        sys.stderr.write("no input image bytes\n")
        return 2
    try:
        from rembg import remove
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(f"rembg import failed: {exc}\n")
        return 3
    try:
        out = remove(data)
    except Exception as exc:
        sys.stderr.write(f"background removal failed: {exc}\n")
        return 4
    sys.stdout.buffer.write(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
