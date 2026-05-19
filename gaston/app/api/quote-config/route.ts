import { getQuoteConfig } from "@/backend/admin/quoteConfig";

export async function GET() {
    const config = await getQuoteConfig();
    return Response.json(config);
}
