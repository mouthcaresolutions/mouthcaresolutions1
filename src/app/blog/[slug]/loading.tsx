export default function BlogDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
      {/* Category + date */}
      <div className="flex gap-3 mb-4">
        <div className="h-6 w-28 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
      </div>
      {/* Title */}
      <div className="space-y-3 mb-6">
        <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-4/5 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Meta */}
      <div className="flex gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-11/12' : 'w-4/5'}`} />
        ))}
      </div>
    </div>
  );
}