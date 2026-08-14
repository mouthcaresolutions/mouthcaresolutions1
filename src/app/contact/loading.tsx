export default function ContactLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mx-auto max-w-md" />
      </div>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-6" />
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-28 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          <div className="h-11 bg-teal-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
