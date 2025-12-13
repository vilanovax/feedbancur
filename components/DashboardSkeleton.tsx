export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mt-2"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Announcements & Polls Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
