/**
 * Internal Ops Dashboard — /admin/internal-ops
 * 
 * High-performance monitoring for platform administrators.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    Shield,
    Zap,
    AlertTriangle,
    Server,
    Globe,
    Search,
    RefreshCw
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InternalOpsPage() {
    const [globalHealth, setGlobalHealth] = useState("optimal");
    const [stats, setStats] = useState({
        activeWebhooks: 1240,
        avgLatencyMs: 285,
        openCircuits: 2,
        throttledShops: 14
    });

    return (
        <div className="p-8 space-y-8 bg-zinc-50 dark:bg-black min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-3">
                        <Shield className="h-10 w-10 text-primary" />
                        SYS-OPS <span className="text-muted-foreground font-thin">CENTRAL</span>
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
                        Platform-wide synchronization health & resilience monitoring
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[10px] animate-pulse">LIVE FEED</Badge>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Global Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Throughput", value: stats.activeWebhooks + " req/m", icon: Activity, color: "text-blue-500" },
                    { label: "Avg Latency", value: stats.avgLatencyMs + "ms", icon: Zap, color: "text-amber-500" },
                    { label: "Circuits Open", value: stats.openCircuits, icon: AlertTriangle, color: "text-red-500" },
                    { label: "Active Nodes", value: "12/12", icon: Server, color: "text-emerald-500" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-zinc-900 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-mono uppercase text-muted-foreground">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold font-mono tracking-tight">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Health Map & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-primary" /> Incident Monitor (Region: LATAM-1)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-mono text-[10px] uppercase">Shop ID</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase">Channel</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase">Issue</TableHead>
                                    <TableHead className="font-mono text-[10px] uppercase text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-mono text-xs">store_9921_cl</TableCell>
                                    <TableCell><Badge variant="outline">Mercado Libre</Badge></TableCell>
                                    <TableCell className="text-xs text-red-500">Circuit Breaker OPEN (503 floods)</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]">Reset Circuit</Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-mono text-xs">store_8812_br</TableCell>
                                    <TableCell><Badge variant="outline">Shopify</Badge></TableCell>
                                    <TableCell className="text-xs text-amber-500">Throttled (Retry-After: 45s)</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]">Inspect Queues</Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-zinc-900 text-zinc-100">
                    <CardHeader>
                        <CardTitle className="text-base font-mono">System Events</CardTitle>
                        <CardDescription className="text-zinc-500 text-[10px]">Real-time security & integrity logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 font-mono text-[10px]">
                            <div className="flex gap-2">
                                <span className="text-zinc-500">[22:58:11]</span>
                                <span className="text-emerald-400">INFO</span>
                                <span>Adaptive polling back-off: store_abc (IDLE)</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-zinc-500">[22:57:45]</span>
                                <span className="text-amber-400">WARN</span>
                                <span>Drift threshold reached: store_xyz ($1.2M drift)</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-zinc-500">[22:56:02]</span>
                                <span className="text-red-400">ERROR</span>
                                <span>DLQ limit hit: mercadolibre/webhooks/prod_1</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
