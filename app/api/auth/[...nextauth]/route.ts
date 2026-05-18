// Auth route removed — no server-side authentication in this version
export async function GET() {
  return new Response("Not used", { status: 404 });
}
