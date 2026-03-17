import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InactiveServicePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 text-center">
            <div className="max-w-md space-y-6">
                <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Servicio Inactivo</h1>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Esta tienda web se encuentra temporalmente fuera de servicio. 
                        Es posible que el propietario esté actualizando su plan de suscripción.
                    </p>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-6 italic">UnderDeskFlow E-commerce Engine</p>
                    <Link href="/">
                        <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                            Volver al inicio
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
