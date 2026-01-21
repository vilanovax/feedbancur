"use client";

interface ProjectStatusFilterProps {
  activeFilter: "all" | "active" | "inactive";
  onFilterChange: (filter: "all" | "active" | "inactive") => void;
  counts: {
    all: number;
    active: number;
    inactive: number;
  };
}

export default function ProjectStatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: ProjectStatusFilterProps) {
  const filters = [
    { key: "all" as const, label: "همه", count: counts.all },
    { key: "active" as const, label: "فعال", count: counts.active },
    { key: "inactive" as const, label: "غیرفعال", count: counts.inactive },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter.key
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {filter.label}
          <span
            className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
              activeFilter === filter.key
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
