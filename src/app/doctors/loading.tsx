export default function DoctorsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mx-auto max-w-lg" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="h-56 bg-gray-200 animate-pulse" />
            <div className="p-5 space-y-3 text-center">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mx-auto" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
              <div className="h-3 w-full bg-gray-50 rounded animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}