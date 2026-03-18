import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ShieldCheck, ExternalLink, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function HQDomainsPage() {
    // Mock domain data
    const domains = [
        { domain: "zapato-feliz.udf.cl", store: "Zapato Feliz", type: "subdomain", status: "verified", ssl: "active" },
        { domain: "luxury-moda.com", store: "Luxury Moda", type: "custom", status: "verified", ssl: "active" },
        { domain: "tech-house.udf.cl", store: "Tech House", type: "subdomain", status: "pending", ssl: "issuing" },
        { domain: "organic-market.cl", store: "Organic Market", type: "custom", status: "verified", ssl: "active" },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Dominios</h1>
                    <p className="text-muted-foreground mt-2">
                        Control global de subdominios UDF y dominios personalizados de tenants.
                    </p>
                </div>
                <Button className="shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Configurar Root Domain
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar dominio o tienda..." className="pl-10 h-10 border-none bg-background shadow-inner" />
                </div>
                <Button variant="outline" className="h-10">Filtros</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Dominios Activos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground text-xs text-left">
                                    <th className="py-4 font-medium px-2">Dominio</th>
                                    <th className="py-4 font-medium px-2">Tienda / Owner</th>
                                    <th className="py-4 font-medium px-2">Tipo</th>
                                    <th className="py-4 font-medium px-2">Seguridad</th>
                                    <th className="py-4 font-medium px-2">Estado</th>
                                    <th className="py-4 font-medium px-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {domains.map((d) => (
                                    <tr key={d.domain} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="font-medium">{d.domain}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{d.store}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <Badge variant="outline" className="text-[10px] font-normal capitalize">
                                                {d.type}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-medium tracking-wide underline decoration-dotted underline-offset-4">SSL {d.ssl}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <Badge className={`text-[10px] font-semibold border-none ${
                                                d.status === 'verified' 
                                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                                    : 'bg-amber-500/10 text-amber-600'
                                            }`}>
                                                {d.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
