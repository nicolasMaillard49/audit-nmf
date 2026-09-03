from pathlib import Path
import sys
import pypdfium2 as pdfium

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("output/pdf/audit-rh-patrimoine-nmf.pdf")
target = Path("tmp/pdfs/rh-patrimoine")
target.mkdir(parents=True, exist_ok=True)

pdf = pdfium.PdfDocument(source)
for index in range(len(pdf)):
    image = pdf[index].render(scale=1.6).to_pil()
    image.save(target / f"page-{index + 1:02d}.png")
print(f"rendered={len(pdf)}")
