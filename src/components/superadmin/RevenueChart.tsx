"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  data: {
    date: string;
    gmv: number;
    fees: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  };

  return (
    <Card className="col-span-4 border-indigo-500/20 bg-indigo-500/5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Rendimiento del SaaS (30 días)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Comparativa entre GMV total y Comisiones UDF recabadas.
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
                minTickGap={30}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-xl ring-1 ring-black/5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">Fecha</span>
                            <span className="text-sm font-semibold">{formatDate(payload[0].payload.date)}</span>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[10px] uppercase text-muted-foreground font-bold">Total GMV</span>
                             <span className="text-sm font-bold text-indigo-500">{formatCurrency(payload[0].value as number)}</span>
                          </div>
                          <div className="flex flex-col col-span-2 pt-1 border-t mt-1">
                             <span className="text-[10px] uppercase text-muted-foreground font-bold">Comisión UDF (8%)</span>
                             <span className="text-sm font-bold text-emerald-500">{formatCurrency(payload[1].value as number)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGmv)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="fees"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorFees)"
                stackId="2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
