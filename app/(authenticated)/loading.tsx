export default function AuthenticatedLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <div className="p-4 space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 lg:mr-64">
        {/* Header Skeleton */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-gray-800 rounded-xl shadow animate-pulse"
                />
              ))}
            </div>
            <div className="h-96 bg-white dark:bg-gray-800 rounded-xl shadow animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
