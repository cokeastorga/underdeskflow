import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/pos/kitchen/ticket
 * Generates an ESC/POS-compatible plain text kitchen ticket.
 * MVP: returns text for window.print() in an 80mm iframe.
 * Roadmap: send raw bytes via TCP 9100 to network printer.
 */

interface TicketItem {
    name: string;
    quantity: number;
    notes?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { orderId, items, table, notes, createdAt } = await req.json();

        if (!orderId || !items?.length) {
            return NextResponse.json({ error: "orderId and items required" }, { status: 400 });
        }

        const time = createdAt
            ? new Date(createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

        // ── Build ticket text ──────────────────────────────────────────────────
        const lines: string[] = [];
        const SEP = "─".repeat(32);

        lines.push("================================");
        if (table) {
            lines.push(`       *** MESA ${table} ***`);
        }
        lines.push(`       COMANDA POS`);
        lines.push(`       ${time}`);
        lines.push("================================");
        lines.push("");

        for (const item of items as TicketItem[]) {
            lines.push(`${String(item.quantity).padStart(2)}x  ${item.name}`);
            if (item.notes) {
                lines.push(`     ⚑ ${item.notes}`);
            }
        }

        lines.push("");
        lines.push(SEP);

        if (notes) {
            lines.push(`NOTA: ${notes}`);
            lines.push(SEP);
        }

        lines.push(`Orden: #${String(orderId).slice(-8).toUpperCase()}`);
        lines.push("");

        const ticketText = lines.join("\n");

        // ── HTML for 80mm thermal print ────────────────────────────────────────
        const ticketHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre;
    padding: 0;
    margin: 0;
  }
  @media print { body { visibility: visible; } }
</style>
</head>
<body>${ticketText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
</html>`;

        return NextResponse.json({ ticketText, ticketHtml });
    } catch (err: any) {
        console.error("[Kitchen Ticket Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
