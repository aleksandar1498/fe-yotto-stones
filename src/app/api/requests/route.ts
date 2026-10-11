import { parseContact, parseQuoteInput, type OrderRequest } from "@/lib/orders/publicQuote";
import { adminDb } from "@/lib/server/firebaseAdmin";
import {
  ApiError,
  assertEnabled,
  clientIp,
  computeQuote,
  errorResponse,
  ipHash,
  materialContext,
  previewMode,
  rateLimit,
} from "@/lib/server/calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const strip = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export async function POST(req: Request) {
  try {
    await assertEnabled();
    const body = await req.json().catch(() => null);
    // Honeypot: bots fill every field. Pretend success so they don't retry.
    if (body?.website) return Response.json({ ok: true });
    if (body?.consent !== true) throw new ApiError(400, "Необходимо е съгласие за обработка на личните данни.");

    const contact = parseContact(body?.contact);
    if (!contact.ok) throw new ApiError(400, contact.error);
    const groupId = Number(body?.quote?.groupId);
    const materialId = Number(body?.quote?.materialId);
    if (!Number.isInteger(groupId) || !Number.isInteger(materialId)) throw new ApiError(400, "Невалиден материал.");

    const hash = ipHash(clientIp(req));
    await rateLimit("request", hash, 5, 60 * 60_000);

    const ctx = await materialContext(groupId, materialId);
    const parsed = parseQuoteInput(body.quote, ctx.pricing, ctx.stoneKey);
    if (!parsed.ok) throw new ApiError(400, parsed.error);
    const { positions, quote } = await computeQuote(parsed.value, ctx);

    if (previewMode()) {
      console.info("[calculator preview] request not saved:", contact.value.name, quote.gross);
      return Response.json({ ok: true, id: "preview" });
    }
    const db = adminDb();
    if (!db) throw new ApiError(503, "Калкулаторът не е наличен.");
    const now = Date.now();
    const node = db.ref("order_requests").push();
    const record: Omit<OrderRequest, "id"> & { ipHash: string } = {
      status: "new",
      createdAt: now,
      updatedAt: now,
      client: { name: contact.value.name, phone: contact.value.phone, email: contact.value.email },
      note: contact.value.note,
      consentAt: now,
      material: ctx.material,
      stoneKey: ctx.stoneKey,
      materialPriceM2: ctx.materialPriceM2,
      positions,
      serviceKeys: parsed.value.services,
      quote: { gross: quote.gross, net: quote.net, vat: quote.vat, areaM2: quote.netAreaM2, currency: quote.currency },
      ipHash: hash,
    };
    await node.set(strip(record));
    return Response.json({ ok: true, id: node.key });
  } catch (e) {
    return errorResponse(e);
  }
}
