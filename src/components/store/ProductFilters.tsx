"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Category } from "@/types";
import { Store } from "@/types/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

    useEffect(() => {
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

    const handlePriceChange = (value: number[]) => {
        setPriceRange(value);
        // Debounce or apply on button click in real app
        // For now just local state, maybe add "Apply" button
    };

    const FilterSection = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <div className="py-4 border-b last:border-0">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full font-medium hover:text-primary transition-colors focus:outline-none"
                >
                    {title}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                    <div className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const FilterContent = () => (
        <div className="space-y-1">
            {config.categories && categories.length > 0 && (
                <FilterSection title="Categorías">
                    <div className="space-y-2">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`cat-${cat.id}`}
                                    checked={currentCategory === cat.slug || currentCategory === cat.name} // Simplified matching
                                    onCheckedChange={() => handleCategoryChange(cat.slug || cat.name)}
                                />
                                <Label
                                    htmlFor={`cat-${cat.id}`}
                                    className="text-sm font-normal cursor-pointer hover:text-primary"
                                >
                                    {cat.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </FilterSection>
            )}

            {config.price && (
                <FilterSection title="Precio">
                    <div className="space-y-4 px-1">
                        <Slider
                            defaultValue={[0, 100000]}
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
                        />
                        <div className="flex items-center justify-between text-sm">
                            <span>${priceRange[0].toLocaleString()}</span>
                            <span>${priceRange[1].toLocaleString()}</span>
                        </div>
                    </div>
                </FilterSection>
            )}

            {/* Placeholder for Brands/Attributes if enabled but no data backends yet */}
            {config.brands && (
                <FilterSection title="Marcas">
                    <p className="text-xs text-muted-foreground">No hay marcas disponibles.</p>
                </FilterSection>
            )}

            {config.attributes && (
                <FilterSection title="Talla">
                    <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL'].map(size => {
                            const isSelected = searchParams.get("size") === size;
                            return (
                                <div
                                    key={size}
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams.toString());
                                        if (isSelected) params.delete("size");
                                        else params.set("size", size);
                                        router.push(`/${storeId}/products?${params.toString()}`);
                                    }}
                                    className={`border rounded-md px-3 py-1 text-sm cursor-pointer transition-colors ${isSelected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "hover:border-black hover:bg-slate-50"
                                        }`}
                                >
                                    {size}
                                </div>
                            );
                        })}
                    </div>
                </FilterSection>
            )}
        </div>
    );

    if (loading) return <div className="w-64 space-y-4"><div className="h-8 bg-slate-100 rounded animate-pulse" /><div className="h-64 bg-slate-100 rounded animate-pulse" /></div>;

    return (
        <>
            {/* Desktop Filters */}
            <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Filter className="w-5 h-5" /> Filtros</h2>
                    <FilterContent />
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden mb-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Filter className="mr-2 h-4 w-4" /> Filtrar Productos
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[540px]">
                        <SheetHeader>
                            <SheetTitle>Filtros</SheetTitle>
                        </SheetHeader>
                        <div className="py-6 h-full overflow-y-auto">
                            <FilterContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
