"""
PDF Report Generator — uses ReportLab to produce a professional forensic report.
"""
import io
import os
import logging
import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from backend.database.config import get_db
from backend.models.models import Case, Report

logger = logging.getLogger("forensix.reports")
router = APIRouter()


# ── Color Palette ──────────────────────────────────────────────────────────────
COL_DARK  = colors.HexColor("#0B0F19")
COL_BLUE  = colors.HexColor("#3B82F6")
COL_GREEN = colors.HexColor("#10B981")
COL_RED   = colors.HexColor("#EF4444")
COL_AMBER = colors.HexColor("#F59E0B")
COL_LIGHT = colors.HexColor("#E2E8F0")

def _threat_color(level: float):
    if level >= 75: return COL_RED
    if level >= 40: return COL_AMBER
    return COL_GREEN


def _build_pdf(case: Case) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=20*mm, bottomMargin=20*mm,
        leftMargin=20*mm, rightMargin=20*mm
    )

    styles = getSampleStyleSheet()
    title_style  = ParagraphStyle("title",  fontName="Helvetica-Bold", fontSize=22, textColor=COL_BLUE, spaceAfter=4)
    sub_style    = ParagraphStyle("sub",    fontName="Helvetica",      fontSize=10, textColor=COL_LIGHT, spaceAfter=12)
    section_style= ParagraphStyle("section",fontName="Helvetica-Bold", fontSize=13, textColor=COL_BLUE, spaceBefore=12, spaceAfter=6)
    body_style   = ParagraphStyle("body",   fontName="Helvetica",      fontSize=10, textColor=colors.black, spaceAfter=4)
    mono_style   = ParagraphStyle("mono",   fontName="Courier",        fontSize=9, textColor=colors.black, spaceAfter=2)

    story = []

    # ── Header ─────────────────────────────────────────────────────────────────
    story.append(Paragraph("ForensiX — Crime Scene Intelligence Report", title_style))
    story.append(Paragraph(f"CONFIDENTIAL — LAW ENFORCEMENT USE ONLY", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=COL_BLUE))
    story.append(Spacer(1, 6*mm))

    # ── Case Metadata ──────────────────────────────────────────────────────────
    tc = _threat_color(case.threat_level)
    meta_data = [
        ["Case Number",   case.case_number,      "Status",       case.status],
        ["Title",         case.title,             "Priority",     case.priority],
        ["Location",      case.location or "—",   "Investigator", case.investigator or "—"],
        ["Created",       case.created_at.strftime("%Y-%m-%d %H:%M UTC"), "Threat Level", f"{case.threat_level:.1f} / 100"],
    ]
    meta_table = Table(meta_data, colWidths=[35*mm, 65*mm, 35*mm, 35*mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), COL_DARK),
        ("BACKGROUND",    (2, 0), (2, -1), COL_DARK),
        ("TEXTCOLOR",     (0, 0), (0, -1), COL_LIGHT),
        ("TEXTCOLOR",     (2, 0), (2, -1), COL_LIGHT),
        ("TEXTCOLOR",     (1, 0), (-1, -1), colors.black),
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING",       (0, 0), (-1, -1), 6),
        ("TEXTCOLOR",     (3, 3), (3, 3), tc),
        ("FONTNAME",      (3, 3), (3, 3), "Helvetica-Bold"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6*mm))

    # ── Threat Indicator ───────────────────────────────────────────────────────
    story.append(Paragraph("Threat Assessment", section_style))
    threat_text = "CRITICAL" if case.threat_level >= 75 else "ELEVATED" if case.threat_level >= 40 else "LOW"
    threat_data = [[f"Threat Level: {case.threat_level:.1f}%  [{threat_text}]"]]
    threat_table = Table(threat_data, colWidths=["100%"])
    threat_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), tc),
        ("TEXTCOLOR",  (0,0), (-1,-1), colors.white),
        ("FONTNAME",   (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 14),
        ("ALIGN",      (0,0), (-1,-1), "CENTER"),
        ("PADDING",    (0,0), (-1,-1), 10),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(threat_table)
    story.append(Spacer(1, 6*mm))

    ai = case.ai_results or {}

    # ── Weapon Detection ───────────────────────────────────────────────────────
    story.append(Paragraph("Weapon Detection (YOLOv8)", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COL_BLUE))
    story.append(Spacer(1, 3*mm))
    wd = ai.get("weapon_detection", {})
    detections = wd.get("detections", [])
    if detections:
        w_data = [["#", "Label", "Confidence", "Bounding Box"]]
        for i, d in enumerate(detections, 1):
            box = d.get("box", [])
            w_data.append([str(i), d.get("label","—"), f"{d.get('confidence',0)*100:.1f}%", str(box)])
        wt = Table(w_data, colWidths=[10*mm, 50*mm, 40*mm, 70*mm])
        wt.setStyle(TableStyle([
            ("BACKGROUND",  (0,0),(-1,0), COL_BLUE),
            ("TEXTCOLOR",   (0,0),(-1,0), colors.white),
            ("FONTNAME",    (0,0),(-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0),(-1,-1), 9),
            ("GRID",        (0,0),(-1,-1), 0.5, colors.lightgrey),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.HexColor("#F8FAFC")]),
            ("PADDING",     (0,0),(-1,-1), 5),
        ]))
        story.append(wt)
    else:
        story.append(Paragraph("No weapons or threat objects identified.", body_style))
    story.append(Spacer(1, 4*mm))

    # ── Blood Analysis ─────────────────────────────────────────────────────────
    story.append(Paragraph("Blood Spatter Analysis (OpenCV HSV)", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COL_RED))
    story.append(Spacer(1, 3*mm))
    ba = ai.get("blood_analysis", {})
    b_data = [
        ["Pattern Classified:", ba.get("pattern", "None detected")],
        ["Spot Count:",         str(ba.get("spots_count", 0))],
        ["Average Spot Size:",  f"{ba.get('average_size',0):.2f} px²"],
    ]
    bt = Table(b_data, colWidths=[50*mm, 120*mm])
    bt.setStyle(TableStyle([
        ("FONTNAME",  (0,0),(0,-1), "Helvetica-Bold"),
        ("FONTSIZE",  (0,0),(-1,-1), 9),
        ("GRID",      (0,0),(-1,-1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.HexColor("#FFF5F5"), colors.white]),
        ("PADDING",   (0,0),(-1,-1), 5),
    ]))
    story.append(bt)
    story.append(Spacer(1, 4*mm))

    # ── Footprint Match ────────────────────────────────────────────────────────
    story.append(Paragraph("Footprint / Tread Match (ORB)", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COL_BLUE))
    story.append(Spacer(1, 3*mm))
    fm = ai.get("footprint_match", {})
    match_text = "MATCH FOUND" if fm.get("match") else "No Match"
    story.append(Paragraph(f"Result: <b>{match_text}</b>  |  Similarity: {fm.get('similarity',0):.1f}%  |  Best Match File: {fm.get('best_match','—')}", body_style))
    story.append(Spacer(1, 4*mm))

    # ── Face Recognition ───────────────────────────────────────────────────────
    story.append(Paragraph("Biometric Face Recognition", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COL_GREEN))
    story.append(Spacer(1, 3*mm))
    fr = ai.get("face_recognition", {})
    faces_found = fr.get("faces", [])
    if faces_found:
        f_data = [["#", "Identity", "Confidence", "Bounding Box"]]
        for i, f in enumerate(faces_found, 1):
            f_data.append([str(i), f.get("name","Unknown"), f"{f.get('confidence',0):.1f}%", str(f.get("box",[]))])
        ft = Table(f_data, colWidths=[10*mm, 60*mm, 40*mm, 60*mm])
        ft.setStyle(TableStyle([
            ("BACKGROUND",  (0,0),(-1,0), COL_GREEN),
            ("TEXTCOLOR",   (0,0),(-1,0), colors.white),
            ("FONTNAME",    (0,0),(-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0),(-1,-1), 9),
            ("GRID",        (0,0),(-1,-1), 0.5, colors.lightgrey),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.HexColor("#F0FFF4")]),
            ("PADDING",     (0,0),(-1,-1), 5),
        ]))
        story.append(ft)
    else:
        story.append(Paragraph("No faces detected or no matching identities in the suspect database.", body_style))
    story.append(Spacer(1, 8*mm))

    # ── Footer ─────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=COL_BLUE))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        f"Report generated by ForensiX AI System — {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        ParagraphStyle("footer", fontName="Helvetica", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()


@router.post("/{case_id}/generate", summary="Generate PDF forensic report for a case")
def generate_report(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    logger.info(f"Generating PDF report for case {case.case_number}")
    pdf_bytes = _build_pdf(case)

    # Save a copy locally
    report_path = Path("storage/reports") / f"{case.case_number}.pdf"
    with open(report_path, "wb") as f:
        f.write(pdf_bytes)

    # Upsert report record
    existing = db.query(Report).filter(Report.case_id == case_id).first()
    if existing:
        existing.file_path = str(report_path)
    else:
        db.add(Report(case_id=case_id, file_path=str(report_path)))
    db.commit()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ForensiX_{case.case_number}.pdf"'}
    )
