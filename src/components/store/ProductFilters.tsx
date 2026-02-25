"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Category } from "@/types";
import { Store } from "@/types/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface FilterConfig {
    price: boolean;
    categories: boolean;
    brands: boolean;
    attributes: boolean;
}

export function ProductFilters({ storeId }: { storeId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [config, setConfig] = useState<FilterConfig>({ price: true, categories: true, brands: false, attributes: false });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const currentCategory = searchParams.get("category");
    const currentSize = searchParams.get("size");

    useEffect(() => {
        if (!storeId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Store Config
                const storeRef = doc(db, "stores", storeId);
                const storeSnap = await getDoc(storeRef);
                if (storeSnap.exists()) {
                    const storeData = storeSnap.data() as Store;
                    if (storeData.design?.productFilters) {
                        setConfig({
                            price: storeData.design.productFilters.enablePriceRange,
                            categories: storeData.design.productFilters.enableCategories,
                            brands: storeData.design.productFilters.enableBrands,
                            attributes: storeData.design.productFilters.enableAttributes,
                        });
                    }
                }

                // 2. Fetch Categories
                const catQuery = query(collection(db, "categories"), where("storeId", "==", storeId));
                const catSnap = await getDocs(catQuery);
                const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
                setCategories(cats);

            } catch (error) {
                console.error("Error fetching filters data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId]);

    const handleCategoryChange = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId === currentCategory) {
            params.delete("category");
        } else {
            params.set("category", categoryId);
        }
        router.push(`/${storeId}/products?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push(`/${storeId}/products`);
    };

    const FilterSection = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <div className="py-6 border-b border-zinc-100 last:border-0">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full group focus:outline-none"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-black transition-colors">
                        {title}
                    </span>
                    {isOpen ? <ChevronUp className="h-3 w-3 text-zinc-400" /> : <ChevronDown className="h-3 w-3 text-zinc-400" />}
                </button>
                {isOpen && (
                    <div className="pt-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const FilterContent = () => (
        <div className="flex flex-col">
            {(currentCategory || currentSize) && (
                <div className="pb-6 mb-6 border-b flex flex-wrap gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-600 px-0"
                    >
                        Limpiar Todo
                    </Button>
                </div>
            )}

            {config.categories && categories.length > 0 && (
                <FilterSection title="Categorías">
                    <div className="flex flex-col gap-3">
                        {categories.map((cat) => {
                            const isSelected = currentCategory === cat.slug || currentCategory === cat.name;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.slug || cat.name || "")}
                                    className={`flex items-center justify-between text-left transition-all duration-200 group ${isSelected ? "text-black" : "text-zinc-500 hover:text-black"
                                        }`}
                                >
                                    <span className={`text-sm tracking-tight ${isSelected ? "font-bold" : "font-medium"}`}>
                                        {cat.name}
                                    </span>
                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}

            {config.price && (
                <FilterSection title="Rango de Precio">
                    <div className="space-y-6 px-1">
                        <Slider
                            defaultValue={[0, 1000000]}
                            max={1000000}
                            step={1000}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            onValueCommit={(value) => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.set("minPrice", value[0].toString());
                                params.set("maxPrice", value[1].toString());
                                router.push(`/${storeId}/products?${params.toString()}`);
                            }}
                            className="py-4"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-zinc-400">Desde</span>
                                <span className="text-sm font-black">${priceRange[0].toLocaleString()}</span>
                            </div>
                            <div className="h-px w-4 bg-zinc-200 mt-3" />
                            <div className="flex flex-col text-right">
                                <span className="text-[9px] uppercase font-bold text-zinc-400">Hasta</span>
                                <span className="text-sm font-black">${priceRange[1].toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </FilterSection>
            )}

            {config.brands && (
                <FilterSection title="Marcas">
                    <p className="text-xs text-muted-foreground font-serif italic">Próximamente piezas exclusivas.</p>
                </FilterSection>
            )}

            {config.attributes && (
                <FilterSection title="Talla / Dimensión">
                    <div className="grid grid-cols-4 gap-2">
                        {['XS', 'S', 'M', 'L', 'XL'].map(size => {
                            const isSelected = searchParams.get("size") === size;
                            return (
                                <button
                                    key={size}
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams.toString());
                                        if (isSelected) params.delete("size");
                                        else params.set("size", size);
                                        router.push(`/${storeId}/products?${params.toString()}`);
                                    }}
                                    className={`relative h-10 flex items-center justify-center text-xs font-bold transition-all duration-300 border rounded-none ${isSelected
                                            ? "bg-black text-white border-black"
                                            : "hover:border-black text-zinc-400 hover:text-black"
                                        }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </FilterSection>
            )}
        </div>
    );

    if (loading) return (
        <div className="space-y-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                    <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-zinc-50 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative">
            {/* Desktop Filters */}
            <div className="hidden lg:block">
                <div className="sticky top-32 space-y-8">
                    <div className="flex items-center justify-between pb-6 border-b border-black">
                        <h2 className="font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                            Refinar Selección
                        </h2>
                    </div>
                    <FilterContent />

                    <div className="pt-12">
                        <div className="p-6 bg-zinc-50 border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Asistencia</p>
                            <p className="text-sm font-serif italic text-zinc-600 mb-4 font-medium">¿Necesitas ayuda con tu elección?</p>
                            <Button variant="link" className="p-0 h-auto text-xs font-bold uppercase tracking-wider text-black">
                                Contactar Personal Shopper
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full h-12 rounded-none border-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all">
                            <Filter className="mr-2 h-3 w-3" /> Filtrar Colección
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full sm:w-[400px] p-0 border-none">
                        <div className="h-full flex flex-col">
                            <SheetHeader className="p-8 border-b border-zinc-100 text-left">
                                <SheetTitle className="text-xs font-bold uppercase tracking-[0.3em]">Filtros</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto px-8 py-4">
                                <FilterContent />
                            </div>
                            <div className="p-8 border-t border-zinc-100">
                                <Button
                                    className="w-full h-12 rounded-none bg-black text-white text-xs font-bold uppercase tracking-widest"
                                    onClick={() => { }} // Placeholder to close or apply
                                >
                                    Ver Resultados
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
