import { getQuoteConfig, resetQuoteConfig, saveQuoteConfig } from "@/backend/admin/quoteConfig";

export async function GET() {
    const config = await getQuoteConfig();
    return Response.json(config);
}

export async function PUT(request: Request) {
    const config = await request.json();
    const result = await saveQuoteConfig(config);
    return Response.json(result, { status: result.success ? 200 : 500 });
}

export async function DELETE() {
    const result = await resetQuoteConfig();
    return Response.json(result, { status: result.success ? 200 : 500 });
}
