import { NextRequest, NextResponse } from "next/server";
import * as net from "net";

/**
 * POST /api/pos/kitchen/print
 * Body: { printerIp: string, printerPort?: number, ticketText: string }
 *
 * Sends raw ESC/POS bytes directly to a network thermal printer via TCP 9100.
 * This replaces window.print() for production kitchens.
 *
 * Typical printer: Epson TM-T20, TM-T88, Star TSP100, etc.
 * Config: set printer IP in store settings, DHCP reservation recommended.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { printerIp, printerPort = 9100, ticketText } = body;

        if (!printerIp || !ticketText) {
            return NextResponse.json(
                { error: "printerIp and ticketText are required" },
                { status: 400 }
            );
        }

        // Validate IP format (basic)
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(printerIp)) {
            return NextResponse.json({ error: "Invalid printer IP" }, { status: 400 });
        }

        await sendToThermalPrinter(printerIp, printerPort, ticketText);

        return NextResponse.json({ success: true, printerIp, printerPort });
    } catch (err: any) {
        console.error("[Kitchen TCP Print Error]", err);
        return NextResponse.json(
            { error: err.message ?? "Printer connection failed" },
            { status: 500 }
        );
    }
}

/**
 * Sends ESC/POS formatted text to a printer via TCP socket.
 * Returns a Promise that resolves when the data has been flushed.
 */
function sendToThermalPrinter(
    ip: string,
    port: number,
    text: string,
    timeoutMs = 5000
): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let settled = false;

        const done = (err?: Error) => {

            if (settled) return;
            settled = true;
            socket.destroy();
            err ? reject(err) : resolve();
        };

        socket.setTimeout(timeoutMs);

        socket.on("connect", () => {
            // ESC/POS header: init printer + cut paper at end
            const ESC = "\x1B";
            const GS = "\x1D";
            const init = `${ESC}@`;           // Initialize printer
            const bold = `${ESC}E\x01`;       // Bold on
            const normalSize = `${ESC}M\x00`; // Normal character size
            const newline = "\n";
            const cutPaper = `${GS}V\x41\x00`; // Full cut

            const raw = Buffer.from(
                init + bold + normalSize + text + newline + newline + newline + cutPaper,
                "utf8"
            );

            socket.write(raw, (err?: Error | null) => {
                if (err) return done(err);

                done();
            });
        });

        socket.on("timeout", () => done(new Error(`Printer timeout — ${ip}:${port} unreachable`)));
        socket.on("error", (err: Error) => done(err));


        socket.connect(port, ip);
    });
}
