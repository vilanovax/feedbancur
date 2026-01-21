"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { faIR } from "date-fns/locale";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_RANGES = [
  {
    label: "امروز",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "7 روز اخیر",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "30 روز اخیر",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "ماه جاری",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "سال جاری",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const range = preset.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({
      from: subDays(new Date(), 29),
      to: new Date(),
    });
  };

  const formatDateRange = (range: DateRange) => {
    const fromStr = format(range.from, "yyyy/MM/dd", { locale: faIR });
    const toStr = format(range.to, "yyyy/MM/dd", { locale: faIR });

    if (fromStr === toStr) {
      return fromStr;
    }

    return `${fromStr} - ${toStr}`;
  };

  const getActivePreset = () => {
    return PRESET_RANGES.find(preset => {
      const presetRange = preset.getValue();
      return (
        format(presetRange.from, "yyyy-MM-dd") === format(value.from, "yyyy-MM-dd") &&
        format(presetRange.to, "yyyy-MM-dd") === format(value.to, "yyyy-MM-dd")
      );
    });
  };

  const activePreset = getActivePreset();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {activePreset ? activePreset.label : formatDateRange(value)}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              انتخاب بازه زمانی
            </span>
            <button
              onClick={handleClear}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              پیش‌فرض
            </button>
          </div>

          <div className="p-2">
            {PRESET_RANGES.map((preset, index) => {
              const presetRange = preset.getValue();
              const isActive =
                format(presetRange.from, "yyyy-MM-dd") === format(value.from, "yyyy-MM-dd") &&
                format(presetRange.to, "yyyy-MM-dd") === format(value.to, "yyyy-MM-dd");

              return (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              بازه انتخاب شده:
            </div>
            <div className="text-sm font-medium text-gray-800 dark:text-white">
              {formatDateRange(value)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
