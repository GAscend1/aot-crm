export async function GET() {
  return Response.json(
    { error: "Zoom integration is not enabled. Contact your administrator." },
    { status: 503 },
  );
}

export async function POST() {
  return Response.json(
    { error: "Zoom integration is not enabled. Contact your administrator." },
    { status: 503 },
  );
}

export async function DELETE() {
  return Response.json(
    { error: "Zoom integration is not enabled. Contact your administrator." },
    { status: 503 },
  );
}
