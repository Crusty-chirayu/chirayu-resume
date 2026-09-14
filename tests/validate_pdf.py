import sys
from pathlib import Path

from pypdf import PdfReader


def main() -> int:
    pdf = Path(sys.argv[1])
    if not pdf.is_file() or pdf.stat().st_size == 0:
        raise SystemExit(f"Invalid PDF file: {pdf}")
    reader = PdfReader(str(pdf))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    required_text = ["Chirayu Babu Jaysawal", "chirayujayaswal7@gmail.com"]
    missing = [value for value in required_text if value not in text]
    links = []
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            action = annotation.get_object().get("/A")
            if action and action.get("/URI"):
                links.append(str(action.get("/URI")))
    missing.extend(value for value in ["https://github.com/Crusty-chirayu", "https://linkedin.com/in/chirayu-babu-jaysawal"] if value not in links)
    if missing:
        raise SystemExit(f"PDF is missing expected text: {', '.join(missing)}")
    if not 1 <= len(reader.pages) <= 3:
        raise SystemExit("PDF has an unreasonable page count")
    print(f"Validated {pdf} ({len(reader.pages)} page(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())