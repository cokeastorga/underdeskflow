"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Globe, Plus, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Domain {
    name: string;
    status: 'pending' | 'active' | 'error';
    verified: boolean;
    dnsRecord: string;
    createdAt: number;
}

export default function DomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([
        {
            name: "example-store.vercel.app",
            status: 'active',
            verified: true,
            dnsRecord: "-",
            createdAt: Date.now() - 100000000
        }
    ]);
    const [newDomain, setNewDomain] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddDomain = () => {
        if (!newDomain) return;

        // Simple regex for domain validation
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(newDomain)) {
            toast.error("Please enter a valid domain (e.g., mystore.com)");
            return;
        }

        setIsAdding(true);

        // Simulate API call
        setTimeout(() => {
            const domain: Domain = {
                name: newDomain,
                status: 'pending',
                verified: false,
                dnsRecord: "cname.vercel-dns.com",
                createdAt: Date.now()
            };
            setDomains([...domains, domain]);
            setNewDomain("");
            setIsAdding(false);
            toast.success("Domain added successfully");
        }, 1000);
    };

    const handleVerify = (domainName: string) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Checking DNS records...',
                success: 'Domain verified successfully! (Mock)',
                error: 'Verification failed'
            }
        );
        // In a real app, this would check DNS propagation
    };

    const handleDelete = (domainName: string) => {
        if (confirm(`Are you sure you want to remove ${domainName}?`)) {
            setDomains(domains.filter(d => d.name !== domainName));
            toast.success("Domain removed");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Custom Domains</h2>
                <p className="text-muted-foreground">
                    Connect your existing custom domains to your store.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add a Custom Domain</CardTitle>
                    <CardDescription>
                        Enter the domain you want to connect (e.g., www.mystore.com).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 max-w-xl">
                        <Input
                            placeholder="www.yourdomain.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                        />
                        <Button onClick={handleAddDomain} disabled={isAdding}>
                            {isAdding ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Add Domain
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6">
                {domains.map((domain) => (
                    <Card key={domain.name} className="overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Globe className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{domain.name}</h3>
                                        {domain.status === 'active' && <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>}
                                        {domain.status === 'pending' && <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Configuration</Badge>}
                                        {domain.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Added on {new Date(domain.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {domain.status !== 'active' && (
                                    <Button variant="outline" size="sm" onClick={() => handleVerify(domain.name)}>
                                        Check Status
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(domain.name)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {domain.status === 'pending' && (
                            <div className="bg-muted/50 p-6 border-t space-y-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Configuration Required</AlertTitle>
                                    <AlertDescription>
                                        Login to your domain provider (GoDaddy, Namecheap, etc.) and add the following record:
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-background border rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Type</p>
                                        <p className="font-mono">CNAME</p>
                                    </div>
                                    <div className="p-4 bg-background border rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Name</p>
                                        <p className="font-mono">www</p>
                                    </div>
                                    <div className="p-4 bg-background border rounded-lg">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Value</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-primary">{domain.dnsRecord}</p>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(domain.dnsRecord); toast.success("Copied to clipboard"); }}>
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Note: DNS propagation can take up to 48 hours.
                                </p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
