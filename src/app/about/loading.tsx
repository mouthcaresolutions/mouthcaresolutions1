export default function AboutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mx-auto max-w-lg" />
      </div>
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <div className="space-y-4">
          <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-100 rounded animate-pulse ${i % 2 === 0 ? 'w-full' : 'w-5/6'}`} />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      <div className="h-px bg-gray-100 my-12" />
      <div className="text-center mb-8">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center p-6 space-y-3">
            <div className="h-10 w-10 bg-teal-100 rounded-full animate-pulse mx-auto" />
            <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}