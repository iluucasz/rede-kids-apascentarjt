export type ReportExportRow = {
  name: string;
  classes: string;
  present: number;
  absent: number;
  justified: number;
  total: number;
  frequency: number;
};

export type ReportExportInput = {
  rows: ReportExportRow[];
  summary: string;
  generatedAt: Date;
};

const COLUMN_HEADERS = [
  "Criança",
  "Turma(s)",
  "Presenças",
  "Faltas",
  "Justificadas",
  "Total",
  "Frequência (%)",
];

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function fileTimestamp(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function escapeCsv(value: string) {
  const needsQuotes = /[";\n]/.test(value);
  const escaped = value.replace(/"/g, '""');

  return needsQuotes ? `"${escaped}"` : escaped;
}

export function downloadReportCsv({ rows, summary, generatedAt }: ReportExportInput) {
  const lines: string[] = [];

  lines.push(escapeCsv(`Relatório de frequência — ${summary}`));
  lines.push("");
  lines.push(COLUMN_HEADERS.map(escapeCsv).join(";"));

  for (const row of rows) {
    lines.push(
      [
        row.name,
        row.classes,
        String(row.present),
        String(row.absent),
        String(row.justified),
        String(row.total),
        String(row.frequency),
      ]
        .map(escapeCsv)
        .join(";"),
    );
  }

  // BOM keeps acentuação correct when opened in Excel.
  const blob = new Blob([`﻿${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });

  triggerDownload(blob, `relatorio-frequencia-${fileTimestamp(generatedAt)}.csv`);
}

export async function downloadReportPdf({
  rows,
  summary,
  generatedAt,
}: ReportExportInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const pageBottom = pageHeight - margin;
  const lineHeight = 18;

  const columns = [
    { label: "Criança", x: margin, width: 150, align: "left" as const },
    { label: "Turma(s)", x: margin + 150, width: 140, align: "left" as const },
    { label: "Pres.", x: margin + 300, width: 40, align: "right" as const },
    { label: "Faltas", x: margin + 350, width: 40, align: "right" as const },
    { label: "Just.", x: margin + 400, width: 40, align: "right" as const },
    { label: "Freq.", x: margin + 470, width: 45, align: "right" as const },
  ];

  doc.setDocumentProperties({
    title: "Relatório de frequência",
    subject: summary,
    author: "Rede Kids Jardim Tropical",
    creator: "Rede Kids Jardim Tropical",
  });

  let currentY = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de frequência", margin, currentY);
  currentY += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, currentY);
  currentY += summaryLines.length * 13 + 4;
  doc.text(
    `Gerado em ${generatedAt.toLocaleDateString("pt-BR")} · ${rows.length} criança(s)`,
    margin,
    currentY,
  );
  currentY += 16;
  doc.setTextColor(20, 20, 20);

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(240, 242, 238);
    doc.rect(margin, currentY - 12, pageWidth - margin * 2, 20, "F");

    for (const column of columns) {
      const anchorX = column.align === "right" ? column.x + column.width : column.x;
      doc.text(column.label, anchorX, currentY, { align: column.align });
    }

    currentY += lineHeight;
    doc.setFont("helvetica", "normal");
  }

  drawHeader();

  for (const row of rows) {
    if (currentY > pageBottom) {
      doc.addPage();
      currentY = margin;
      drawHeader();
    }

    const name = doc.splitTextToSize(row.name, columns[0].width - 4)[0] ?? row.name;
    const classes =
      doc.splitTextToSize(row.classes || "Sem turma", columns[1].width - 4)[0] ??
      row.classes;
    const values = [
      name,
      classes,
      String(row.present),
      String(row.absent),
      String(row.justified),
      `${row.frequency}%`,
    ];

    values.forEach((value, index) => {
      const column = columns[index];
      const anchorX = column.align === "right" ? column.x + column.width : column.x;
      doc.text(String(value), anchorX, currentY, { align: column.align });
    });

    currentY += lineHeight;
  }

  doc.save(`relatorio-frequencia-${fileTimestamp(generatedAt)}.pdf`);
}
