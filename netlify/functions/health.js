/**
 * Health check + environment wiring probe.
 * Reachable at /api/health (via netlify.toml redirect) and
 * /.netlify/functions/health. Reports which integrations are configured
 * WITHOUT leaking any secret values.
 */
export default async function handler() {
  return Response.json({
    ok: true,
    service: 'safemeds',
    time: new Date().toISOString(),
    configured: {
      database: Boolean(process.env.NETLIFY_DATABASE_URL),
      auth: Boolean(process.env.STACK_SECRET_SERVER_KEY),
      ai: Boolean(process.env.ANTHROPIC_API_KEY)
    }
  });
}
