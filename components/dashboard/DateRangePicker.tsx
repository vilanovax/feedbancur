"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { fa } from "date-fns/locale";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export default function DateRangePicker({
  onDateRangeChange,
  initialStartDate = null,
  initialEndDate = null,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setDateRange({ startDate: start, endDate: end });

    // اگر هر دو تاریخ انتخاب شدند، فیلتر را اعمال کن
    if (start && end) {
      onDateRangeChange(start, end);
      setShowPicker(false);
    }
  };

  const clearDateRange = () => {
    setDateRange({ startDate: null, endDate: null });
    onDateRangeChange(null, null);
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ startDate: start, endDate: end });
    onDateRangeChange(start, end);
    setShowPicker(false);
  };

  const formatDateRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, "dd MMM yyyy", { locale: fa })} - ${format(dateRange.endDate, "dd MMM yyyy", { locale: fa })}`;
    }
    return "انتخاب بازه زمانی";
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDateRange()}
        </span>
        {dateRange.startDate && dateRange.endDate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDateRange();
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <X size={14} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          {/* Preset Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setPresetRange(0)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              امروز
            </button>
            <button
              onClick={() => setPresetRange(1)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              دیروز
            </button>
            <button
              onClick={() => setPresetRange(7)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              7 روز
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              30 روز
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date(end.getFullYear(), end.getMonth(), 1);
                setDateRange({ startDate: start, endDate: end });
                onDateRangeChange(start, end);
                setShowPicker(false);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ماه جاری
            </button>
            <button
              onClick={() => {
                const end = new Date();
                end.setMonth(end.getMonth() - 1);
                end.setDate(0); // آخرین روز ماه قبل
                const start = new Date(end.getFullYear(), end.getMonth(), 1);
                setDateRange({ startDate: start, endDate: end });
                onDateRangeChange(start, end);
                setShowPicker(false);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ماه گذشته
            </button>
          </div>

          {/* Date Picker */}
          <div className="datepicker-wrapper">
            <DatePicker
              selected={dateRange.startDate}
              onChange={handleDateChange}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              selectsRange
              inline
              monthsShown={2}
              maxDate={new Date()}
              dateFormat="yyyy/MM/dd"
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={() => setShowPicker(false)}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              بستن
            </button>
            <button
              onClick={clearDateRange}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              پاک کردن
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles for DatePicker */}
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
          background-color: transparent;
        }

        .react-datepicker__header {
          background-color: transparent;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .react-datepicker__header {
          border-bottom-color: #374151;
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: #111827;
        }

        .dark .react-datepicker__current-month,
        .dark .react-datepicker__day-name {
          color: #f3f4f6;
        }

        .react-datepicker__day {
          color: #374151;
        }

        .dark .react-datepicker__day {
          color: #d1d5db;
        }

        .react-datepicker__day:hover {
          background-color: #e5e7eb;
        }

        .dark .react-datepicker__day:hover {
          background-color: #374151;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--in-selecting-range {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #93c5fd;
          color: #1e3a8a;
        }

        .dark .react-datepicker__day--keyboard-selected {
          background-color: #1e40af;
          color: #dbeafe;
        }

        .react-datepicker__day--disabled {
          color: #9ca3af !important;
        }

        .react-datepicker__navigation {
          top: 8px;
        }
      `}</style>
    </div>
  );
}
