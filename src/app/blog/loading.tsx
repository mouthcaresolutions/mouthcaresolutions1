export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse flex-1 max-w-lg" />
        <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
      {/* Featured post skeleton */}
      <div className="grid md:grid-cols-2 gap-0 bg-gray-50 rounded-2xl overflow-hidden mb-8">
        <div className="h-64 bg-gray-200 animate-pulse" />
        <div className="p-8 flex flex-col justify-center gap-4">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
      {/* Grid skeletons */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
            <div className="h-44 bg-gray-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="border-t border-gray-50 pt-3 flex justify-between">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}