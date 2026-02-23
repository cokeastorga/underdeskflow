import Link from "next/link";
import Image from "next/image";
import { Shirt, Watch, Home, Smartphone, Footprints, Glasses } from "lucide-react";

interface Category {
    id: string;
    name: string;
    icon?: any;
    image: string;
    slug: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    {
        id: "1",
        name: "Moda Mujer",
        icon: Shirt,
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2071&auto=format&fit=crop",
        slug: "women",
    },
    {
        id: "2",
        name: "Moda Hombre",
        icon: Shirt,
        image: "https://images.unsplash.com/photo-1488161628813-99c974c5c28e?q=80&w=2069&auto=format&fit=crop",
        slug: "men",
    },
    {
        id: "3",
        name: "Tecnología",
        icon: Smartphone,
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop",
        slug: "electronics",
    },
    {
        id: "4",
        name: "Hogar",
        icon: Home,
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop",
        slug: "home",
    },
    {
        id: "5",
        name: "Zapatos",
        icon: Footprints,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
        slug: "shoes",
    },
    {
        id: "6",
        name: "Accesorios",
        icon: Glasses,
        image: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=2000&auto=format&fit=crop",
        slug: "accessories",
    },
];

export function CategoryNav({ storeId, categories = [], template = "modern" }: { storeId: string; categories?: Category[]; template?: "modern" | "minimal" | "bold" }) {
    const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

    const styles = {
        modern: {
            // Elegant Grid with soft shadows
            title: "text-3xl font-bold mb-8 font-serif text-center",
            grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6",
            card: "group flex flex-col items-center justify-center gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100",
            imageContainer: "relative w-24 h-24 rounded-full overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500",
            text: "font-semibold text-gray-800 group-hover:text-primary transition-colors text-base"
        },
        minimal: {
            // Editorial Style - No background, focus on image and typography
            title: "text-2xl font-light mb-10 text-center uppercase tracking-[0.2em]",
            grid: "grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-8",
            card: "group flex flex-col items-center gap-3",
            imageContainer: "relative w-full aspect-square md:w-32 md:h-32 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 ease-out",
            text: "text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black mt-2 border-b border-transparent group-hover:border-black transition-all pb-1"
        },
        bold: {
            // High Fashion / Streetwear Tiles
            title: "text-4xl md:text-5xl font-black mb-10 border-b-4 border-black inline-block uppercase italic transform -rotate-1",
            grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4",
            card: "group relative flex flex-col items-center justify-center p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
            imageContainer: "relative w-20 h-20 mb-2 rounded-none bg-yellow-300 border-2 border-black overflow-hidden",
            text: "text-sm font-black uppercase tracking-tighter bg-black text-white px-2 py-1 transform skew-x-[-10deg] group-hover:skew-x-0 transition-transform"
        }
    };

    const currentStyle = styles[template] || styles.modern;

    return (
        <section className={`py-16 md:py-24 ${template === 'modern' ? 'bg-gray-50/50' : 'bg-white'}`}>
            <div className="container">
                <div className={template === 'bold' ? 'text-left' : 'text-center'}>
                    <h2 className={currentStyle.title}>Explorar Categorías</h2>
                </div>

                <div className={currentStyle.grid}>
                    {activeCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/${storeId}/products?category=${cat.slug}`}
                            className={currentStyle.card}
                        >
                            <div className={currentStyle.imageContainer}>
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    className={`object-cover ${template === 'bold' ? 'mix-blend-multiply' : ''}`}
                                />
                            </div>
                            <span className={currentStyle.text}>
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
