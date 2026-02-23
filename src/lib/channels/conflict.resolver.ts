/**
 * ConflictResolver — Detect and log conflicts between platform and channel data.
 *
 * A conflict occurs when:
 *   - A product's price/stock on the platform differs from the external channel
 *   - An external channel pushes a value that the platform would not allow
 *     (e.g. price below minimum, stock going negative)
 *
 * Resolution strategies:
 *   - "PLATFORM_WINS":  Platform value takes precedence → push write-back to channel
 *   - "CHANNEL_WINS":   Channel value takes precedence → update platform record
 *   - "MANUAL":         Append to product_change_events for human review
 *
 * All conflicts produce an immutable ProductChangeEvent for the audit trail.
 */

import { appendProductChangeEvent } from "./channel.repository";
import { ChannelType, ProductChangeEvent } from "@/types/channels";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolutionStrategy = "PLATFORM_WINS" | "CHANNEL_WINS" | "MANUAL";

export interface ConflictField {
    field: "price" | "stock" | "status";
    platformValue: number | string;
    channelValue: number | string;
    currency?: string;
}

export interface ConflictResolution {
    strategy: ResolutionStrategy;
    resolvedValue: number | string;
    requiresWriteback: boolean;          // Should platform push value back to channel?
    requiresPlatformUpdate: boolean;     // Should platform update its own record?
    logForReview: boolean;               // Should this be shown in the conflicts UI?
}

export interface ConflictReport {
    storeId: string;
    productId: string;
    externalProductId: string;
    channelType: ChannelType;
    conflicts: ConflictField[];
    resolutions: ConflictResolution[];
    traceId: string;
}

// ─── Default resolution rules ─────────────────────────────────────────────────

const DEFAULT_RULES: Record<ConflictField["field"], ResolutionStrategy> = {
    price: "PLATFORM_WINS", // Platform is the source of truth for pricing
    stock: "CHANNEL_WINS",  // Channel always has the most accurate stock (orders come from there)
    status: "MANUAL",        // Status changes require human confirmation
};

// ─── ConflictResolver ────────────────────────────────────────────────────────

export class ConflictResolver {

    /**
     * Analyze differences between platform and channel values.
     * Returns a conflict report with recommended resolutions.
     */
    analyze(
        storeId: string,
        channelType: ChannelType,
        productId: string,
        externalProductId: string,
        platformValues: Record<string, number | string>,
        channelValues: Record<string, number | string>,
        traceId: string
    ): ConflictReport | null {
        const conflicts: ConflictField[] = [];
        const resolutions: ConflictResolution[] = [];

        const fields: ConflictField["field"][] = ["price", "stock", "status"];

        for (const field of fields) {
            const pv = platformValues[field];
            const cv = channelValues[field];
            if (pv === undefined || cv === undefined) continue;
            if (pv === cv) continue;

            // Significant difference threshold (avoid noise from rounding)
            if (field === "price" || field === "stock") {
                const pNum = Number(pv);
                const cNum = Number(cv);
                if (Math.abs(pNum - cNum) < 0.01) continue;
            }

            const strategy = DEFAULT_RULES[field];
            conflicts.push({ field, platformValue: pv, channelValue: cv });
            resolutions.push(this.resolveConflict(field, pv, cv, strategy));
        }

        if (conflicts.length === 0) return null;

        return {
            storeId,
            productId,
            externalProductId,
            channelType,
            conflicts,
            resolutions,
            traceId,
        };
    }

    private resolveConflict(
        field: ConflictField["field"],
        platformValue: number | string,
        channelValue: number | string,
        strategy: ResolutionStrategy
    ): ConflictResolution {
        switch (strategy) {
            case "PLATFORM_WINS":
                return {
                    strategy,
                    resolvedValue: platformValue,
                    requiresWriteback: true,      // Push platform value → channel
                    requiresPlatformUpdate: false,
                    logForReview: false,
                };
            case "CHANNEL_WINS":
                return {
                    strategy,
                    resolvedValue: channelValue,
                    requiresWriteback: false,
                    requiresPlatformUpdate: true, // Update platform from channel value
                    logForReview: true,           // Log for transparency
                };
            case "MANUAL":
                return {
                    strategy,
                    resolvedValue: platformValue, // Keep platform value as-is
                    requiresWriteback: false,
                    requiresPlatformUpdate: false,
                    logForReview: true,           // This MUST be reviewed
                };
        }
    }

    /**
     * Log a conflict to the immutable product_change_events collection.
     * Should be called for every conflict, regardless of resolution strategy.
     */
    async logConflict(report: ConflictReport): Promise<void> {
        for (const conflict of report.conflicts) {
            const resolution = report.resolutions.find(r =>
                r.resolvedValue === conflict.platformValue || r.resolvedValue === conflict.channelValue
            );
            const event: Omit<ProductChangeEvent, "id"> = {
                storeId: report.storeId,
                productId: report.productId,
                externalProductId: report.externalProductId,
                channelType: report.channelType,
                field: conflict.field,
                previousValue: String(conflict.platformValue),
                newValue: String(conflict.channelValue),
                source: "channel_sync",
                resolvedBy: resolution?.strategy === "MANUAL" ? undefined : "auto",
                resolutionStrategy: resolution?.strategy,
                metadata: { traceId: report.traceId },
                createdAt: Date.now(),
                resolved: resolution?.strategy !== "MANUAL",
                resolvedAt: resolution?.strategy !== "MANUAL" ? Date.now() : undefined,
            };
            await appendProductChangeEvent(report.storeId, event);
        }
    }
}

export const conflictResolver = new ConflictResolver();
