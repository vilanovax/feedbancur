export default function MobileDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Welcome Card Skeleton */}
      <div className="bg-gray-300 dark:bg-gray-700 rounded-xl h-32"></div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
