import { buildOptions } from "@/lib/orders/publicQuote";
import { ApiError, calculatorEnabled, errorResponse, materialContext } from "@/lib/server/calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Labels only – prices never leave the server.
export async function GET(req: Request) {
  try {
    if (!(await calculatorEnabled())) return Response.json({ enabled: false });
    const url = new URL(req.url);
    const groupId = Number(url.searchParams.get("groupId"));
    const materialId = Number(url.searchParams.get("materialId"));
    if (!Number.isInteger(groupId) || !Number.isInteger(materialId)) return Response.json({ error: "Невалиден материал." }, { status: 400 });
    const ctx = await materialContext(groupId, materialId);
    return Response.json({ enabled: true, options: buildOptions(ctx.pricing, ctx.stoneKey) });
  } catch (e) {
    // Any setup problem (no service account, unknown material) simply hides the calculator.
    if (e instanceof ApiError) return Response.json({ enabled: false });
    return errorResponse(e);
  }
}
