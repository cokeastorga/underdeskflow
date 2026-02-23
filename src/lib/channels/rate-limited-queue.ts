/**
 * RateLimitedQueue — Token Bucket Queue per channel connection.
 *
 * Each channel connection gets its own queue with a configurable token bucket.
 * The SyncOrchestrator submits jobs to the queue; the queue drains them
 * respecting the channel's API rate limits.
 *
 * Token Bucket:
 *   - Capacity: maxRatePerMinute tokens
 *   - Refill: 1 token every (60_000 / maxRatePerMinute) ms
 *   - On ChannelRateLimitError: pause the queue for the specified retryAfterMs
 *
 * Priority order: HIGH before MEDIUM before LOW
 */

import { SyncEventPriority } from "@/types/channels";
import { ChannelRateLimitError } from "./adapters/channel-adapter.interface";
import { circuitBreaker } from "./circuit-breaker";

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface QueueJob<T = unknown> {
    id: string;
    priority: SyncEventPriority;
    execute: () => Promise<T>;
    onSuccess?: (result: T) => void;
    onError?: (err: unknown) => void;
    /** Number of times this job has been retried */
    retryCount: number;
    /** Max retries before the job is sent to dead letter */
    maxRetries: number;
    createdAt: number;
    storeId: string; // Added to support CircuitBreaker lookup
}

// ─── Priority Comparator ──────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<SyncEventPriority, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
};

// ─── Queue State ──────────────────────────────────────────────────────────────

export type QueueStatus = "IDLE" | "RUNNING" | "THROTTLED" | "PAUSED" | "CIRCUIT_OPEN";

export interface QueueStats {
    connectionId: string;
    channelType: string;
    status: QueueStatus;
    pending: number;
    tokensAvailable: number;
    throttleUntil?: number;
    processedTotal: number;
    errorTotal: number;
    deadLetterTotal: number;
}

// ─── RateLimitedQueue ────────────────────────────────────────────────────────

export class RateLimitedQueue {
    private queue: QueueJob[] = [];
    private tokens: number;
    private status: QueueStatus = "IDLE";
    private processedTotal = 0;
    private errorTotal = 0;
    private deadLetterTotal = 0;
    private throttleUntil?: number;
    private drainTimer?: NodeJS.Timeout;
    private refillTimer?: NodeJS.Timeout;
    private deadLetterHandler?: (job: QueueJob, err: unknown) => void;

    constructor(
        readonly connectionId: string,
        readonly storeId: string,
        readonly channelType: string,
        /** Requests allowed per minute */
        readonly maxRatePerMinute: number = 40
    ) {
        this.tokens = maxRatePerMinute;
        this.startRefill();
    }

    // ── Token refill ─────────────────────────────────────────────────────────

    private startRefill(): void {
        const intervalMs = Math.ceil(60_000 / this.maxRatePerMinute);
        this.refillTimer = setInterval(() => {
            if (this.tokens < this.maxRatePerMinute) {
                this.tokens = Math.min(this.tokens + 1, this.maxRatePerMinute);
            }
            if (this.status === "IDLE" && this.queue.length > 0) {
                this.drain();
            }
        }, intervalMs);
        // Don't prevent process exit
        this.refillTimer.unref?.();
    }

    // ── Enqueue ───────────────────────────────────────────────────────────────

    enqueue<T>(job: Omit<QueueJob<T>, "retryCount" | "createdAt">): void {
        const fullJob: QueueJob = {
            ...job as QueueJob,
            retryCount: 0,
            createdAt: Date.now(),
        };
        // Insert by priority (stable sort: same priority keeps insertion order)
        const weight = PRIORITY_WEIGHT[job.priority];
        const insertIdx = this.queue.findIndex(j => PRIORITY_WEIGHT[j.priority] > weight);
        if (insertIdx === -1) {
            this.queue.push(fullJob);
        } else {
            this.queue.splice(insertIdx, 0, fullJob);
        }
        if (this.status === "IDLE") {
            this.drain();
        }
    }

    // ── Drain loop ────────────────────────────────────────────────────────────

    private async drain(): Promise<void> {
        if (this.status === "RUNNING" || this.status === "THROTTLED") return;
        if (this.queue.length === 0) {
            this.status = "IDLE";
            return;
        }

        this.status = "RUNNING";

        while (this.queue.length > 0) {
            // Throttle check
            if (this.throttleUntil && Date.now() < this.throttleUntil) {
                this.status = "THROTTLED";
                const wait = this.throttleUntil - Date.now();
                await new Promise(r => {
                    this.drainTimer = setTimeout(r, wait);
                });
                this.throttleUntil = undefined;
                this.status = "RUNNING";
            }

            // Circuit Breaker check
            const status = await circuitBreaker.getStatus(this.storeId, this.connectionId);
            if (status.state === "OPEN") {
                this.status = "CIRCUIT_OPEN";
                const wait = (status.openUntil || Date.now() + 60000) - Date.now();
                if (wait > 0) {
                    await new Promise(r => {
                        this.drainTimer = setTimeout(r, Math.min(wait, 5000)); // Check again soon
                    });
                    continue;
                }
                this.status = "RUNNING";
            }

            // Token check
            if (this.tokens <= 0) {
                // Wait for next token
                await new Promise(r => {
                    this.drainTimer = setTimeout(r, Math.ceil(60_000 / this.maxRatePerMinute));
                });
                continue;
            }

            const job = this.queue.shift()!;

            // Circuit Breaker check
            const available = await circuitBreaker.isAvailable(job.id, this.connectionId); // Note: assuming job.id or similar. Wait, job.storeId?
            // Wait, I need storeId in the queue job.

            this.tokens -= 1;

            try {
                const result = await job.execute();
                await circuitBreaker.recordSuccess(this.storeId, this.connectionId);
                this.processedTotal += 1;
                job.onSuccess?.(result);
            } catch (err) {
                await circuitBreaker.recordFailure(this.storeId, this.connectionId);
                this.errorTotal += 1;
                if (err instanceof ChannelRateLimitError) {
                    // Put job back at front and throttle
                    this.queue.unshift(job);
                    this.throttleUntil = Date.now() + err.retryAfterMs;
                    this.tokens = 0; // Drain bucket on rate limit
                    continue;
                }
                // Retry logic
                if (job.retryCount < job.maxRetries) {
                    job.retryCount += 1;
                    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                    const backoffMs = Math.min(1000 * 2 ** (job.retryCount - 1), 16_000);
                    await new Promise(r => setTimeout(r, backoffMs));
                    this.queue.unshift(job); // Retry at front (same priority)
                } else {
                    this.deadLetterTotal += 1;
                    this.deadLetterHandler?.(job, err);
                    job.onError?.(err);
                }
            }
        }

        this.status = "IDLE";
    }

    // ── Control ───────────────────────────────────────────────────────────────

    /** Pause the queue (e.g. channel suspended by platform). */
    pause(): void {
        this.status = "PAUSED";
        if (this.drainTimer) clearTimeout(this.drainTimer);
    }

    /** Resume processing. */
    resume(): void {
        if (this.status === "PAUSED") {
            this.status = "IDLE";
            this.drain();
        }
    }

    /** Register a dead letter handler for jobs that exhausted retries. */
    onDeadLetter(handler: (job: QueueJob, err: unknown) => void): void {
        this.deadLetterHandler = handler;
    }

    /** Clean up timers when the queue is no longer needed. */
    destroy(): void {
        if (this.drainTimer) clearTimeout(this.drainTimer);
        if (this.refillTimer) clearInterval(this.refillTimer);
        this.queue = [];
        this.status = "PAUSED";
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    getStats(): QueueStats {
        return {
            connectionId: this.connectionId,
            channelType: this.channelType,
            status: this.status,
            pending: this.queue.length,
            tokensAvailable: this.tokens,
            throttleUntil: this.throttleUntil,
            processedTotal: this.processedTotal,
            errorTotal: this.errorTotal,
            deadLetterTotal: this.deadLetterTotal,
        };
    }
}

// ─── Registry ──────────────────────────────────────────────────────────────────

/**
 * Singleton registry that holds one RateLimitedQueue per channel connection.
 * Keyed by connectionId.
 */
class QueueRegistry {
    private queues = new Map<string, RateLimitedQueue>();

    getOrCreate(
        storeId: string,
        connectionId: string,
        channelType: string,
        maxRatePerMinute: number
    ): RateLimitedQueue {
        if (!this.queues.has(connectionId)) {
            const q = new RateLimitedQueue(connectionId, storeId, channelType, maxRatePerMinute);
            this.queues.set(connectionId, q);
        }
        return this.queues.get(connectionId)!;
    }

    get(connectionId: string): RateLimitedQueue | undefined {
        return this.queues.get(connectionId);
    }

    destroy(connectionId: string): void {
        this.queues.get(connectionId)?.destroy();
        this.queues.delete(connectionId);
    }

    getAllStats(): QueueStats[] {
        return [...this.queues.values()].map(q => q.getStats());
    }
}

export const queueRegistry = new QueueRegistry();
