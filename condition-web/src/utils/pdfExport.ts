import jsPDF from "jspdf";
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import { format } from "date-fns";
// ─── Page constants ────────────────────────────────────────────────────────────
const PW = 210; // A4 width  mm
const PH = 297; // A4 height mm
const ML = 14;  // left margin
const MR = 14;  // right margin
const MT = 14;  // top margin
const MB = 14;  // bottom margin
const CW = PW - ML - MR; // content width

type RGB = [number, number, number];

const C = {
  DARK:         [10,  10,  10]  as RGB,       // #0a0a0a
  CONTENT:      [16,  24,  40]  as RGB,       // #101828 — subcondition text
  GRAY:         [74,  85,  101] as RGB,       // #4a5565
  SUBTITLE:     [54,  65,  83]  as RGB,       // #364153
  LIGHT_GRAY:   [189, 189, 189] as RGB,
  WHITE:        [255, 255, 255] as RGB,
  GREEN_BORDER: [0,   166,  62] as RGB,       // #00a63e
  GREEN_BG:     [240, 253, 244] as RGB,       // #f0fdf4
  GREEN_TEXT:   [0,   130,  54] as RGB,       // #008236
  GOLD_BORDER:  [255, 185,   0] as RGB,       // #ffb900
  GOLD_BG:      [255, 251, 235] as RGB,       // #fffbeb
  GOLD_TEXT:    [187,  77,   0] as RGB,       // #bb4d00
  BC_BLUE:      [46,   93, 215] as RGB,       // #2e5dd7
  BLUE_BG:      [239, 246, 255] as RGB,       // #eff6ff
  INFO_BOX_BG:  [241, 248, 254] as RGB,       // #f1f8fe
  BLUE_ACCENT:  [46,   93, 215] as RGB,       // #2e5dd7
  CARD_BORDER:  [229, 231, 235] as RGB,       // #e5e7eb
  CARD_BG:      [249, 250, 251] as RGB,       // #f9fafb
  SEPARATOR:    [209, 213, 220] as RGB,       // #d1d5dc
};

// ─── Disclaimer constants ───────────────────────────────────────────────────────
const DISC_H    = 13;   // mm — reserved height at bottom of every page
const DISC_PAD_H = 4;   // horizontal padding inside box
const DISC_PAD_V = 2.5; // vertical padding inside box
const DISC_BG: RGB = [254, 242, 242]; // light red background

// ─── Module-level state (reset each export call) ───────────────────────────────
let _doc: jsPDF;
let _y: number;

function drawDisclaimer() {
  const boxY  = PH - MB - DISC_H;
  const textX = ML + DISC_PAD_H;
  const textW = CW - DISC_PAD_H * 2;
  const lineH = lh(8.5, 1.35);

  drawRect(ML, boxY, CW, DISC_H, DISC_BG);

  _doc.setFontSize(8.5);
  _doc.setFont("helvetica", "bold");
  _doc.setTextColor(C.DARK[0], C.DARK[1], C.DARK[2]);
  const prefix  = "DISCLAIMER: ";
  const prefixW = _doc.getTextWidth(prefix);

  const body = "This is not an official document. To view official project conditions, please refer to the original condition document(s) found on the EAO's EPIC website.";
  _doc.setFont("helvetica", "normal");
  const bodyLines = _doc.splitTextToSize(body, textW - prefixW) as string[];

  const totalTextH = bodyLines.length * lineH;
  const startY = boxY + DISC_PAD_V + (DISC_H - DISC_PAD_V * 2 - totalTextH) / 2 + lineH * 0.75;

  _doc.setFont("helvetica", "bold");
  _doc.text(prefix, textX, startY);
  _doc.setFont("helvetica", "normal");
  for (let i = 0; i < bodyLines.length; i++) {
    _doc.text(bodyLines[i], i === 0 ? textX + prefixW : textX, startY + i * lineH);
  }
}

function newPage() {
  drawDisclaimer();
  _doc.addPage();
  _y = MT;
}

function ensureSpace(needed: number) {
  if (_y + needed > PH - MB - DISC_H - 3) newPage();
}

function setFont(
  size: number,
  style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
  color: RGB = C.DARK
) {
  _doc.setFontSize(size);
  _doc.setFont("helvetica", style);
  _doc.setTextColor(color[0], color[1], color[2]);
}

/** Line height in mm for a given pt size */
function lh(pt: number, mult = 1.35): number {
  return pt * 0.3528 * mult;
}

function drawRect(
  x: number, y: number, w: number, h: number,
  fill?: RGB, stroke?: RGB, strokeW = 0.2
) {
  if (fill)   _doc.setFillColor(fill[0],   fill[1],   fill[2]);
  if (stroke) { _doc.setDrawColor(stroke[0], stroke[1], stroke[2]); _doc.setLineWidth(strokeW); }
  _doc.rect(x, y, w, h, fill && stroke ? "FD" : fill ? "F" : "D");
}

function drawHRule(x1: number, y: number, x2: number, color: RGB = C.LIGHT_GRAY, w = 0.2) {
  _doc.setDrawColor(color[0], color[1], color[2]);
  _doc.setLineWidth(w);
  _doc.line(x1, y, x2, y);
}

// ─── Inline chip helpers ───────────────────────────────────────────────────────

const CHIP_H    = 7.94;  // mm (30px = 5+20+5px padding+line-height+padding)
const CHIP_PL   = 3.44;  // left padding mm  (13px)
const CHIP_PR   = 3.27;  // right padding mm (12.359px)
const CHIP_FONT = 10.5;  // pt (14px)
const CHIP_R    = 1.06;  // border-radius mm (4px)
// Text baseline: chip top + top-pad(1.32) + line-height(5.29) - descender(~1.3) ≈ top + 5.3
const CHIP_TEXT_DY = 5.3;

/** Returns the chip width in mm */
function chipWidth(label: string): number {
  _doc.setFontSize(CHIP_FONT);
  _doc.setFont("helvetica", "normal");
  return _doc.getTextWidth(label) + CHIP_PL + CHIP_PR;
}

/**
 * Draw a status chip (Approved / Awaiting Approval).
 * x, y = top-left corner of chip.
 */
function drawStatusChip(
  label: string,
  isApproved: boolean | undefined,
  x: number,
  y: number
) {
  const border    = isApproved === true ? C.GREEN_BORDER : C.GOLD_BORDER;
  const bg        = isApproved === true ? C.GREEN_BG     : C.GOLD_BG;
  const textColor = isApproved === true ? C.GREEN_TEXT   : C.GOLD_TEXT;
  const cw        = chipWidth(label);
  _doc.setFillColor(bg[0], bg[1], bg[2]);
  _doc.setDrawColor(border[0], border[1], border[2]);
  _doc.setLineWidth(0.35);
  _doc.roundedRect(x, y, cw, CHIP_H, CHIP_R, CHIP_R, "FD");
  setFont(CHIP_FONT, "normal", textColor);
  _doc.text(label, x + CHIP_PL, y + CHIP_TEXT_DY);
}

/**
 * Draw a blue "Amended Version" chip.
 * "Amended Version:" prefix is bold-italic; the amendment name is normal weight.
 * x, y = top-left corner of chip.
 */
function drawAmendChip(label: string, x: number, y: number) {
  const PREFIX = "Amended Version: ";
  const hasPrefix = label.startsWith(PREFIX);
  const suffix = hasPrefix ? label.slice(PREFIX.length) : label;

  // Measure each segment with its own font style for accurate width
  _doc.setFontSize(CHIP_FONT);
  _doc.setFont("helvetica", "bolditalic");
  const prefixW = hasPrefix ? _doc.getTextWidth(PREFIX) : 0;
  _doc.setFont("helvetica", "normal");
  const suffixW = _doc.getTextWidth(hasPrefix ? suffix : label);

  const cw = prefixW + suffixW + CHIP_PL + CHIP_PR;
  _doc.setFillColor(C.BLUE_BG[0], C.BLUE_BG[1], C.BLUE_BG[2]);
  _doc.setDrawColor(C.BC_BLUE[0], C.BC_BLUE[1], C.BC_BLUE[2]);
  _doc.setLineWidth(0.35);
  _doc.roundedRect(x, y, cw, CHIP_H, CHIP_R, CHIP_R, "FD");

  const textY = y + CHIP_TEXT_DY;
  if (hasPrefix) {
    setFont(CHIP_FONT, "bolditalic", C.BC_BLUE);
    _doc.text(PREFIX, x + CHIP_PL, textY);
    setFont(CHIP_FONT, "normal", C.BC_BLUE);
    _doc.text(suffix, x + CHIP_PL + prefixW, textY);
  } else {
    setFont(CHIP_FONT, "normal", C.BC_BLUE);
    _doc.text(label, x + CHIP_PL, textY);
  }
}

// ─── Header section ────────────────────────────────────────────────────────────

function addHeader(
  projectName: string,
  conditions: ConditionModel[],
  eaoLogoData?: string
) {
  _y = MT;

  // ── Logo (left) and title (right) ───────────────────────────────────────────
  const titleAreaW = CW * 0.55;

  // EAO logo only (already contains BC logo) — 516×96px → 70×13mm (ratio 5.375:1)
  const LOGO_W = 70;
  const LOGO_H = 13;
  if (eaoLogoData) {
    try { _doc.addImage(eaoLogoData, "PNG", ML, _y + 2, LOGO_W, LOGO_H); } catch { /* ignore */ }
  }

  // "Consolidated Conditions" — right-aligned
  _doc.setFont("helvetica", "bold");
  _doc.setFontSize(22);
  _doc.setTextColor(C.DARK[0], C.DARK[1], C.DARK[2]);
  _doc.text("Consolidated Conditions", PW - MR, _y + 8, { align: "right" });

  // Project name — right-aligned under title
  _doc.setFontSize(15);
  _doc.setFont("helvetica", "normal");
  _doc.setTextColor(C.SUBTITLE[0], C.SUBTITLE[1], C.SUBTITLE[2]);
  const projLines = _doc.splitTextToSize(projectName, titleAreaW) as string[];
  const projLineH = lh(15, 1.3);
  for (let i = 0; i < projLines.length; i++) {
    _doc.text(projLines[i], PW - MR, _y + 17 + i * projLineH, { align: "right" });
  }

  // Status chip — right-aligned below project name
  const allApproved = conditions.every((c) => c.is_approved === true);
  const overallLabel = allApproved ? "Approved" : "Awaiting Approval";
  const chipY = _y + 17 + projLines.length * projLineH - 2;
  const chipX = PW - MR - chipWidth(overallLabel);
  drawStatusChip(overallLabel, allApproved, chipX, chipY);

  _y += 17 + projLines.length * projLineH + CHIP_H + 6; // dynamic row height + gap

  // ── Horizontal separator ──────────────────────────────────────────────────────
  drawHRule(ML, _y, PW - MR, C.SEPARATOR, 0.5);
  _y += 9;              // 33px gap after separator → stats

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const totalConditions = conditions.length;

  // Collect unique amendment names from all conditions
  const amendmentSet = new Set<string>();
  conditions.forEach((c) => {
    if (c.amendment_names) {
      c.amendment_names.split(",").forEach((a) => {
        const trimmed = a.trim();
        if (trimmed) amendmentSet.add(trimmed);
      });
    }
  });
  const amendmentList = Array.from(amendmentSet).join(", ");

  const statsRows: [string, string][] = [
    ["Generated on:", today],
    ["Total Conditions:", String(totalConditions)],
    ...(amendmentList ? [["Included Amendments:", amendmentList] as [string, string]] : []),
  ];

  const statLabelW = 50;
  for (const [label, value] of statsRows) {
    setFont(10.5, "bold", C.DARK);
    _doc.text(label, ML, _y);
    setFont(10.5, "normal", C.DARK);
    const valueLines = _doc.splitTextToSize(value, CW - statLabelW) as string[];
    for (let i = 0; i < valueLines.length; i++) {
      _doc.text(valueLines[i], ML + statLabelW, _y + i * lh(10.5, 1.3));
    }
    _y += valueLines.length * lh(10.5, 1.3) + 2.1; // 8px row gap
  }

  _y += 8.47;           // 32px gap stats → info box

  // ── Info / disclaimer box ─────────────────────────────────────────────────────
  // Figma: padding 16px top / 16px right / 16px bottom / 20px left, gap 12px between paras
  // border-l-4 (4px = 1.06mm) + padding-left 20px = 5.29mm → text at ML + 6.35mm
  const BOX_ACCENT  = 1.06;  // 4px border-left
  const BOX_PL      = 5.29;  // 20px padding-left (after accent)
  const BOX_PR      = 4.23;  // 16px padding-right
  const BOX_PT_TEXT = 7.0;   // baseline offset: 16px pad + cap-height(~2.7mm) so visual top aligns
  const BOX_PB      = 4.23;  // 16px padding-bottom (same as top)
  const BOX_GAP     = 3.17;  // 12px gap between paragraphs
  const BOX_TEXT_X  = ML + BOX_ACCENT + BOX_PL;
  const BOX_TEXT_W  = CW - BOX_ACCENT - BOX_PL - BOX_PR;
  const boxLineH    = lh(10.5, 1.4);

  const para1 =
    "This Consolidated Conditions document contains the most recent condition information as " +
    "entered in the Condition Repository. This is not an official or enforceable document and " +
    "should be used supplementary to official documents.";
  const para2 =
    "Note: Conditions with the status \u2018Awaiting Approval\u2019 have not been approved by a staff member.";

  setFont(10.5, "normal", C.SUBTITLE);
  const para1Lines = _doc.splitTextToSize(para1, BOX_TEXT_W) as string[];
  const para2Lines = _doc.splitTextToSize(para2, BOX_TEXT_W) as string[];

  const boxH = BOX_PT_TEXT
    + para1Lines.length * boxLineH
    + BOX_GAP
    + para2Lines.length * boxLineH
    + BOX_PB;

  const boxStartY = _y;

  // Background + left accent bar
  drawRect(ML, _y, CW, boxH, C.INFO_BOX_BG);
  _doc.setFillColor(C.BLUE_ACCENT[0], C.BLUE_ACCENT[1], C.BLUE_ACCENT[2]);
  _doc.rect(ML, _y, BOX_ACCENT, boxH, "F");

  _y += BOX_PT_TEXT;

  for (const line of para1Lines) {
    _doc.text(line, BOX_TEXT_X, _y);
    _y += boxLineH;
  }

  _y += BOX_GAP;

  // "Note:" bold, rest normal — matches Figma bold+normal inline style
  setFont(10.5, "bold", C.SUBTITLE);
  const notePrefix = "Note: ";
  const notePrefixW = _doc.getTextWidth(notePrefix);
  _doc.text(notePrefix, BOX_TEXT_X, _y);
  setFont(10.5, "normal", C.SUBTITLE);
  const noteBody = para2Lines[0].replace(/^Note: /, "");
  _doc.text(noteBody, BOX_TEXT_X + notePrefixW, _y);
  for (let i = 1; i < para2Lines.length; i++) {
    _y += boxLineH;
    _doc.text(para2Lines[i], BOX_TEXT_X, _y);
  }

  _y = boxStartY + boxH + 12.7;  // bottom of box + gap to first condition
}

// ─── Subconditions ─────────────────────────────────────────────────────────────

function renderSubconditions(
  subconditions: SubconditionModel[],
  baseX: number,
  level: number
) {
  const identW  = level === 0 ? 12 : 7;  // level-1 letter col: ~3.7mm + 3.2mm gap
  const textX   = baseX + identW;
  const textW   = CW - (baseX - ML) - identW;
  // Figma: 16px/400/#101828, line-height 24px = 6.35mm
  const lineH   = 6.35;                    // 24px exact line-height
  const itemGap = level === 0 ? 6.4 : 2.1; // 24px between numbered, 8px between lettered

  const sorted = [...subconditions].sort((a, b) => a.sort_order - b.sort_order);

  for (const sub of sorted) {
    setFont(12, "normal", C.CONTENT);
    const lines = _doc.splitTextToSize(sub.subcondition_text || "", textW) as string[];
    const neededH = lines.length * lineH + itemGap;

    ensureSpace(neededH + 1);

    // Identifier (bold, same color)
    setFont(12, "bold", C.CONTENT);
    _doc.text(sub.subcondition_identifier || "", baseX, _y);

    // Text (first line shares y with identifier)
    setFont(12, "normal", C.CONTENT);
    for (let i = 0; i < lines.length; i++) {
      _doc.text(lines[i], textX, _y);
      _y += lineH;
    }
    _y += itemGap;      // 24px between numbered items, 8px between lettered

    if (sub.subconditions && sub.subconditions.length > 0) {
      renderSubconditions(sub.subconditions, baseX + 8.5, level + 1); // 32px indent
    }
  }
}

// ─── Single condition block ─────────────────────────────────────────────────────

function renderCondition(condition: ConditionModel) {
  const isApproved  = condition.is_approved === true;
  const statusLabel = isApproved ? "Approved" : "Awaiting Approval";
  const hasAmendment = !!(condition.amendment_names?.trim());
  const amendLabel  = hasAmendment ? `Amended Version: ${condition.amendment_names}` : "";

  // Estimate minimum space needed to avoid orphaned heading
  ensureSpace(32);

  // ── Condition heading ─────────────────────────────────────────────────────────
  // Figma: 24px/500/line-height 32px → 18pt normal, lineH = 8.47mm
  const heading = `${condition.condition_number}. ${condition.condition_name}`;
  const headingPt    = 18;
  const headingLineH = 8.47; // 32px exact line-height from Figma

  setFont(headingPt, "normal", C.DARK);
  const headingLines = _doc.splitTextToSize(heading, CW) as string[];

  ensureSpace(headingLines.length * headingLineH + CHIP_H + 8);

  for (let i = 0; i < headingLines.length; i++) {
    _doc.text(headingLines[i], ML, _y);
    _y += i < headingLines.length - 1 ? headingLineH : 3; // 3mm gap before chips
  }

  // ── Amended chip (if present) — below heading ────────────────────────────────
  if (hasAmendment) {
    drawAmendChip(amendLabel, ML, _y);
    _y += CHIP_H + 5;
  } else {
    _y += 3; // small gap before metadata card when no chip
  }

  // ── Metadata card ─────────────────────────────────────────────────────────────
  const CARD_PAD  = 4.5;   // 17px padding
  const CARD_H    = 14.29; // 54px minimum height
  const CARD_R    = 1.06;  // 4px border-radius
  const cardTextX = ML + CARD_PAD;
  const cardTextW = CW - CARD_PAD * 2;

  const sourceText = condition.source_document || "";
  const yearText   = String(condition.year_issued ?? "");

  // Measure widths BEFORE drawing (needed for dynamic height)
  setFont(10.5, "normal", C.GRAY);
  const yearLabelW = _doc.getTextWidth("Year Condition Issued:") + 1.5; // +1.5mm explicit space
  const srcLabelW  = _doc.getTextWidth("Source Document:") + 1.5; // +1.5mm explicit space
  const rowLineH   = 5.29; // 20px line-height
  const srcLines   = _doc.splitTextToSize(sourceText, cardTextW - srcLabelW) as string[];

  // Dynamic height: row1 (year) + row2 (source, may wrap) + padding
  const dynamicCardH = Math.max(
    CARD_H,
    CARD_PAD + rowLineH + 3 + srcLines.length * rowLineH + CARD_PAD
  );

  ensureSpace(dynamicCardH + 4);
  const cardY  = _y;
  const row1Y  = cardY + CARD_PAD + 4.0;          // Year row baseline
  const row2Y  = row1Y + rowLineH + 3;             // Source row baseline

  // Card background
  _doc.setFillColor(C.CARD_BG[0], C.CARD_BG[1], C.CARD_BG[2]);
  _doc.setDrawColor(C.CARD_BORDER[0], C.CARD_BORDER[1], C.CARD_BORDER[2]);
  _doc.setLineWidth(0.2);
  _doc.roundedRect(ML, cardY, CW, dynamicCardH, CARD_R, CARD_R, "FD");

  // Row 1 — Year Condition Issued (left) + status chip (right)
  setFont(10.5, "normal", C.GRAY);
  _doc.text("Year Condition Issued:", cardTextX, row1Y);
  setFont(10.5, "normal", C.CONTENT);
  _doc.text(yearText, cardTextX + yearLabelW, row1Y);

  // Status chip — vertically aligned with row 1 text
  const statusChipX = ML + CW - CARD_PAD - chipWidth(statusLabel);
  const statusChipY = row1Y - CHIP_TEXT_DY;
  drawStatusChip(statusLabel, isApproved, statusChipX, statusChipY);

  // Row 2 — Source Document (stacked below Year, full width)
  setFont(10.5, "normal", C.GRAY);
  _doc.text("Source Document:", cardTextX, row2Y);
  setFont(10.5, "normal", C.CONTENT);
  _doc.text(srcLines[0] ?? "", cardTextX + srcLabelW, row2Y);
  for (let i = 1; i < srcLines.length; i++) {
    _doc.text(srcLines[i], cardTextX, row2Y + i * rowLineH);
  }

  _y = cardY + dynamicCardH + 6.4; // 24px gap metadata → content

  // ── Condition text (if present before subconditions) ──────────────────────────
  if (condition.condition_text?.trim()) {
    setFont(12, "normal", C.DARK);
    const txtLines = _doc.splitTextToSize(condition.condition_text, CW) as string[];
    for (const line of txtLines) {
      ensureSpace(lh(12, 1.5) + 1);
      _doc.text(line, ML, _y);
      _y += lh(12, 1.5);
    }
    _y += 6.4;          // 24px gap before subconditions
  }

  // ── Subconditions ─────────────────────────────────────────────────────────────
  if (condition.subconditions && condition.subconditions.length > 0) {
    renderSubconditions(condition.subconditions, ML, 0);
  }

  _y += 12.7;           // ~50px space before separator

  // ── Bottom separator ──────────────────────────────────────────────────────────
  drawHRule(ML, _y, PW - MR, C.SEPARATOR, 0.5);
  _y += 12.7;           // 48px gap between condition blocks
}

// ─── Image loader ──────────────────────────────────────────────────────────────

async function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

// ─── Main export function ──────────────────────────────────────────────────────

export async function generateConsolidatedConditionsPDF(
  conditions: ConditionModel[],
  projectName: string,
  eaoLogoUrl?: string
): Promise<void> {
  _doc = new jsPDF("portrait", "mm", "a4");
  _y   = MT;

  let eaoLogoData: string | undefined;

  if (eaoLogoUrl) { try { eaoLogoData = await loadImageAsDataUrl(eaoLogoUrl); } catch { /* ignore */ } }

  // Header (logos, title, stats, disclaimer)
  addHeader(projectName, conditions, eaoLogoData);

  // Conditions — continuous flow
  for (const condition of conditions) {
    renderCondition(condition);
  }

  // Disclaimer on every page (last page drawn here; others drawn in newPage())
  drawDisclaimer();

  const safeName = projectName.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
  _doc.save(`Consolidated_Conditions_${safeName}.pdf`);
}
