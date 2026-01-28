"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// تبدیل Date به DateObject شمسی
function toJalali(date: Date): DateObject {
  return new DateObject({ date, calendar: persian, locale: persian_fa });
}

// تبدیل DateObject به Date
function toGregorian(dateObj: DateObject): Date {
  return dateObj.toDate();
}

// محاسبه اول ماه شمسی جاری
function startOfPersianMonth(): Date {
  const now = new DateObject({ calendar: persian, locale: persian_fa });
  const monthNum = now.month.number;
  return new DateObject({ year: now.year, month: monthNum, day: 1, calendar: persian }).toDate();
}

// محاسبه آخر ماه شمسی جاری
function endOfPersianMonth(): Date {
  const now = new DateObject({ calendar: persian, locale: persian_fa });
  const monthNum = now.month.number;
  const lastDay = now.month.length;
  return new DateObject({ year: now.year, month: monthNum, day: lastDay, calendar: persian }).toDate();
}

// محاسبه اول سال شمسی جاری
function startOfPersianYear(): Date {
  const now = new DateObject({ calendar: persian, locale: persian_fa });
  return new DateObject({ year: now.year, month: 1, day: 1, calendar: persian }).toDate();
}

// محاسبه آخر سال شمسی جاری
function endOfPersianYear(): Date {
  const now = new DateObject({ calendar: persian, locale: persian_fa });
  return new DateObject({ year: now.year, month: 12, day: 29, calendar: persian }).toDate();
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
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
      from: startOfPersianMonth(),
      to: endOfPersianMonth(),
    }),
  },
  {
    label: "سال جاری",
    getValue: () => ({
      from: startOfPersianYear(),
      to: endOfPersianYear(),
    }),
  },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };

    if (isOpen || showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, showCalendar]);

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

  const handleDateChange = (dates: DateObject[]) => {
    if (dates && dates.length === 2) {
      onChange({
        from: toGregorian(dates[0]),
        to: toGregorian(dates[1]),
      });
      setShowCalendar(false);
      setIsOpen(false);
    }
  };

  const formatDateRange = (range: DateRange) => {
    const fromJalali = toJalali(range.from);
    const toJalaliDate = toJalali(range.to);

    const fromStr = fromJalali.format("YYYY/MM/DD");
    const toStr = toJalaliDate.format("YYYY/MM/DD");

    if (fromStr === toStr) {
      return fromStr;
    }

    return `${fromStr} - ${toStr}`;
  };

  const getActivePreset = () => {
    return PRESET_RANGES.find(preset => {
      const presetRange = preset.getValue();
      const fromMatch = Math.abs(presetRange.from.getTime() - value.from.getTime()) < 1000;
      const toMatch = Math.abs(presetRange.to.getTime() - value.to.getTime()) < 1000;
      return fromMatch && toMatch;
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
              const fromMatch = Math.abs(presetRange.from.getTime() - value.from.getTime()) < 1000;
              const toMatch = Math.abs(presetRange.to.getTime() - value.to.getTime()) < 1000;
              const isActive = fromMatch && toMatch;

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

            <button
              onClick={() => {
                setShowCalendar(true);
                setIsOpen(false);
              }}
              className="w-full text-right px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 mt-2 border-t border-gray-200 dark:border-gray-700 pt-3"
            >
              انتخاب دستی...
            </button>
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

      {showCalendar && (
        <div className="absolute left-0 mt-2 z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
            <DatePicker
              range
              calendar={persian}
              locale={persian_fa}
              value={[toJalali(value.from), toJalali(value.to)]}
              onChange={handleDateChange}
              className="blue"
              containerClassName="w-full"
              calendarPosition="bottom-right"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "14px",
              }}
              inputClass="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
