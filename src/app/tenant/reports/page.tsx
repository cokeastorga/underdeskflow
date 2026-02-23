"use client";

/**
 * Tenant Reports Page — /tenant/reports
 *
 * 3-tab layout:
 *   1. P&L          — time-series revenue/fee/net chart + table + CSV export
 *   2. Por canal    — Enterprise: per-channel revenue breakdown
 *   3. Conciliación — reconciliation runs history + generate new run
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
} from "recharts";
import {
    Download, RefreshCw, Lock, TrendingUp, Globe, FileCheck,
    CheckCircle2, AlertTriangle, Loader2, Calendar, ArrowUpRight,
} from "lucide-react";
import { PnLReport, ChannelPnLReport, ReconciliationRun } from "@/types/reporting";
import { CHANNEL_DISPLAY } from "@/types/channels";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

function DateRangePicker({
    from, to, onFromChange, onToChange,
}: {
    from: string; to: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
                type="date"
                value={from}
                onChange={e => onFromChange(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
            <span className="text-muted-foreground">→</span>
            <input
                type="date"
                value={to}
                onChange={e => onToChange(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

// ─── Tab 1: P&L ──────────────────────────────────────────────────────────────

function PnLTab({ storeId, token }: { storeId: string; token: string }) {
    const defaultFrom = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const defaultTo = new Date().toISOString().slice(0, 10);

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
    const [report, setReport] = useState<PnLReport | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/reports/pnl?storeId=${storeId}&from=${from}&to=${to}&groupBy=${groupBy}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Error fetching P&L");
            const data = await res.json() as { pnl: PnLReport };
            setReport(data.pnl);
        } finally {
            setLoading(false);
        }
    }, [storeId, from, to, groupBy, token]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleCSV = async () => {
        const res = await fetch(
            `/api/reports/pnl?storeId=${storeId}&from=${from}&to=${to}&groupBy=${groupBy}&format=csv`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pnl_${storeId}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
                <div className="flex rounded-md border border-input overflow-hidden text-sm">
                    {(["day", "week", "month"] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGroupBy(g)}
                            className={`px-3 py-1 ${groupBy === g ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
                        >
                            {g === "day" ? "Día" : g === "week" ? "Semana" : "Mes"}
                        </button>
                    ))}
                </div>
                <Button onClick={fetchReport} variant="outline" size="sm" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Actualizar
                </Button>
                <Button onClick={handleCSV} variant="outline" size="sm" className="gap-2 ml-auto">
                    <Download className="h-3.5 w-3.5" /> Exportar CSV
                </Button>
            </div>

            {/* KPI cards */}
            {report && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Ingresos brutos" value={CLP(report.totals.revenue)} />
                    <StatCard label="Fee plataforma (8%)" value={CLP(report.totals.platformFee)}
                        sub={`${report.totals.revenue > 0 ? ((report.totals.platformFee / report.totals.revenue) * 100).toFixed(1) : 0}%`} />
                    <StatCard label="Comisiones canales" value={CLP(report.totals.channelCommissions)} />
                    <StatCard label="Ingreso neto merchant" value={CLP(report.totals.net)}
                        sub={`${report.totals.orderCount} órdenes`} />
                </div>
            )}

            {/* Chart */}
            {report && report.rows.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Evolución de ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={report.rows}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                <ReTooltip formatter={(v: any) => CLP(v)} />
                                <Legend />
                                <Bar dataKey="ownStoreRevenue" name="Tienda propia" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="externalRevenue" name="Canales externos" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="platformFee" name="Fee plataforma" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            {report && report.rows.length > 0 && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border/50">
                                <tr className="text-muted-foreground text-xs uppercase">
                                    <th className="text-left px-5 py-3">Período</th>
                                    <th className="text-right px-5 py-3">Ingresos</th>
                                    <th className="text-right px-5 py-3">Fee (8%)</th>
                                    <th className="text-right px-5 py-3">Comisiones</th>
                                    <th className="text-right px-5 py-3">Neto</th>
                                    <th className="text-right px-5 py-3">Órdenes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {report.rows.map(row => (
                                    <tr key={row.date} className="hover:bg-muted/20">
                                        <td className="px-5 py-2.5 font-mono text-xs">{row.date}</td>
                                        <td className="px-5 py-2.5 text-right">{CLP(row.revenue)}</td>
                                        <td className="px-5 py-2.5 text-right text-amber-500">{CLP(row.platformFee)}</td>
                                        <td className="px-5 py-2.5 text-right text-muted-foreground">{CLP(row.channelCommissions)}</td>
                                        <td className="px-5 py-2.5 text-right font-medium">{CLP(row.net)}</td>
                                        <td className="px-5 py-2.5 text-right text-muted-foreground">{row.orderCount}</td>
                                    </tr>
                                ))}
                                {/* Totals row */}
                                <tr className="bg-muted/20 font-semibold">
                                    <td className="px-5 py-2.5">TOTAL</td>
                                    <td className="px-5 py-2.5 text-right">{CLP(report.totals.revenue)}</td>
                                    <td className="px-5 py-2.5 text-right text-amber-500">{CLP(report.totals.platformFee)}</td>
                                    <td className="px-5 py-2.5 text-right text-muted-foreground">{CLP(report.totals.channelCommissions)}</td>
                                    <td className="px-5 py-2.5 text-right">{CLP(report.totals.net)}</td>
                                    <td className="px-5 py-2.5 text-right text-muted-foreground">{report.totals.orderCount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-2 border-t border-border/30 flex justify-end">
                        <p className="text-[10px] text-muted-foreground font-mono">checksum: {report.ledgerChecksum.slice(0, 16)}…</p>
                    </div>
                </Card>
            )}

            {!loading && report?.rows.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-sm">
                    No hay datos para el período seleccionado.
                </div>
            )}
        </div>
    );
}

// ─── Tab 2: Por canal (Enterprise) ───────────────────────────────────────────

function ChannelTab({ storeId, token, isEnterprise }: { storeId: string; token: string; isEnterprise: boolean }) {
    const defaultFrom = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const defaultTo = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [report, setReport] = useState<ChannelPnLReport | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        if (!isEnterprise) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/reports/pnl?storeId=${storeId}&from=${from}&to=${to}&channel=true`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            const data = await res.json() as { channels?: ChannelPnLReport };
            if (data.channels) setReport(data.channels);
        } finally {
            setLoading(false);
        }
    }, [storeId, from, to, token, isEnterprise]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    if (!isEnterprise) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-violet-500" />
                </div>
                <div className="text-center">
                    <p className="font-semibold">Análisis multicanal — Enterprise</p>
                    <p className="text-sm text-muted-foreground mt-1">Actualiza al plan Enterprise para ver el desglose por canal.</p>
                </div>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => window.location.href = "/tenant/billing"}>
                    Ver planes →
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
                <Button onClick={fetchReport} variant="outline" size="sm" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Actualizar
                </Button>
            </div>

            {report && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Revenue total" value={CLP(report.totalRevenue)} />
                        <StatCard label="Canales activos" value={`${report.rows.length}`} />
                        <StatCard label="Revenue external" value={CLP(report.rows.filter(r => r.channelType !== "own_store").reduce((s, r) => s + r.revenue, 0))} />
                    </div>

                    {/* Bar chart */}
                    <Card>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={report.rows} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={110} />
                                    <ReTooltip formatter={(v: any) => CLP(v)} />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Ingresos" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="channelCommission" name="Comisión canal" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Detail table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Rendimiento por Canal</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border/50">
                                    <tr className="text-muted-foreground text-xs uppercase">
                                        <th className="text-left px-5 py-3">Canal</th>
                                        <th className="text-right px-5 py-3">Ingresos</th>
                                        <th className="text-right px-5 py-3">% del total</th>
                                        <th className="text-right px-5 py-3">Fee plataforma</th>
                                        <th className="text-right px-5 py-3">Comisión canal</th>
                                        <th className="text-right px-5 py-3">Neto merchant</th>
                                        <th className="text-right px-5 py-3">Órdenes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {report.rows.map(row => {
                                        const channelInfo = row.channelType !== "own_store"
                                            ? CHANNEL_DISPLAY[row.channelType as keyof typeof CHANNEL_DISPLAY]
                                            : null;
                                        return (
                                            <tr key={row.channelType} className="hover:bg-muted/20">
                                                <td className="px-5 py-2.5 flex items-center gap-2">
                                                    {channelInfo ? channelInfo.icon : "🏪"}
                                                    <span>{row.label}</span>
                                                    {row.platformFee === 0 && row.channelType !== "own_store" && (
                                                        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">0% fee</Badge>
                                                    )}
                                                </td>
                                                <td className="px-5 py-2.5 text-right">{CLP(row.revenue)}</td>
                                                <td className="px-5 py-2.5 text-right text-muted-foreground">{row.sharePercent.toFixed(1)}%</td>
                                                <td className="px-5 py-2.5 text-right text-amber-500">{CLP(row.platformFee)}</td>
                                                <td className="px-5 py-2.5 text-right text-orange-400">{CLP(row.channelCommission)}</td>
                                                <td className="px-5 py-2.5 text-right font-medium">{CLP(row.net)}</td>
                                                <td className="px-5 py-2.5 text-right text-muted-foreground">{row.orders}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <TopSkusSection storeId={storeId} token={token} />
                </>
            )}
        </div>
    );
}

function TopSkusSection({ storeId, token }: { storeId: string; token: string }) {
    const [topSkus, setTopSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");

    const fetchTopSkus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/top-skus?storeId=${storeId}&channel=${filter}&limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTopSkus(data.topSkus || []);
        } finally {
            setLoading(false);
        }
    }, [storeId, token, filter]);

    useEffect(() => { fetchTopSkus(); }, [fetchTopSkus]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm">Productos Top Selling</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Productos con mayor volumen de venta por canal.</p>
                </div>
                <select
                    className="text-xs bg-transparent border rounded p-1"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">Todos los canales</option>
                    {Object.keys(CHANNEL_DISPLAY).map(c => (
                        <option key={c} value={c}>{CHANNEL_DISPLAY[c as keyof typeof CHANNEL_DISPLAY].name}</option>
                    ))}
                </select>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {topSkus.map((sku, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium line-clamp-1">{sku.title}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground font-mono">SKU: {sku.sku}</span>
                                            <Badge variant="outline" className="text-[8px] h-3 px-1">
                                                {CHANNEL_DISPLAY[sku.channel as keyof typeof CHANNEL_DISPLAY]?.icon} {sku.channel}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{CLP(sku.revenue)}</p>
                                    <p className="text-[10px] text-muted-foreground">{sku.quantity} unidades</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Tab 3: Reconciliación ────────────────────────────────────────────────────

function ReconciliationTab({ storeId, token }: { storeId: string; token: string }) {
    const defaultFrom = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const defaultTo = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [runs, setRuns] = useState<ReconciliationRun[]>([]);
    const [generating, setGenerating] = useState(false);

    const loadHistory = useCallback(async () => {
        const res = await fetch(
            `/api/reports/reconciliation?storeId=${storeId}&history=true`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json() as { runs: ReconciliationRun[] };
        setRuns(data.runs);
    }, [storeId, token]);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch(
                `/api/reports/reconciliation?storeId=${storeId}&from=${from}&to=${to}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            await loadHistory();
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
                <Button onClick={handleGenerate} size="sm" disabled={generating} className="gap-2">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                    Generar conciliación
                </Button>
            </div>

            <Card>
                <div className="divide-y divide-border/30">
                    {runs.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No hay conciliaciones. Genera una con el botón de arriba.
                        </div>
                    )}
                    {runs.map(run => (
                        <div key={run.id} className="px-5 py-4 flex items-start gap-4">
                            <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${run.status === "clean" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                                {run.status === "clean"
                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    : <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium">
                                        {new Date(run.periodStart).toLocaleDateString("es-CL")} — {new Date(run.periodEnd).toLocaleDateString("es-CL")}
                                    </p>
                                    <Badge variant={run.status === "clean" ? "outline" : "destructive"} className="text-[10px]">
                                        {run.status === "clean" ? "Sin discrepancias" : `${run.discrepancies} discrepancia${run.discrepancies !== 1 ? "s" : ""}`}
                                    </Badge>
                                </div>
                                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                    <span>{run.txCount} transacciones</span>
                                    <span>{CLP(run.totalRevenue)} ingresos</span>
                                    <span>{CLP(run.totalFees)} fees</span>
                                    <span>{CLP(run.totalNet)} neto</span>
                                </div>
                                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                                    checksum: {run.checksum.slice(0, 24)}…
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(run.generatedAt).toLocaleString("es-CL")}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const { storeId, user } = useAuth();
    const [token, setToken] = useState("");
    const [isEnterprise, setIsEnterprise] = useState(false);

    useEffect(() => {
        if (!user) return;
        user.getIdToken().then(t => setToken(t));
        // Check Enterprise plan
        if (!storeId) return;
        fetch(`/api/store/plan?storeId=${storeId}`)
            .then(r => r.json())
            .then((d: { plan?: string }) => setIsEnterprise(d.plan === "enterprise"))
            .catch(() => { });
    }, [user, storeId]);

    if (!storeId || !token) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        P&L, desglose por canal, y conciliación de ledger — desde datos reales del ledger contable.
                    </p>
                </div>
                {isEnterprise && <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">⭐ Enterprise</Badge>}
            </div>

            <Tabs defaultValue="pnl">
                <TabsList>
                    <TabsTrigger value="pnl" className="gap-2">
                        <TrendingUp className="h-4 w-4" /> P&L
                    </TabsTrigger>
                    <TabsTrigger value="channel" className="gap-2">
                        <Globe className="h-4 w-4" /> Por canal
                        {!isEnterprise && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </TabsTrigger>
                    <TabsTrigger value="reconciliation" className="gap-2">
                        <FileCheck className="h-4 w-4" /> Conciliación
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pnl" className="mt-6">
                    <PnLTab storeId={storeId} token={token} />
                </TabsContent>
                <TabsContent value="channel" className="mt-6">
                    <ChannelTab storeId={storeId} token={token} isEnterprise={isEnterprise} />
                </TabsContent>
                <TabsContent value="reconciliation" className="mt-6">
                    <ReconciliationTab storeId={storeId} token={token} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
