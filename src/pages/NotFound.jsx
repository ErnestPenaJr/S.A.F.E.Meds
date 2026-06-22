import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="font-heading text-5xl font-extrabold text-primary">404</div>
      <p className="text-sm text-muted-foreground">That page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Back to Home
      </Link>
    </section>
  );
}
