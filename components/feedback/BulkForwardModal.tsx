"use client";

import { useState } from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";

interface Manager {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  departments?: {
    name: string;
  };
}

interface BulkForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (managerId: string) => void;
  managers: Manager[];
  selectedCount: number;
  loading?: boolean;
}

export default function BulkForwardModal({
  isOpen,
  onClose,
  onConfirm,
  managers,
  selectedCount,
  loading = false,
}: BulkForwardModalProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedManagerId) return;
    onConfirm(selectedManagerId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <UserPlus className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                ارجاع دسته‌جمعی
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCount} فیدبک انتخاب شده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Warning */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              فیدبک‌های انتخاب شده به مدیر مورد نظر ارجاع داده می‌شوند و وضعیت آنها به "در انتظار" تغییر می‌کند.
            </p>
          </div>

          {/* Manager Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              انتخاب مدیر
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {managers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserPlus size={40} className="mx-auto mb-2 opacity-50" />
                  <p>هیچ مدیری یافت نشد</p>
                </div>
              ) : (
                managers.map((manager) => (
                  <label
                    key={manager.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedManagerId === manager.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="manager"
                      value={manager.id}
                      checked={selectedManagerId === manager.id}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      {manager.avatar ? (
                        <img
                          src={manager.avatar}
                          alt={manager.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {manager.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {manager.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {manager.email}
                        </p>
                        {manager.departments && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            {manager.departments.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedManagerId || loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ارجاع...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>ارجاع ({selectedCount} فیدبک)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
