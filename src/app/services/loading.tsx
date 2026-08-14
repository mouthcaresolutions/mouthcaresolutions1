export default function ServicesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse mx-auto mb-4" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mx-auto max-w-xl" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg animate-pulse" />
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-28 bg-teal-100 rounded-lg animate-pulse mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}