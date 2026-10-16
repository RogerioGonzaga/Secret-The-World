export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Carregando destinos">
      <div className="skeleton h-12 w-full max-w-xl" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
