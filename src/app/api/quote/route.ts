import { parseQuoteInput, type PublicQuoteResult } from "@/lib/orders/publicQuote";
import {
  ApiError,
  assertEnabled,
  clientIp,
  computeQuote,
  errorResponse,
  ipHash,
  materialContext,
  rateLimit,
} from "@/lib/server/calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertEnabled();
    await rateLimit("quote", ipHash(clientIp(req)), 60, 10 * 60_000);
    const body = await req.json().catch(() => null);
    const groupId = Number(body?.groupId);
    const materialId = Number(body?.materialId);
    if (!Number.isInteger(groupId) || !Number.isInteger(materialId)) throw new ApiError(400, "Невалиден материал.");
    const ctx = await materialContext(groupId, materialId);
    const parsed = parseQuoteInput(body, ctx.pricing, ctx.stoneKey);
    if (!parsed.ok) throw new ApiError(400, parsed.error);
    const { quote } = await computeQuote(parsed.value, ctx);
    // Only the final gross and the finished (net) area – no breakdown, no waste, no unit prices.
    const result: PublicQuoteResult = { gross: quote.gross, areaM2: quote.netAreaM2, currency: quote.currency };
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
