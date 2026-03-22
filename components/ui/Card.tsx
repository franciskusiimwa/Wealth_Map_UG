/**
 * Generic card container used across product surfaces.
 * @param props Children to render inside card.
 * @returns Styled card wrapper.
 */
export function Card({ children }: Readonly<{ children: React.ReactNode }>) {
  return <article className="rounded-2xl border border-paper-3 bg-white p-4">{children}</article>
}
