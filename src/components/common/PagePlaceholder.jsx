/* Temporary stand-in for pages not yet built. Removed as each phase lands. */
export default function PagePlaceholder({ title, note }) {
  return (
    <section className="flex flex-col gap-3 py-8 text-center">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">
        {note || 'Coming soon.'}
      </p>
    </section>
  );
}
