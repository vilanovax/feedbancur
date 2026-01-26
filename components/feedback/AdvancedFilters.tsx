"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { DebouncedInput } from "@/components/ui/debounced-input";

interface AdvancedFiltersProps {
  departments: any[];
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function AdvancedFilters({
  departments,
  selectedDepartment,
  onDepartmentChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = selectedDepartment || selectedStatus || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <DebouncedInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="جستجو در عنوان، توضیحات یا نام کاربر..."
        debounceMs={300}
        showSearchIcon={true}
        showClearButton={true}
        className="py-2.5"
      />

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter size={18} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            فیلترها
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              فعال
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X size={16} />
            پاک کردن فیلترها
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              بخش
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه بخش‌ها</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وضعیت
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING">در انتظار</option>
              <option value="REVIEWED">بررسی شده</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="DEFERRED">موکول شده</option>
              <option value="ARCHIVED">بایگانی</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
