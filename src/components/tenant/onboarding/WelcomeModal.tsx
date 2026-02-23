"use client";

import { useState } from "react";
import { Store } from "@/types/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StepBasicInfo } from "./StepBasicInfo";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

interface WelcomeModalProps {
    store: Store;
    onComplete: () => void;
}

export function WelcomeModal({ store, onComplete }: WelcomeModalProps) {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);

    // If user hasn't clicked "Start", show the welcome greeting
    if (!started) {
        return (
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 text-primary">
                            <Rocket className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-center text-2xl">¡Bienvenido a tu Tienda!</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Gracias por elegirnos. Estamos aquí para ayudarte a configurar tu tienda online profesional en pocos minutos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-center text-sm text-muted-foreground">
                        <p>Te guiaremos paso a paso para:</p>
                        <ul className="list-disc list-inside text-left mx-auto max-w-[200px] space-y-1">
                            <li>Configurar tu marca</li>
                            <li>Personalizar tu diseño</li>
                            <li>Definir tus envíos</li>
                            <li>Crear tu primer producto</li>
                        </ul>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button size="lg" className="w-full sm:w-auto" onClick={() => setStarted(true)}>
                            Comenzar Configuración
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // If started, show StepBasicInfo inside the modal
    const handleBasicInfoComplete = async () => {
        // StepBasicInfo saves data itself. We just need to advance the step here.
        setLoading(true);
        try {
            // Update step to 1 (Design)
            await updateDoc(doc(db, "stores", store.id), {
                onboardingStatus: 1
            });
            onComplete(); // Tells parent to trigger redirect
        } catch (error) {
            console.error(error);
            toast.error("Error al avanzar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Información Básica</DialogTitle>
                    <DialogDescription>
                        Comencemos con lo esencial de tu marca.
                    </DialogDescription>
                </DialogHeader>
                <StepBasicInfo store={store} onComplete={handleBasicInfoComplete} loading={loading} />
            </DialogContent>
        </Dialog>
    );
}
