"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SizeGuideModalProps {
    category: string;
}

// Static Size Data (Could be moved to DB later)
const SIZE_DATA: Record<string, any> = {
    "Tops": {
        cm: [
            { size: "XS", chest: "80-84", waist: "60-64", hips: "86-90" },
            { size: "S", chest: "84-88", waist: "64-68", hips: "90-94" },
            { size: "M", chest: "88-92", waist: "68-72", hips: "94-98" },
            { size: "L", chest: "92-96", waist: "72-76", hips: "98-102" },
            { size: "XL", chest: "96-100", waist: "76-80", hips: "102-106" },
        ],
        in: [
            { size: "XS", chest: "31-33", waist: "23-25", hips: "33-35" },
            { size: "S", chest: "33-35", waist: "25-27", hips: "35-37" },
            { size: "M", chest: "35-36", waist: "27-28", hips: "37-39" },
            { size: "L", chest: "36-38", waist: "28-30", hips: "39-40" },
            { size: "XL", chest: "38-40", waist: "30-31", hips: "40-42" },
        ]
    },
    "Bottoms": {
        cm: [
            { size: "XS", waist: "60-64", hips: "86-90", length: "76" },
            { size: "S", waist: "64-68", hips: "90-94", length: "77" },
            { size: "M", waist: "68-72", hips: "94-98", length: "78" },
            { size: "L", waist: "72-76", hips: "98-102", length: "79" },
            { size: "XL", waist: "76-80", hips: "102-106", length: "80" },
        ],
        in: [
            { size: "XS", waist: "23-25", hips: "33-35", length: "30" },
            { size: "S", waist: "25-27", hips: "35-37", length: "30.5" },
            { size: "M", waist: "27-28", hips: "37-39", length: "31" },
            { size: "L", waist: "28-30", hips: "39-40", length: "31.5" },
            { size: "XL", waist: "30-31", hips: "40-42", length: "32" },
        ]
    },
    "General": {
        cm: [
            { size: "XS", chest: "80-84", waist: "60-64" },
            { size: "S", chest: "84-88", waist: "64-68" },
            { size: "M", chest: "88-92", waist: "68-72" },
            { size: "L", chest: "92-96", waist: "72-76" },
        ],
        in: [
            { size: "XS", chest: "31-33", waist: "23-25" },
            { size: "S", chest: "33-35", waist: "25-27" },
            { size: "M", chest: "35-36", waist: "27-28" },
            { size: "L", chest: "36-38", waist: "28-30" },
        ]
    }
};

export function SizeGuideModal({ category }: SizeGuideModalProps) {
    // Determine which chart to show based on basic string matching
    // In a real app, this would be more robust or passed from DB
    const chartKey = Object.keys(SIZE_DATA).find(k => category.includes(k)) || "General";
    const data = SIZE_DATA[chartKey];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs underline decoration-dotted underline-offset-4">
                    <Ruler className="w-3.5 h-3.5 mr-1.5" />
                    Size Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Size Guide - {chartKey}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="cm" className="w-full mt-4">
                    <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                        <TabsTrigger value="cm">CM</TabsTrigger>
                        <TabsTrigger value="in">IN</TabsTrigger>
                    </TabsList>

                    {["cm", "in"].map((unit) => (
                        <TabsContent key={unit} value={unit} className="mt-6">
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Size</th>
                                            {Object.keys(data[unit][0]).filter(k => k !== 'size').map(key => (
                                                <th key={key} className="px-6 py-4 capitalize">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data[unit].map((row: any, i: number) => (
                                            <tr key={i} className="bg-white hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold">{row.size}</td>
                                                {Object.keys(row).filter(k => k !== 'size').map(key => (
                                                    <td key={key} className="px-6 py-4">{row[key]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                * Measurements are for body recommendations, not garment dimensions.
                            </p>
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
