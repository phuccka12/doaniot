/**
 * PDF Export helper using jsPDF + autotable
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export interface HealthRecord {
  time: string;
  hr: number;
  spo2?: number;
}

export interface LogRecord {
  timestamp: any;
  event: string;
  location?: string;
  status?: string;
}

export const exportWeeklyReport = (
  userName: string,
  userId: string,
  hrHistory: HealthRecord[],
  logs: LogRecord[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BÁNG CÁO SỨC KHỎE HÀNG TUẦN", pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 15;

  // Patient info
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Bệnh nhân: ${userName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`ID: ${userId}`, 20, yPosition);
  yPosition += 7;
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  doc.text(
    `Kỳ báo cáo: ${format(weekStart, "dd/MM/yyyy")} - ${format(
      weekEnd,
      "dd/MM/yyyy"
    )}`,
    20,
    yPosition
  );

  yPosition += 15;

  // Heart Rate Statistics
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("📊 Thống kê Nhịp tim", 20, yPosition);
  yPosition += 10;

  if (hrHistory && hrHistory.length > 0) {
    const avgHr =
      hrHistory.reduce((sum, h) => sum + h.hr, 0) / hrHistory.length;
    const maxHr = Math.max(...hrHistory.map((h) => h.hr));
    const minHr = Math.min(...hrHistory.map((h) => h.hr));

    autoTable(doc, {
      startY: yPosition,
      head: [["Chỉ số", "Giá trị"]],
      body: [
        ["Nhịp tim trung bình", `${avgHr.toFixed(1)} BPM`],
        ["Nhịp tim tối đa", `${maxHr} BPM`],
        ["Nhịp tim tối thiểu", `${minHr} BPM`],
      ],
      theme: "grid",
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Fall Events
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("🚨 Sự cố Té ngã", 20, yPosition);
  yPosition += 10;

  const fallLogs = logs.filter(
    (l) =>
      l.event && l.event.toLowerCase().includes("té ngã") &&
      l.status === "Chưa xử lý"
  );

  if (fallLogs.length > 0) {
    const fallData = fallLogs.map((log) => [
      format(
        new Date((log.timestamp?.seconds || 0) * 1000),
        "dd/MM HH:mm:ss"
      ),
      log.location || "N/A",
      log.status || "Mới",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Thời gian", "Vị trí", "Trạng thái"]],
      body: fallData,
      theme: "grid",
      headStyles: { fillColor: [229, 62, 62], textColor: [255, 255, 255] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Không có sự cố té ngã trong tuần này ✓", 20, yPosition);
    yPosition += 10;
  }

  // Footer
  yPosition = pageHeight - 20;
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(9);
  doc.text(
    `Báo cáo được tạo ngày ${format(now, "dd/MM/yyyy HH:mm:ss")}`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  // Save
  const filename = `Bao-cao-suc-khoe-${userName}-${format(
    now,
    "dd-MM-yyyy"
  )}.pdf`;
  doc.save(filename);
};
