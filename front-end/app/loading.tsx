export default function Loading() {
  return (
    <div className="mx-auto max-w-[1460px] animate-pulse px-4 pt-4 pb-16 sm:px-6">
      {/* Banner Skeleton */}
      <div className="h-[360px] rounded-[28px] bg-slate-200/80 sm:h-[400px]" />

      {/* Filter Bar Skeleton */}
      <div className="mt-10 rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-xs sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-7 w-16 rounded-full bg-slate-200/70" />
            ))}
          </div>
          <div className="h-7 w-28 rounded-lg bg-slate-200/70" />
        </div>
      </div>

      {/* Grid of Listing Card Skeletons */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-xs"
          >
            <div className="h-48 w-full bg-slate-200/80" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded-md bg-slate-200/80" />
              <div className="h-3 w-1/2 rounded-md bg-slate-200/60" />
              <div className="mt-4 flex items-center justify-between pt-2">
                <div className="h-5 w-20 rounded-md bg-slate-200/80" />
                <div className="h-7 w-20 rounded-xl bg-slate-200/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
