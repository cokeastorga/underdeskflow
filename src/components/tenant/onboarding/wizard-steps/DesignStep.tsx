"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Palette, LayoutTemplate, Monitor, Smartphone } from "lucide-react";
import { Store } from "@/types/store";
import { toast } from "sonner";

const COLOR_PRESETS = [
    { name: "Lujo", p: "#000000", s: "#ffffff" },
    { name: "Gold", p: "#D4AF37", s: "#000000" },
    { name: "Navy", p: "#1A237E", s: "#ffffff" },
    { name: "Forest", p: "#1B5E20", s: "#F1F8E9" },
    { name: "Purple", p: "#6D28D9", s: "#ffffff" },
];

interface DesignStepProps {
    store: Store;
    onNext: (data: Partial<Store>) => void;
}

export function DesignStep({ store, onNext }: DesignStepProps) {
    const [template, setTemplate] = useState<"modern" | "minimal" | "bold">(
        (store.design?.template as any) || "modern"
    );
    const [primaryColor, setPrimaryColor] = useState(store.design?.colors?.primary || "#000000");
    const [secondaryColor, setSecondaryColor] = useState(store.design?.colors?.secondary || "#ffffff");

    const handleComplete = () => {
        onNext({
            design: {
                gridColumns: 3,
                cardStyle: {
                    showSubtitle: true,
                    showPrice: true,
                    priceSize: "md",
                    shadow: "sm",
                    border: true,
                    hoverEffect: "lift",
                    buttonStyle: "solid"
                },
                ...store.design,
                template: template,
                colors: {
                    primary: primaryColor,
                    secondary: secondaryColor,
                    background: "#ffffff",
                    text: "#000000"
                }
            }
        });
    };

    // Note: In the real app, we'd wrap this in a form but for simplicity 
    // we take the data when handleNext is called from the parent. 
    // To make it work with the parent's generic handleNext, 
    // we'll use a local state and an effect or a ref.
    // For now, I'll just expose the data.

    return (
        <div className="space-y-10">
            {/* Template Picker */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">Elige tu Estilo</h2>
                </div>
                <RadioGroup
                    value={template}
                    onValueChange={(v) => setTemplate(v as any)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {['modern', 'minimal', 'bold'].map((t) => (
                        <div key={t} className="relative">
                            <RadioGroupItem value={t} id={t} className="sr-only" />
                            <Label
                                htmlFor={t}
                                className={`flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 ${template === t ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 dark:border-zinc-800'}`}
                            >
                                <div className={`w-full aspect-video rounded-lg mb-4 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center`}>
                                    {/* Mini Preview Placeholder */}
                                    <div className="space-y-2 w-3/4">
                                        <div className="h-2 w-full bg-slate-300 dark:bg-zinc-700 rounded" />
                                        <div className="h-2 w-1/2 bg-slate-300 dark:bg-zinc-700 rounded" />
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="h-12 bg-slate-300 dark:bg-zinc-700 rounded" />
                                            <div className="h-12 bg-slate-300 dark:bg-zinc-700 rounded" />
                                        </div>
                                    </div>
                                </div>
                                <span className="capitalize font-bold text-lg">{t}</span>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    {t === 'modern' ? 'Elegante y adaptable' : t === 'minimal' ? 'Limpio y profesional' : 'Impactante y único'}
                                </p>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Color Palette */}
            <div className="space-y-6 pt-10 border-t">
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">Colores de marca</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <Label>Atajos de estilo</Label>
                        <div className="grid grid-cols-5 gap-3">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => {
                                        setPrimaryColor(preset.p);
                                        setSecondaryColor(preset.s);
                                        toast.success(`Estilo ${preset.name} aplicado`);
                                    }}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden relative group-hover:scale-110 transition-transform ring-2 ring-transparent group-hover:ring-primary/20">
                                        <div className="absolute inset-0 w-1/2 h-full" style={{ backgroundColor: preset.p }} />
                                        <div className="absolute inset-0 left-1/2 w-1/2 h-full" style={{ backgroundColor: preset.s }} />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-2xl border">
                        <div className="space-y-2">
                            <Label className="text-xs">Color Primario</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-10 h-10 p-0 rounded-full border-none cursor-pointer"
                                />
                                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Color Secundario</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-10 h-10 p-0 rounded-full border-none cursor-pointer"
                                />
                                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden hook to handle next */}
            <form id="wizard-form" onSubmit={(e) => { e.preventDefault(); handleComplete(); }} />
        </div>
    );
}
