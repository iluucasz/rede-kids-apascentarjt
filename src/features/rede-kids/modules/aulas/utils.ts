import type { AppData, AttendanceStatus, Lesson, Member } from "@/lib/types";
import type { LessonReportGroups } from "./types";

type AttendanceBucket = AttendanceStatus | "pending";

type DownloadLessonPdfInput = {
  lesson: Lesson;
  report: Pick<LessonReportGroups, AttendanceBucket>;
};

type PdfRgb = [number, number, number];

type AttendanceRow = {
  name: string;
  status: AttendanceBucket;
};

type AttendanceStyle = {
  singularLabel: string;
  pluralLabel: string;
  strong: PdfRgb;
  soft: PdfRgb;
  text: PdfRgb;
};

type PdfTextMeasurer = {
  getTextWidth: (text: string) => number;
};

type LabeledValue = {
  label: string;
  value: string;
};

type SummaryAttendanceStatus = Exclude<AttendanceBucket, "pending">;

const CHURCH_NAME = "Ministério Apascentar Jardim Tropical";
const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const PDF_COLORS = {
  brand: [22, 101, 52] as PdfRgb,
  brandSoft: [240, 249, 243] as PdfRgb,
  text: [24, 24, 27] as PdfRgb,
  muted: [113, 113, 122] as PdfRgb,
  border: [228, 228, 231] as PdfRgb,
  rowAlt: [244, 244, 245] as PdfRgb,
  white: [255, 255, 255] as PdfRgb,
};

const SUMMARY_ATTENDANCE_ORDER: SummaryAttendanceStatus[] = [
  "present",
  "absent",
  "justified",
];

const ATTENDANCE_STYLES: Record<AttendanceBucket, AttendanceStyle> = {
  present: {
    singularLabel: "Presente",
    pluralLabel: "Presentes",
    strong: [34, 197, 94],
    soft: [240, 253, 244],
    text: [21, 128, 61],
  },
  absent: {
    singularLabel: "Falta",
    pluralLabel: "Faltas",
    strong: [239, 68, 68],
    soft: [254, 242, 242],
    text: [185, 28, 28],
  },
  justified: {
    singularLabel: "Justificada",
    pluralLabel: "Justificadas",
    strong: [245, 158, 11],
    soft: [255, 247, 237],
    text: [180, 83, 9],
  },
  pending: {
    singularLabel: "Pendente",
    pluralLabel: "Pendentes",
    strong: [148, 163, 184],
    soft: [241, 245, 249],
    text: [71, 85, 105],
  },
};

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function buildLessonReport(
  children: Member[],
  attendance: AppData["attendance"],
): LessonReportGroups {
  const attendanceByChild = new Map(
    attendance.map((item) => [item.childId, item.status]),
  );

  const grouped: LessonReportGroups = {
    present: [],
    absent: [],
    justified: [],
    pending: [],
  };

  for (const child of children) {
    const status = attendanceByChild.get(child.id) as AttendanceStatus | undefined;

    if (!status) {
      grouped.pending.push(child);
    } else {
      grouped[status].push(child);
    }
  }

  return grouped;
}

export async function downloadLessonPdf({
  lesson,
  report,
}: DownloadLessonPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = pageHeight - margin;
  const sectionGap = 12;
  const attendanceRows = buildAttendanceRows(report);
  const lessonStatusLabel = lesson.status === "closed" ? "Finalizada" : "Aberta";
  let currentY = margin;

  doc.setDocumentProperties({
    title: `Aula ${lesson.id}`,
    subject: lesson.theme || "Resumo da aula",
    author: "Rede Kids Jardim Tropical",
    creator: "Rede Kids Jardim Tropical",
  });

  function setFillColor(color: PdfRgb) {
    doc.setFillColor(color[0], color[1], color[2]);
  }

  function setTextColor(color: PdfRgb) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function setDrawColor(color: PdfRgb) {
    doc.setDrawColor(color[0], color[1], color[2]);
  }

  function addPage() {
    doc.addPage();
    currentY = margin;
    drawCompactHeader();
  }

  function ensureSpace(height: number) {
    if (currentY + height > pageBottom) {
      addPage();
    }
  }

  function drawCompactHeader() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(PDF_COLORS.brand);
    doc.text(CHURCH_NAME, margin, currentY + 10);

    setDrawColor(PDF_COLORS.border);
    doc.setLineWidth(1);
    doc.line(margin, currentY + 18, pageWidth - margin, currentY + 18);
    currentY += 30;
  }

  function drawHeroHeader() {
    const title = lesson.theme.trim() || "Aula";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(PDF_COLORS.brand);
    doc.text(CHURCH_NAME, margin, currentY + 10);
    currentY += 30;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    setTextColor(PDF_COLORS.text);
    const titleLines = doc.splitTextToSize(title, contentWidth) as string[];
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 23;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setTextColor(PDF_COLORS.muted);
    doc.text(formatLessonPdfDate(lesson.scheduledAt), margin, currentY);
    currentY += 14;

    doc.setFontSize(9);
    doc.text(`${lesson.className || "Sem turma"} · ${lesson.id}`, margin, currentY);
    currentY += 14;

    setDrawColor(PDF_COLORS.brand);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 14;
  }

  function measureInfoStripHeight(items: Array<{ label: string; value: string }>, width: number) {
    const columnWidth = width / items.length;
    let maxLines = 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);

    for (const item of items) {
      const lines = doc.splitTextToSize(normalizeLongText(item.value), columnWidth - 20) as string[];
      maxLines = Math.max(maxLines, lines.length);
    }

    return Math.max(46, 22 + maxLines * 11 + 8);
  }

  function drawInfoColumn(
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
  ) {
    const valueLines = doc.splitTextToSize(normalizeLongText(value), width - 20) as string[];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(PDF_COLORS.muted);
    doc.text(label.toUpperCase(), x + 10, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTextColor(PDF_COLORS.text);
    doc.text(valueLines, x + 10, y + 28);
  }

  function drawLabeledStrip(items: LabeledValue[]) {
    const stripHeight = measureInfoStripHeight(items, contentWidth);
    const columnWidth = contentWidth / items.length;

    ensureSpace(stripHeight + 8);

    setFillColor(PDF_COLORS.white);
    setDrawColor(PDF_COLORS.border);
    doc.roundedRect(margin, currentY, contentWidth, stripHeight, 12, 12, "FD");

    items.forEach((item, index) => {
      const x = margin + index * columnWidth;

      if (index > 0) {
        doc.setLineWidth(1);
        doc.line(x, currentY + 8, x, currentY + stripHeight - 8);
      }

      drawInfoColumn(x, currentY, columnWidth, item.label, item.value);
    });

    currentY += stripHeight + 10;
  }

  function renderSectionBanner(title: string, subtitle?: string) {
    const height = subtitle ? 36 : 28;

    setFillColor(PDF_COLORS.brandSoft);
    doc.roundedRect(margin, currentY, contentWidth, height, 12, 12, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    setTextColor(PDF_COLORS.brand);
    doc.text(title, margin + 12, currentY + 17);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTextColor(PDF_COLORS.muted);
      doc.text(subtitle, margin + 12, currentY + 28);
    }

    currentY += height + 8;
  }

  function drawLessonInfoStrip() {
    drawLabeledStrip([
      { label: "Turma", value: lesson.className || "Sem turma" },
      { label: "Ministro", value: lesson.ministerName || "Sem ministro" },
      { label: "Apoio", value: lesson.supportName || "Sem apoio" },
      { label: "Status", value: lessonStatusLabel },
    ]);
  }

  function drawLessonContentStrip() {
    drawLabeledStrip([
      { label: "Texto bíblico", value: formatScriptureText(lesson.scriptureText) },
    ]);
  }

  function drawAttendanceTotalsCards() {
    const cardHeight = 34;
    const cardGap = 8;
    const cardWidth = (contentWidth - cardGap * (SUMMARY_ATTENDANCE_ORDER.length - 1)) /
      SUMMARY_ATTENDANCE_ORDER.length;

    ensureSpace(cardHeight + 8);

    SUMMARY_ATTENDANCE_ORDER.forEach((status, index) => {
      const style = ATTENDANCE_STYLES[status];
      const count = String(report[status].length);
      const x = margin + index * (cardWidth + cardGap);
      const centerY = currentY + cardHeight / 2;

      setFillColor(style.soft);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 12, 12, "F");

      setFillColor(style.strong);
      doc.circle(x + 14, centerY, 2.8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setTextColor(style.text);
      doc.text(style.pluralLabel, x + 23, centerY + 3);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      setTextColor(PDF_COLORS.text);
      const countWidth = doc.getTextWidth(count);
      doc.text(count, x + cardWidth - countWidth - 12, centerY + 3);
    });

    currentY += cardHeight + sectionGap;
  }

  function drawTextSection(title: string, value: string) {
    const textLines = doc.splitTextToSize(normalizeLongText(value), contentWidth - 24) as string[];
    const boxHeight = Math.max(46, 20 + textLines.length * 13 + 10);
    const requiredHeight = 28 + 8 + boxHeight + sectionGap;

    ensureSpace(requiredHeight);
    renderSectionBanner(title);

    setFillColor(PDF_COLORS.white);
    setDrawColor(PDF_COLORS.border);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 12, 12, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(PDF_COLORS.text);
    doc.text(textLines, margin + 12, currentY + 20);

    currentY += boxHeight + sectionGap;
  }

  function drawAttendanceTableHeader() {
    const headerHeight = 26;
    const nameColumnWidth = contentWidth - 124;

    setFillColor(PDF_COLORS.rowAlt);
    doc.roundedRect(margin, currentY, contentWidth, headerHeight, 8, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(PDF_COLORS.muted);
    doc.text("NOME", margin + 12, currentY + 17);
    doc.text("STATUS", margin + nameColumnWidth + 12, currentY + 17);

    currentY += headerHeight + 6;
  }

  function drawRowStatusBadge(status: AttendanceBucket, x: number, y: number, width: number) {
    const style = ATTENDANCE_STYLES[status];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);

    const badgeWidth = Math.min(width - 12, Math.max(74, doc.getTextWidth(style.singularLabel) + 22));
    const badgeX = x + (width - badgeWidth) / 2;

    setFillColor(style.strong);
    doc.roundedRect(badgeX, y, badgeWidth, 18, 9, 9, "F");
    setTextColor(PDF_COLORS.white);
    doc.text(style.singularLabel, badgeX + badgeWidth / 2, y + 12, { align: "center" });
  }

  function drawAttendanceTable() {
    const bannerHeight = 28;
    const rowHeight = 28;
    const nameColumnWidth = contentWidth - 124;
    const statusColumnX = margin + nameColumnWidth;

    ensureSpace(bannerHeight + 8 + 32);
    renderSectionBanner("Lista de presença");

    if (!attendanceRows.length) {
      setFillColor(PDF_COLORS.white);
      setDrawColor(PDF_COLORS.border);
      doc.roundedRect(margin, currentY, contentWidth, 52, 12, 12, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      setTextColor(PDF_COLORS.muted);
      doc.text("Nenhum aluno encontrado para esta aula.", margin + 12, currentY + 30);
      currentY += 52;
      currentY += sectionGap;
      return;
    }

    drawAttendanceTableHeader();

    attendanceRows.forEach((row, index) => {
      if (currentY + rowHeight > pageBottom) {
        addPage();
        ensureSpace(34 + 12 + 32);
        renderSectionBanner("Lista de presença (continuação)");
        drawAttendanceTableHeader();
      }

      if (index % 2 === 1) {
        setFillColor(PDF_COLORS.rowAlt);
        doc.rect(margin, currentY, contentWidth, rowHeight, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setTextColor(PDF_COLORS.text);
      doc.text(truncateText(doc, row.name, nameColumnWidth - 20), margin + 12, currentY + 18);

      drawRowStatusBadge(row.status, statusColumnX, currentY + 5, 124);
      currentY += rowHeight;
    });

    currentY += sectionGap;
  }

  drawHeroHeader();
  drawLessonInfoStrip();
  drawLessonContentStrip();
  drawAttendanceTotalsCards();
  drawAttendanceTable();
  drawTextSection("Observações", lesson.notes || "Sem observações registradas.");

  const blob = doc.output("blob");
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = buildPdfFileName(lesson);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

function normalizeLongText(value: string) {
  return value.trim() || "Não informado";
}

function formatScriptureText(value: string) {
  const references = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return references.length ? references.join(", ") : "Sem texto bíblico";
}

function formatLessonPdfDate(value: string) {
  if (!value) return "Sem data";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const descriptiveDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return `${descriptiveDate} - ${WEEKDAY_NAMES[date.getDay()] || ""} - ${getTimePeriod(date)}`;
}

function buildAttendanceRows(report: Pick<LessonReportGroups, AttendanceBucket>) {
  return SUMMARY_ATTENDANCE_ORDER.flatMap((status) =>
    getSortedMemberNames(report[status]).map((name) => ({ name, status } satisfies AttendanceRow)),
  );
}

function getSortedMemberNames(members: Member[]) {
  return members
    .map((member) => member.fullName.trim())
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second, "pt-BR"));
}

function truncateText(measurer: PdfTextMeasurer, value: string, maxWidth: number) {
  const normalized = normalizeLongText(value);

  if (measurer.getTextWidth(normalized) <= maxWidth) {
    return normalized;
  }

  let truncated = normalized;

  while (truncated.length > 1 && measurer.getTextWidth(`${truncated}...`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated.trimEnd()}...`;
}

function getTimePeriod(date: Date) {
  const hours = date.getHours();

  if (hours >= 6 && hours < 12) return "Manhã";
  if (hours >= 12 && hours < 18) return "Tarde";

  return "Noite";
}

function buildPdfFileName(lesson: Lesson) {
  const normalizedTheme = lesson.theme
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalizedTheme ? `${lesson.id}-${normalizedTheme}.pdf` : `${lesson.id}.pdf`;
}
