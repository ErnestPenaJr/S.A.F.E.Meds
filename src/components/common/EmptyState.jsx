export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div>
        <div className="font-heading font-bold">{title}</div>
        {children && <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{children}</p>}
      </div>
      {action}
    </div>
  );
}
