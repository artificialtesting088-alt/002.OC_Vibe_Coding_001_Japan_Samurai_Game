#!/usr/bin/env python3
"""Download the CC0 assets used by Kaze no Michi.

Sources:
- Characters: Grab3D free rigged character library (CC0 1.0)
- HDRI / textures / models: Poly Haven (CC0 1.0)

Character GLBs are downloaded at full resolution, then welded, simplified and
quantized with @gltf-transform/cli (a dev dependency) so the game ships with a
few megabytes of geometry instead of ~90 MB.
"""
from pathlib import Path
import json
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public" / "assets"
RAW = ROOT / ".raw"

UA = {"User-Agent": "Mozilla/5.0 (kaze-no-michi asset fetcher)"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as res:
        return res.read()


def get_json(url: str):
    return json.loads(get(url))


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        print(f"skip  {dest.relative_to(ROOT)}")
        return
    print(f"get   {dest.relative_to(ROOT)}")
    dest.write_bytes(get(url))


def gltf_transform(*args: str) -> None:
    subprocess.run(["npx", "gltf-transform", *args], cwd=ROOT, check=True)


def download_character(name: str) -> None:
    raw = RAW / f"{name}.glb"
    download(f"https://grab3d.com/dl/{name}-rigged/{name}-rigged.glb", raw)
    if raw.stat().st_size < 1024:
        raise RuntimeError(f"{name}: download failed")
    welded = RAW / f"{name}-weld.glb"
    low = RAW / f"{name}-low.glb"
    final = PUB / "characters" / f"{name}.glb"
    if not welded.exists():
        gltf_transform("weld", str(raw), str(welded))
    if not low.exists():
        gltf_transform("simplify", str(welded), str(low), "--ratio", "0.12", "--error", "0.002")
    gltf_transform("quantize", str(low), str(final))


def download_polyhaven_model(model_id: str) -> None:
    data = get_json(f"https://api.polyhaven.com/files/{model_id}")
    gltf = data["gltf"]["1k"]["gltf"]
    out = PUB / "models" / model_id
    download(gltf["url"], out / Path(gltf["url"]).name)
    for rel_path, info in gltf.get("include", {}).items():
        download(info["url"], out / rel_path)


def main() -> None:
    for name in ("samurai", "ninja", "farmer", "elderly-man", "woman", "king"):
        download_character(name)

    download(
        "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/qwantani_sunset_puresky_1k.hdr",
        PUB / "hdri" / "qwantani_sunset_puresky_1k.hdr",
    )

    texture_base = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass"
    for map_name in ("diff", "nor_gl", "rough"):
        download(
            f"{texture_base}/leafy_grass_{map_name}_1k.jpg",
            PUB / "textures" / "leafy_grass" / f"leafy_grass_{map_name}_1k.jpg",
        )

    download_polyhaven_model("jacaranda_tree")
    download_polyhaven_model("boulder_01")


if __name__ == "__main__":
    main()
