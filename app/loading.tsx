/**
 * Global loading skeleton for route transitions.
 * @returns Skeleton UI while server components stream.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 md:p-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-paper-2" />
      <div className="mt-4 h-28 animate-pulse rounded-2xl bg-paper-2" />
      <div className="mt-4 h-28 animate-pulse rounded-2xl bg-paper-2" />
    </main>
  )
}
