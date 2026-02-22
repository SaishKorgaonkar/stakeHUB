export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 border-3 border-black brutal-shadow p-6 space-y-4">
        <div className="h-6 bg-gray-300 border-2 border-black" />
        <div className="h-4 bg-gray-300 border-2 border-black w-3/4" />
        <div className="h-4 bg-gray-300 border-2 border-black w-1/2" />
      </div>
    </div>
  );
}

export function ArenaCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white border-3 border-black brutal-shadow">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-gray-200 border-2 border-black rounded-full" />
            <div className="h-6 w-20 bg-gray-200 border-2 border-black" />
          </div>
          
          {/* Title */}
          <div className="h-8 bg-gray-200 border-2 border-black" />
          
          {/* Pool */}
          <div className="h-12 bg-gray-200 border-2 border-black" />
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-200 border-2 border-black" />
            <div className="h-4 w-24 bg-gray-200 border-2 border-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
