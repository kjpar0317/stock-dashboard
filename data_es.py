import json
import gzip
from pathlib import Path


def export_dashboard(data: dict, output_path: str) -> None:
    """Export dashboard data to a JavaScript file and a gzipped version.

    The function creates ``window.DASHBOARD_DATA = <json>;`` content, writes it
    to *output_path* using UTF‑8 with a BOM (``utf-8-sig``) for Excel/Windows
    compatibility, and additionally writes a gzip‑compressed copy with the same
    content and ``.gz`` suffix.

    Parameters
    ----------
    data: dict
        Arbitrary JSON‑serialisable dashboard payload.
    output_path: str
        Destination file path (e.g. ``"dashboard/data.js"``). Parent
        directories are created if they do not exist.
    """
    # Resolve path and ensure the directory exists
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Build the JavaScript assignment string
    js_content = f"window.DASHBOARD_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};"

    # Write the plain .js file with UTF‑8‑SIG encoding (includes BOM)
    out_path.write_text(js_content, encoding="utf-8-sig")

    # Write the gzip‑compressed version alongside it
    gz_path = out_path.with_suffix(out_path.suffix + ".gz")
    with gzip.open(gz_path, "wt", encoding="utf-8-sig") as gz_file:
        gz_file.write(js_content)
