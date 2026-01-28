"use client";

import { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatJalali, JalaliFormats } from "@/lib/jalali-utils";

interface ExportButtonProps {
  stats: any;
}

export default function ExportButton({ stats }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // ایجاد PDF جدید
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // تنظیم فونت (برای فارسی باید فونت مناسب اضافه شود)
      doc.setFont("helvetica");

      // عنوان
      doc.setFontSize(18);
      doc.text("Dashboard Statistics Report", 105, 20, { align: "center" });

      // تاریخ
      doc.setFontSize(10);
      doc.text(
        `Generated: ${formatJalali(new Date(), JalaliFormats.LONG)}`,
        105,
        30,
        { align: "center" }
      );

      // جدول آمار کلی
      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Feedbacks", stats?.totalFeedbacks ?? 0],
          ["Pending Feedbacks", stats?.pendingFeedbacks ?? 0],
          ["Completed Feedbacks", stats?.completedFeedbacks ?? 0],
          ["Deferred Feedbacks", stats?.deferredFeedbacks ?? 0],
          ["Archived Feedbacks", stats?.archivedFeedbacks ?? 0],
          ["Departments", stats?.departments ?? 0],
          ["Active Announcements", stats?.activeAnnouncements ?? 0],
          ["Active Polls", stats?.activePolls ?? 0],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      // جدول Trends
      if (stats?.trends) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [["Metric", "Trend", "Direction"]],
          body: [
            [
              "Total Feedbacks",
              `${stats.trends.totalFeedbacks?.value?.toFixed(1) ?? 0}%`,
              stats.trends.totalFeedbacks?.direction ?? "neutral",
            ],
            [
              "Pending Feedbacks",
              `${stats.trends.pendingFeedbacks?.value?.toFixed(1) ?? 0}%`,
              stats.trends.pendingFeedbacks?.direction ?? "neutral",
            ],
            [
              "Completed Feedbacks",
              `${stats.trends.completedFeedbacks?.value?.toFixed(1) ?? 0}%`,
              stats.trends.completedFeedbacks?.direction ?? "neutral",
            ],
            [
              "Deferred Feedbacks",
              `${stats.trends.deferredFeedbacks?.value?.toFixed(1) ?? 0}%`,
              stats.trends.deferredFeedbacks?.direction ?? "neutral",
            ],
          ],
          styles: { fontSize: 10 },
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      // ذخیره PDF
      doc.save(`dashboard-report-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("خطا در ایجاد فایل PDF");
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      // آماده‌سازی داده‌ها برای Excel
      const worksheetData = [
        ["Dashboard Statistics Report"],
        [`Generated: ${new Date().toLocaleString("fa-IR")}`],
        [],
        ["Metric", "Value"],
        ["Total Feedbacks", stats?.totalFeedbacks ?? 0],
        ["Pending Feedbacks", stats?.pendingFeedbacks ?? 0],
        ["Completed Feedbacks", stats?.completedFeedbacks ?? 0],
        ["Deferred Feedbacks", stats?.deferredFeedbacks ?? 0],
        ["Archived Feedbacks", stats?.archivedFeedbacks ?? 0],
        ["Departments", stats?.departments ?? 0],
        ["Active Announcements", stats?.activeAnnouncements ?? 0],
        ["Total Announcements", stats?.totalAnnouncements ?? 0],
        ["Active Polls", stats?.activePolls ?? 0],
        ["Total Polls", stats?.totalPolls ?? 0],
        [],
        ["Trends (Weekly Comparison)"],
        ["Metric", "Trend %", "Direction"],
      ];

      if (stats?.trends) {
        worksheetData.push(
          [
            "Total Feedbacks",
            stats.trends.totalFeedbacks?.value?.toFixed(1) ?? 0,
            stats.trends.totalFeedbacks?.direction ?? "neutral",
          ],
          [
            "Pending Feedbacks",
            stats.trends.pendingFeedbacks?.value?.toFixed(1) ?? 0,
            stats.trends.pendingFeedbacks?.direction ?? "neutral",
          ],
          [
            "Completed Feedbacks",
            stats.trends.completedFeedbacks?.value?.toFixed(1) ?? 0,
            stats.trends.completedFeedbacks?.direction ?? "neutral",
          ],
          [
            "Deferred Feedbacks",
            stats.trends.deferredFeedbacks?.value?.toFixed(1) ?? 0,
            stats.trends.deferredFeedbacks?.direction ?? "neutral",
          ]
        );
      }

      // ایجاد worksheet
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // تنظیم عرض ستون‌ها
      ws["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

      // ایجاد workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dashboard Stats");

      // ذخیره Excel
      XLSX.writeFile(wb, `dashboard-report-${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("خطا در ایجاد فایل Excel");
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={18} />
        <span className="text-sm font-medium">
          {exporting ? "در حال Export..." : "Export"}
        </span>
      </button>

      {showMenu && !exporting && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]">
          <button
            onClick={exportToPDF}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right"
          >
            <FileText size={18} className="text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Export به PDF
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                فرمت Portable Document
              </p>
            </div>
          </button>

          <button
            onClick={exportToExcel}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right border-t border-gray-100 dark:border-gray-700"
          >
            <Table size={18} className="text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Export به Excel
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                فرمت Microsoft Excel
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  );
}
