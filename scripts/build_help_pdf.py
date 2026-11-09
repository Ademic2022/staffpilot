"""
Build the StaffPilot user guide as a PDF from the same articles the in-app Help uses
(src/help/articles). Run from hrms-client with:  npm run help:pdf

Reads the guide through scripts/help-export.ts, then lays it out with ReportLab: a cover, a table
of contents with page numbers, and each audience's articles. Output: StaffPilot-User-Guide.pdf
next to this folder (hrms-client/), or the path given as the first argument.
"""

import datetime
import html
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Flowable, Image, KeepTogether, ListFlowable, ListItem, NextPageTemplate, PageBreak, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)
from reportlab.platypus.doctemplate import BaseDocTemplate
from reportlab.platypus.frames import Frame
from reportlab.platypus.tableofcontents import TableOfContents

CLIENT = Path(__file__).resolve().parent.parent
LOGO = CLIENT / "src" / "assets" / "staffpilot-logo.png"
OLIVE = colors.HexColor("#7a6c2e")
GOLD = colors.HexColor("#e09800")
INK = colors.HexColor("#1f2328")
MUTED = colors.HexColor("#5f6670")
TIP_BG = colors.HexColor("#fbf4e2")

FONT_DIR = Path("/System/Library/Fonts/Supplemental")


def register_fonts():
    """Arial (macOS) covers ₦, → and curly quotes; Arial Unicode adds ⌘. Elsewhere, fall back to Helvetica."""
    try:
        for name, file in (("Guide", "Arial.ttf"), ("Guide-Bold", "Arial Bold.ttf"), ("Guide-Italic", "Arial Italic.ttf"),
                           ("Guide-BoldItalic", "Arial Bold Italic.ttf")):
            pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
        pdfmetrics.registerFontFamily("Guide", normal="Guide", bold="Guide-Bold", italic="Guide-Italic", boldItalic="Guide-BoldItalic")
        fonts = {"regular": "Guide", "bold": "Guide-Bold", "italic": "Guide-Italic"}
    except Exception:  # noqa: BLE001 - not a Mac: the built-in fonts still work, without ₦ and ⌘
        fonts = {"regular": "Helvetica", "bold": "Helvetica-Bold", "italic": "Helvetica-Oblique"}
    try:
        pdfmetrics.registerFont(TTFont("Symbols", str(FONT_DIR / "Arial Unicode.ttf")))
        fonts["symbols"] = "Symbols"
    except Exception:  # noqa: BLE001
        fonts["symbols"] = None
    return fonts


FONTS = register_fonts()

BASE = ParagraphStyle("base", fontName=FONTS["regular"], fontSize=10, leading=14.5, textColor=INK, spaceAfter=6)
STYLES = {
    "section": ParagraphStyle("section", parent=BASE, fontName=FONTS["bold"], fontSize=24, leading=29, textColor=OLIVE, spaceAfter=6),
    "section_desc": ParagraphStyle("section_desc", parent=BASE, fontSize=12, leading=17, textColor=MUTED, spaceAfter=14),
    "article": ParagraphStyle("article", parent=BASE, fontName=FONTS["bold"], fontSize=16, leading=20, textColor=INK, spaceBefore=4, spaceAfter=3),
    "summary": ParagraphStyle("summary", parent=BASE, fontName=FONTS["italic"], textColor=MUTED, spaceAfter=4),
    "audience": ParagraphStyle("audience", parent=BASE, fontSize=8.5, leading=11, textColor=OLIVE, spaceAfter=8),
    "h2": ParagraphStyle("h2", parent=BASE, fontName=FONTS["bold"], fontSize=12, leading=16, textColor=OLIVE, spaceBefore=8, spaceAfter=4),
    "h3": ParagraphStyle("h3", parent=BASE, fontName=FONTS["bold"], fontSize=10.5, leading=14, spaceBefore=4, spaceAfter=3),
    "body": BASE,
    "list": ParagraphStyle("list", parent=BASE, spaceAfter=2),
    "tip": ParagraphStyle("tip", parent=BASE, fontSize=9.5, leading=13.5, spaceAfter=0),
    "cover_title": ParagraphStyle("cover_title", parent=BASE, fontName=FONTS["bold"], fontSize=34, leading=40, alignment=TA_CENTER, textColor=INK),
    "cover_sub": ParagraphStyle("cover_sub", parent=BASE, fontSize=13, leading=18, alignment=TA_CENTER, textColor=MUTED),
    "toc_title": ParagraphStyle("toc_title", parent=BASE, fontName=FONTS["bold"], fontSize=20, leading=26, textColor=OLIVE, spaceAfter=12),
}


def load_guide():
    out = subprocess.run(["npx", "vite-node", "scripts/help-export.ts"], cwd=CLIENT, check=True, capture_output=True, text=True)
    return json.loads(out.stdout)


def esc(text):
    text = html.escape(text, quote=False)
    if "⌘" in text:
        text = text.replace("⌘", f'<font name="{FONTS["symbols"]}">⌘</font>' if FONTS["symbols"] else "Cmd ")
    return text


def inline(text, titles):
    """**bold** and [links](…) to ReportLab markup. Links to other articles jump to them in the PDF."""
    out, last = [], 0
    for m in re.finditer(r"\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)", text):
        out.append(esc(text[last:m.start()]))
        if m.group(1):
            out.append(f"<b>{esc(m.group(1))}</b>")
        else:
            label, href = m.group(2), m.group(3)
            slug = href[6:] if href.startswith("/help/") else None
            if slug in titles:
                out.append(f'<a href="#{slug}" color="#7a6c2e"><u>{esc(label)}</u></a>')
            else:
                out.append(f"<b>{esc(label)}</b>")
        last = m.end()
    out.append(esc(text[last:]))
    return "".join(out)


def blocks(source):
    """The same small Markdown the app reads (src/help/render.tsx)."""
    result, para = [], []

    def flush():
        if para:
            result.append(("p", " ".join(para)))
            para.clear()

    for raw in source.replace("\r", "").split("\n"):
        line = raw.strip()
        if not line:
            flush()
            continue
        heading = re.match(r"^(#{2,3})\s+(.*)$", line)
        bullet = re.match(r"^[-*]\s+(.*)$", line)
        numbered = re.match(r"^\d+\.\s+(.*)$", line)
        tip = re.match(r"^>\s?(.*)$", line)
        shot = re.match(r"^!\[([^\]]*)\]\(shot:([a-z0-9-]+)\)$", line)
        if shot:
            flush()
            result.append(("shot", (shot.group(2), shot.group(1))))
            continue
        if line.startswith("|"):
            flush()
            if re.match(r"^\|[\s:|-]+\|?$", line):
                continue  # the |---|---| line under the header
            row = [c.strip() for c in line.strip("|").split("|")]
            if result and result[-1][0] == "table":
                result[-1][1].append(row)
            else:
                result.append(("table", [row]))
            continue
        if heading:
            flush()
            result.append(("h2" if len(heading.group(1)) == 2 else "h3", heading.group(2)))
        elif bullet or numbered:
            flush()
            kind = "ul" if bullet else "ol"
            text = (bullet or numbered).group(1)
            if result and result[-1][0] == kind:
                result[-1][1].append(text)
            else:
                result.append((kind, [text]))
        elif tip:
            flush()
            if result and result[-1][0] == "tip":
                result[-1] = ("tip", result[-1][1] + " " + tip.group(1))
            else:
                result.append(("tip", tip.group(1)))
        else:
            if not para and result and result[-1][0] in ("ul", "ol") and raw.startswith("  "):
                result[-1][1][-1] += " " + line
            else:
                para.append(line)
    flush()
    return result


class Anchor(Flowable):
    """An invisible bookmark and table-of-contents entry."""

    def __init__(self, text, level, key):
        super().__init__()
        self.text, self.level, self.key = text, level, key

    def wrap(self, *_):
        return 0, 0

    def draw(self):
        self.canv.bookmarkPage(self.key)
        self.canv.addOutlineEntry(self.text, self.key, level=self.level, closed=self.level == 0)


class Guide(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Anchor):
            self.notify("TOCEntry", (flowable.level, flowable.text, self.page, flowable.key))


def tip_box(text, titles):
    t = Table([[Paragraph(inline(text, titles), STYLES["tip"])]], colWidths=[None])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), TIP_BG), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def table_box(rows, titles):
    cell = ParagraphStyle("cell", parent=STYLES["tip"], fontSize=9, leading=12)
    head = ParagraphStyle("cell_head", parent=cell, fontName=FONTS["bold"])
    numeric = re.compile(r"^[−+-]?[₦\d.,]+$")
    data = []
    for r, row in enumerate(rows):
        out = []
        for c, text in enumerate(row):
            style = head if r == 0 else cell
            if r and c and numeric.match(text.replace("*", "")):
                style = ParagraphStyle(f"num{r}{c}", parent=style, alignment=2)
            out.append(Paragraph(inline(text, titles), style))
        data.append(out)
    t = Table(data, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TIP_BG), ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#d9d2bf")),
                           ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#d9d2bf")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return t


SHOTS = CLIENT / "public" / "help" / "shots"
CAPTION = ParagraphStyle("caption", fontName=FONTS["regular"], fontSize=8.5, leading=11, textColor=MUTED, spaceBefore=3)


def shot_box(name, caption, width):
    """A help screenshot (the light one), scaled to fit the column. None when it has not been taken yet."""
    file = SHOTS / f"{name}.webp"
    if not file.exists():
        return None
    from PIL import Image as Pil

    with Pil.open(file) as im:
        w, h = im.size
        png = io.BytesIO()  # JPEG keeps the PDF small; screenshots have no transparency worth keeping
        im.convert("RGB").save(png, "JPEG", quality=82, optimize=True)
    png.seek(0)
    scale = min(1.0, width / w, (110 * mm) / h)
    img = Image(png, width=w * scale, height=h * scale, hAlign="LEFT")
    frame = Table([[img]], hAlign="LEFT")
    frame.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#d9d2bf")),
                               ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                               ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    parts = [frame] + ([Paragraph(html.escape(caption), CAPTION)] if caption else [])
    return KeepTogether([Spacer(1, 2), *parts, Spacer(1, 8)])


def article_flowables(a, audiences, titles):
    who = ", ".join(audiences[x] for x in a["audience"])
    head = [Anchor(a["title"], 1, a["slug"]), Paragraph(html.escape(a["title"]), STYLES["article"]),
            Paragraph(html.escape(a["summary"]), STYLES["summary"]),
            Paragraph(f"FOR: {html.escape(who.upper())}", STYLES["audience"])]
    out = [KeepTogether(head)]
    for kind, value in blocks(a["body"]):
        if kind in ("h2", "h3"):
            out.append(Paragraph(html.escape(value), STYLES[kind]))
        elif kind == "p":
            out.append(Paragraph(inline(value, titles), STYLES["body"]))
        elif kind == "tip":
            out += [Spacer(1, 2), tip_box(value, titles), Spacer(1, 8)]
        elif kind == "table":
            out += [Spacer(1, 2), table_box(value, titles), Spacer(1, 8)]
        elif kind == "shot":
            box = shot_box(*value, width=A4[0] - 40 * mm - 12)  # the column, less the frame's padding
            if box:
                out.append(box)
        else:
            items = [ListItem(Paragraph(inline(t, titles), STYLES["list"]), leftIndent=14) for t in value]
            out.append(ListFlowable(items, bulletType="bullet" if kind == "ul" else "1", start="•" if kind == "ul" else None,
                                    leftIndent=14, bulletFontSize=9, bulletColor=OLIVE, spaceAfter=6))
    out.append(Spacer(1, 14))
    return out


def page_decor(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(colors.HexColor("#e4e0d2"))
    canvas.setLineWidth(0.6)
    canvas.line(20 * mm, h - 15 * mm, w - 20 * mm, h - 15 * mm)
    canvas.setFont(FONTS["regular"], 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, h - 12 * mm, "StaffPilot user guide")
    canvas.drawRightString(w - 20 * mm, 12 * mm, f"{doc.page}")
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GOLD)
    canvas.rect(0, 0, w, 8 * mm, stroke=0, fill=1)
    canvas.restoreState()


def build(target):
    guide = load_guide()
    audiences = guide["audiences"]
    titles = {a["slug"]: a["title"] for s in guide["sections"] for a in s["articles"]}
    doc = Guide(str(target), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=22 * mm, bottomMargin=20 * mm,
                title="StaffPilot user guide", author="StaffPilot", subject="How to use StaffPilot")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([PageTemplate("cover", [frame], onPage=cover), PageTemplate("page", [frame], onPage=page_decor)])

    story = [Spacer(1, 45 * mm)]
    if LOGO.exists():
        story.append(Image(str(LOGO), width=62 * mm, height=59 * mm, kind="proportional"))
    count = sum(len(s["articles"]) for s in guide["sections"])
    story += [Spacer(1, 14 * mm), Paragraph("User guide", STYLES["cover_title"]), Spacer(1, 6 * mm),
              Paragraph("How to use StaffPilot: for everyone, managers, HR and payroll", STYLES["cover_sub"]), Spacer(1, 3 * mm),
              Paragraph(f"{count} articles · {datetime.date.today():%d %B %Y}", STYLES["cover_sub"]),
              NextPageTemplate("page"), PageBreak()]

    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle("toc0", parent=BASE, fontName=FONTS["bold"], fontSize=11.5, leading=16, textColor=OLIVE, spaceBefore=8),
        ParagraphStyle("toc1", parent=BASE, fontSize=9.5, leading=13, leftIndent=12, spaceAfter=0),
    ]
    story += [Paragraph("Contents", STYLES["toc_title"]), toc, PageBreak()]

    for i, s in enumerate(guide["sections"]):
        story += [Anchor(s["title"], 0, f"section-{s['key']}"), Paragraph(html.escape(s["title"]), STYLES["section"]),
                  Paragraph(html.escape(s["description"]), STYLES["section_desc"])]
        for a in s["articles"]:
            story += article_flowables(a, audiences, titles)
        if i < len(guide["sections"]) - 1:
            story.append(PageBreak())
    doc.multiBuild(story)
    return count


if __name__ == "__main__":
    out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else CLIENT / "StaffPilot-User-Guide.pdf"
    n = build(out)
    print(f"Wrote {out} ({n} articles)")
