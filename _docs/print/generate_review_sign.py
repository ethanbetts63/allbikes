"""Generate the printable A4 Google review sign.

Run from the repository root:
    python _docs/print/generate_review_sign.py
"""

from pathlib import Path

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


REVIEW_URL = "https://g.page/r/CYrM-porNEqUEBM/review"

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = Path(__file__).with_name("google-review-counter-sign.pdf")
LOGO_PATH = ROOT / "frontend" / "public" / "full-size-logo.png"

NAVY = colors.HexColor("#0f1827")
INK = colors.HexColor("#1c1917")
BODY = colors.HexColor("#44403c")
MUTED = colors.HexColor("#78716c")
WARM_GREY = colors.HexColor("#f5f4f3")
LINE = colors.HexColor("#e7e5e4")
YELLOW = colors.HexColor("#fbbf24")
WHITE = colors.white


def centered_text(pdf, text, y, font, size, colour, page_width):
    pdf.setFont(font, size)
    pdf.setFillColor(colour)
    pdf.drawCentredString(page_width / 2, y, text)


def draw_qr(pdf, value, x, y, size):
    """Draw a vector QR code with an explicit white quiet zone."""
    quiet_zone = 16
    pdf.setFillColor(WHITE)
    pdf.roundRect(
        x - quiet_zone,
        y - quiet_zone,
        size + quiet_zone * 2,
        size + quiet_zone * 2,
        6,
        fill=1,
        stroke=0,
    )

    qr = QrCodeWidget(value)
    qr.barLevel = "H"
    qr.barFillColor = NAVY
    bounds = qr.getBounds()
    qr_width = bounds[2] - bounds[0]
    qr_height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / qr_width, 0, 0, size / qr_height, 0, 0])
    drawing.add(qr)
    drawing.drawOn(pdf, x, y)


def generate():
    page_width, page_height = A4
    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=A4)
    pdf.setTitle("Allbikes & Scooters — Google Review Counter Sign")
    pdf.setAuthor("Allbikes & Scooters")
    pdf.setSubject("Front-desk Google review QR code")

    # Full-page background.
    pdf.setFillColor(WARM_GREY)
    pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    # Branded header.
    header_height = 180
    pdf.setFillColor(NAVY)
    pdf.rect(0, page_height - header_height, page_width, header_height, fill=1, stroke=0)

    logo = ImageReader(str(LOGO_PATH))
    logo_width = 330
    logo_height = logo_width * 809 / 1536
    pdf.drawImage(
        logo,
        (page_width - logo_width) / 2,
        page_height - header_height + 3,
        width=logo_width,
        height=logo_height,
        preserveAspectRatio=True,
        mask="auto",
    )

    # Main white card.
    card_x = 38
    card_y = 55
    card_width = page_width - card_x * 2
    card_height = page_height - header_height - card_y - 10
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.8)
    pdf.roundRect(card_x, card_y, card_width, card_height, 8, fill=1, stroke=1)

    # Accent and headline.
    accent_width = 58
    pdf.setFillColor(YELLOW)
    pdf.roundRect((page_width - accent_width) / 2, 625, accent_width, 5, 2.5, fill=1, stroke=0)

    centered_text(pdf, "ENJOYED YOUR VISIT?", 584, "Helvetica-BoldOblique", 27, INK, page_width)
    centered_text(pdf, "We'd love to hear from you.", 552, "Helvetica", 15, BODY, page_width)

    # QR code and scan label.
    qr_size = 238
    qr_x = (page_width - qr_size) / 2
    qr_y = 278
    pdf.setFillColor(YELLOW)
    pdf.roundRect(qr_x - 23, qr_y - 23, qr_size + 46, qr_size + 46, 10, fill=1, stroke=0)
    draw_qr(pdf, REVIEW_URL, qr_x, qr_y, qr_size)

    centered_text(pdf, "SCAN TO LEAVE A GOOGLE REVIEW", 231, "Helvetica-Bold", 15, INK, page_width)
    centered_text(
        pdf,
        "Open your camera  •  Point it at the code  •  Tap the link",
        207,
        "Helvetica",
        10.5,
        MUTED,
        page_width,
    )

    # Thank-you message.
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(1)
    pdf.line(86, 180, page_width - 86, 180)
    centered_text(pdf, "Thank you for supporting a local Perth business.", 148, "Helvetica-Bold", 12.5, BODY, page_width)
    centered_text(pdf, "Your honest feedback helps us improve and helps others find us.", 127, "Helvetica", 10.5, MUTED, page_width)

    # Footer.
    footer = "scootershop.com.au   •   Unit 5 / 6 Cleveland Street, Dianella WA"
    centered_text(pdf, footer, 28, "Helvetica", 9, MUTED, page_width)

    # Retain the destination as selectable text without competing with the layout.
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 6)
    fallback = REVIEW_URL
    fallback_width = stringWidth(fallback, "Helvetica", 6)
    pdf.drawString((page_width - fallback_width) / 2, 15, fallback)

    pdf.showPage()
    pdf.save()
    print(f"Created {OUTPUT_PATH}")


if __name__ == "__main__":
    generate()
