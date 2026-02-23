import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function TenantNotFound() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-muted/30 p-8 rounded-full mb-8">
                <Ghost className="h-24 w-24 text-muted-foreground/50" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Página no encontrada</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
                Lo sentimos, la página que estás buscando no existe o ha sido movida.
            </p>
            <Link href="/tenant">
                <Button size="lg" className="rounded-full px-8">
                    Volver al Inicio
                </Button>
            </Link>
        </div>
    );
}
