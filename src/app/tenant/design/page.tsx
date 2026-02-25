"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Store, CarouselSlide, PromoBanner } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save, LayoutGrid, CreditCard, Store as StoreIcon, Smartphone, Monitor, Plus, Trash2, Palette, Type, LayoutTemplate, Megaphone, Layers, Filter, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingGuide } from "@/components/tenant/guides/FloatingGuide";

const DEFAULT_SECTIONS = [
    { id: "hero", type: "hero", title: "Hero Banner", enabled: true, order: 0 },
    { id: "featured", type: "featured-products", title: "Productos Destacados", enabled: true, order: 1 },
    { id: "categories", type: "categories", title: "Categorías", enabled: true, order: 2 },
    { id: "benefits", type: "benefits", title: "Beneficios", enabled: true, order: 3 },
    { id: "newsletter", type: "newsletter", title: "Newsletter", enabled: true, order: 4 },
];

export default function DesignPage() {
    const { storeId } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    // Form State
    const [template, setTemplate] = useState<"modern" | "minimal" | "bold">("modern");
    const [gridColumns, setGridColumns] = useState<3 | 4 | 6>(4);
    const [logo, setLogo] = useState("");
    const [favicon, setFavicon] = useState("");
    const [customCSS, setCustomCSS] = useState("");

    // Contact & Social
    const [contactEmail, setContactEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [socialLinks, setSocialLinks] = useState({
        instagram: "",
        facebook: "",
        twitter: "",
        tiktok: "",
        whatsapp: ""
    });

    // Style
    const [primaryColor, setPrimaryColor] = useState("#000000");
    const [secondaryColor, setSecondaryColor] = useState("#ffffff");
    const [headingFont, setHeadingFont] = useState("Inter");
    const [bodyFont, setBodyFont] = useState("Inter");

    // Layout
    const [headerLayout, setHeaderLayout] = useState<"left" | "center">("left");
    const [showHeaderSearch, setShowHeaderSearch] = useState(true);
    const [footerLayout, setFooterLayout] = useState<"simple" | "columns">("simple");
    const [showFooterSocial, setShowFooterSocial] = useState(true);

    // Announcement Bar
    const [announcementText, setAnnouncementText] = useState("Envío gratis en compras sobre $50.000");
    const [announcementActive, setAnnouncementActive] = useState(true);
    const [announcementBg, setAnnouncementBg] = useState("#000000");
    const [announcementColor, setAnnouncementColor] = useState("#ffffff");

    // Card Style
    const [showSubtitle, setShowSubtitle] = useState(true);
    const [shadow, setShadow] = useState<"none" | "sm" | "md">("sm");
    const [showPrice, setShowPrice] = useState(true);
    const [border, setBorder] = useState(false);
    const [hoverEffect, setHoverEffect] = useState<"none" | "zoom" | "lift">("zoom");
    const [buttonStyle, setButtonStyle] = useState<"solid" | "outline" | "text">("solid");

    // Carousel & Banners
    const [slides, setSlides] = useState<CarouselSlide[]>([]);
    const [banners, setBanners] = useState<PromoBanner[]>([]);

    // Sections & Filters
    const [homeSections, setHomeSections] = useState<any[]>(DEFAULT_SECTIONS);
    const [filters, setFilters] = useState({
        price: true,
        categories: true,
        brands: true,
        attributes: false
    });

    // About Page State
    const [aboutTitle, setAboutTitle] = useState("");
    const [aboutDescription, setAboutDescription] = useState("");
    const [aboutMission, setAboutMission] = useState("");
    const [aboutVision, setAboutVision] = useState("");
    const [aboutImage1, setAboutImage1] = useState("");
    const [aboutImage2, setAboutImage2] = useState("");
    const [aboutValues, setAboutValues] = useState<{ id: string, title: string, description: string }[]>([]);

    // Help Center State
    const [helpEnabled, setHelpEnabled] = useState(true);
    const [helpCategories, setHelpCategories] = useState<any[]>([]);
    const [helpFaqs, setHelpFaqs] = useState<any[]>([]);

    // Checkout Config State
    const [allowCartDrawer, setAllowCartDrawer] = useState(true);
    const [currencySymbol, setCurrencySymbol] = useState("$");
    const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
    const [showStockGuards, setShowStockGuards] = useState(true);

    const [previewPage, setPreviewPage] = useState<'home' | 'about' | 'help'>('home');

    useEffect(() => {
        if (!storeId) return;
        const fetchStore = async () => {
            try {
                const docRef = doc(db, "stores", storeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Store;
                    setStore(data);

                    // Basic Info & Contact
                    if (data.logo) setLogo(data.logo);
                    if (data.favicon) setFavicon(data.favicon);
                    if (data.contactEmail) setContactEmail(data.contactEmail);
                    if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
                    if (data.address) setAddress(data.address);
                    if (data.socialLinks) setSocialLinks({
                        instagram: data.socialLinks.instagram || "",
                        facebook: data.socialLinks.facebook || "",
                        twitter: data.socialLinks.twitter || "",
                        tiktok: data.socialLinks.tiktok || "",
                        whatsapp: data.socialLinks.whatsapp || ""
                    });

                    if (data.design) {
                        setTemplate(data.design.template || "modern");
                        setGridColumns(data.design.gridColumns || 4);
                        if (data.design.customCSS) setCustomCSS(data.design.customCSS);

                        // Colors & Typography
                        if (data.design.colors) {
                            setPrimaryColor(data.design.colors.primary);
                            setSecondaryColor(data.design.colors.secondary);
                        }
                        if (data.design.typography) {
                            setHeadingFont(data.design.typography.headingFont);
                            setBodyFont(data.design.typography.bodyFont);
                        }

                        // Layout
                        if (data.design.header) {
                            setHeaderLayout(data.design.header.layout);
                            setShowHeaderSearch(data.design.header.showSearch);
                        }
                        if (data.design.footer) {
                            setFooterLayout(data.design.footer.layout);
                            setShowFooterSocial(data.design.footer.showSocial);
                        }
                        if (data.design.announcementBar) {
                            setAnnouncementText(data.design.announcementBar.text);
                            setAnnouncementActive(data.design.announcementBar.active);
                            setAnnouncementBg(data.design.announcementBar.backgroundColor);
                            setAnnouncementColor(data.design.announcementBar.textColor);
                        }

                        // Card Style
                        if (data.design.cardStyle) {
                            setShowSubtitle(data.design.cardStyle.showSubtitle);
                            setShadow(data.design.cardStyle.shadow);
                            setShowPrice(data.design.cardStyle.showPrice ?? true);
                            setBorder(data.design.cardStyle.border ?? false);
                            setHoverEffect(data.design.cardStyle.hoverEffect || "zoom");
                            setButtonStyle(data.design.cardStyle.buttonStyle || "solid");
                        }

                        setSlides(data.design.heroCarousel || []);
                        setBanners(data.design.promoBanners || []);

                        if (data.design.homeSections) {
                            setHomeSections(data.design.homeSections);
                        }

                        if (data.design.productFilters) {
                            setFilters({
                                price: data.design.productFilters.enablePriceRange,
                                categories: data.design.productFilters.enableCategories,
                                brands: data.design.productFilters.enableBrands,
                                attributes: data.design.productFilters.enableAttributes
                            });
                        }
                    }

                    if (data.aboutPage) {
                        setAboutTitle(data.aboutPage.title || "");
                        setAboutDescription(data.aboutPage.description || "");
                        setAboutMission(data.aboutPage.mission || "");
                        setAboutVision(data.aboutPage.vision || "");
                        setAboutImage1(data.aboutPage.image1 || "");
                        setAboutImage2(data.aboutPage.image2 || "");
                        setAboutValues(data.aboutPage.values || []);
                    }

                    if (data.helpCenter) {
                        setHelpEnabled(data.helpCenter.enabled ?? true);
                        setHelpCategories(data.helpCenter.categories || []);
                        setHelpFaqs(data.helpCenter.faqs || []);
                    }

                    if (data.checkoutConfig) {
                        setAllowCartDrawer(data.checkoutConfig.allowCartDrawer ?? true);
                        setCurrencySymbol(data.checkoutConfig.currencySymbol || "$");
                        setMinOrderAmount(data.checkoutConfig.minOrderAmount || 0);
                        setShowStockGuards(data.checkoutConfig.showStockGuards ?? true);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar configuración.");
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [storeId]);

    const handleSave = async () => {
        if (!storeId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "stores", storeId), {
                logo,
                favicon,
                contactEmail,
                phoneNumber,
                address,
                socialLinks,
                design: {
                    template,
                    gridColumns,
                    customCSS,
                    colors: { primary: primaryColor, secondary: secondaryColor, background: "#ffffff", text: "#000000" },
                    typography: { headingFont, bodyFont },
                    header: { layout: headerLayout, showSearch: showHeaderSearch, showIcons: true },
                    footer: { layout: footerLayout, showSocial: showFooterSocial, showNewsletter: true },
                    announcementBar: { text: announcementText, active: announcementActive, backgroundColor: announcementBg, textColor: announcementColor },
                    heroCarousel: slides,
                    promoBanners: banners,
                    homeSections,
                    productFilters: {
                        enablePriceRange: filters.price,
                        enableCategories: filters.categories,
                        enableBrands: filters.brands,
                        enableAttributes: filters.attributes
                    },
                    buttonStyle
                },
                aboutPage: {
                    title: aboutTitle,
                    description: aboutDescription,
                    mission: aboutMission,
                    vision: aboutVision,
                    image1: aboutImage1,
                    image2: aboutImage2,
                    values: aboutValues
                },
                helpCenter: {
                    enabled: helpEnabled,
                    categories: helpCategories,
                    faqs: helpFaqs
                },
                checkoutConfig: {
                    allowCartDrawer,
                    currencySymbol,
                    minOrderAmount,
                    showStockGuards
                }
            });

            if (store?.onboardingStatus === 1) {
                await updateDoc(doc(db, "stores", storeId), { onboardingStatus: 2 });
            }
            toast.success("Diseño guardado correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    // Helper functions for array management (slides, banners) kept simple for brevity
    const addSlide = () => {
        setSlides([...slides, {
            id: Date.now().toString(),
            title: "Nuevo Slide",
            subtitle: "Descripción del slide",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
            ctaText: "Ver Más",
            ctaLink: "/products"
        }]);
    };
    const updateSlide = (index: number, field: string, value: string) => {
        const newSlides = [...slides];
        // @ts-ignore
        newSlides[index] = { ...newSlides[index], [field]: value };
        setSlides(newSlides);
    };
    const removeSlide = (index: number) => setSlides(slides.filter((_, i) => i !== index));

    // Preview Component
    const Preview = () => {
        // Theme Styles Mapping (Reflects Storefront Components)
        const heroStyles = {
            modern: {
                container: "flex flex-col items-center justify-center text-center p-6",
                title: "text-3xl font-bold font-serif tracking-tight",
                subtitle: "text-sm font-medium tracking-wider uppercase text-white/90",
                button: "bg-white text-black rounded-full px-6 py-2 text-sm font-semibold hover:bg-white/90",
                containerRelative: "absolute inset-0 flex items-center justify-center p-6 bg-black/30"
            },
            minimal: {
                container: "flex flex-col items-start justify-center text-left p-6 px-12",
                title: "text-3xl font-light tracking-tight",
                subtitle: "text-xs font-medium tracking-wide text-white/80",
                button: "bg-transparent border border-white text-white rounded-none px-4 py-2 text-sm font-medium hover:bg-white hover:text-black",
                containerRelative: "absolute inset-0 flex items-center justify-start p-6 bg-black/20"
            },
            bold: {
                container: "flex flex-col items-center justify-center text-center p-6 gap-2",
                title: "text-4xl font-black uppercase tracking-tighter",
                subtitle: "text-sm font-bold bg-primary text-primary-foreground px-2 py-1 transform -skew-x-12 inline-block",
                button: "bg-primary text-primary-foreground rounded-none px-6 py-3 text-sm font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all",
                containerRelative: "absolute inset-0 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            }
        };

        const categoryStyles = {
            modern: {
                card: "flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 w-24 flex-shrink-0",
                img: "w-16 h-16 bg-slate-100 rounded-full mb-2",
                title: "text-2xl font-bold font-serif mb-4"
            },
            minimal: {
                card: "flex flex-col items-center p-3 bg-transparent w-24 flex-shrink-0",
                img: "w-16 h-16 bg-slate-100 rounded-full border border-gray-200 mb-2",
                title: "text-xl font-light uppercase tracking-widest mb-4"
            },
            bold: {
                card: "flex flex-col items-center p-3 bg-white border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] w-24 flex-shrink-0",
                img: "w-16 h-16 bg-yellow-300 border-2 border-black rounded-none mb-2",
                title: "text-2xl font-black uppercase italic border-b-4 border-black inline-block mb-4"
            }
        };

        const productStyles = {
            modern: {
                card: "bg-white border rounded-lg overflow-hidden",
                info: "p-3",
                title: "font-medium"
            },
            minimal: {
                card: "bg-transparent",
                info: "pt-2",
                title: "font-normal"
            },
            bold: {
                card: "bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                info: "p-3 border-t-2 border-black",
                title: "font-bold uppercase"
            }
        };

        const currentHero = heroStyles[template] || heroStyles.modern;
        const currentCategory = categoryStyles[template] || categoryStyles.modern;
        const currentProduct = productStyles[template] || productStyles.modern;

        const renderHome = () => (
            <>
                {/* Hero */}
                {slides.length > 0 ? (
                    <div className="aspect-[16/6] md:aspect-[21/9] bg-slate-100 relative overflow-hidden group">
                        <img src={slides[0].image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className={currentHero.containerRelative}>
                            <div className={currentHero.container}>
                                <h2 className={`mb-2 text-white ${currentHero.title}`} style={{ fontFamily: headingFont }}>{slides[0].title}</h2>
                                <p className={`mb-4 text-white ${currentHero.subtitle}`}>{slides[0].subtitle}</p>
                                <button className={currentHero.button} style={template === 'bold' ? { backgroundColor: primaryColor, color: secondaryColor, borderColor: 'black' } : (template === 'modern' ? { backgroundColor: '#fff', color: '#000' } : {})}>
                                    {slides[0].ctaText}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-64 bg-slate-100 flex items-center justify-center text-muted-foreground">Hero Banner</div>
                )}

                {/* Sections */}
                <div className="p-8 space-y-12">
                    {/* Featured Categories Stub */}
                    {homeSections.find(s => s.type === 'categories')?.enabled && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className={currentCategory.title} style={{ fontFamily: headingFont }}>Categorías</h3>
                            </div>
                            <div className="flex gap-4 justify-center overflow-x-auto pb-4 scrollbar-hide">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={currentCategory.card}>
                                        <div className={currentCategory.img} />
                                        <div className="h-3 w-16 bg-slate-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Featured Products */}
                    {homeSections.find(s => s.type === 'featured-products')?.enabled && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className={currentCategory.title} style={{ fontFamily: headingFont }}>Destacados</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`${currentProduct.card} ${hoverEffect === 'zoom' ? 'hover:scale-[1.02]' : ''} transition-transform duration-300`}>
                                        <div className="aspect-[3/4] bg-slate-100 relative">
                                            {template === 'bold' && <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-1 uppercase">New</div>}
                                        </div>
                                        <div className={currentProduct.info}>
                                            <div className={`h-4 w-3/4 bg-slate-100 mb-2 rounded ${currentProduct.title}`} />
                                            <div className="h-4 w-1/4 bg-slate-100 rounded" />

                                            {template !== 'minimal' && (
                                                <div className={`mt-3 h-8 w-full bg-slate-900 rounded ${template === 'bold' ? 'rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`} />
                                            )}
                                            {template === 'minimal' && (
                                                <div className="mt-3 h-8 w-full border border-black rounded-none" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </>
        );

        const renderAbout = () => (
            <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight" style={{ fontFamily: headingFont }}>{aboutTitle || "Nuestra Historia"}</h2>
                    <p className="text-lg text-muted-foreground whitespace-pre-wrap">{aboutDescription || "Descripción de la tienda..."}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border">
                        {aboutImage1 ? <img src={aboutImage1} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Imagen 1</div>}
                    </div>
                    <div className="space-y-6">
                        {aboutMission && (
                            <div className="space-y-2">
                                <h3 className="font-bold uppercase tracking-wider text-xs text-primary" style={{ color: primaryColor }}>Nuestra Misión</h3>
                                <p className="text-muted-foreground">{aboutMission}</p>
                            </div>
                        )}
                        {aboutVision && (
                            <div className="space-y-2">
                                <h3 className="font-bold uppercase tracking-wider text-xs text-primary" style={{ color: primaryColor }}>Nuestra Visión</h3>
                                <p className="text-muted-foreground">{aboutVision}</p>
                            </div>
                        )}
                    </div>
                </div>

                {aboutValues.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12 border-t">
                        {aboutValues.map((val: any) => (
                            <div key={val.id} className="space-y-2 p-6 bg-slate-50 rounded-xl border border-slate-100 italic">
                                <h4 className="font-bold">{val.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{val.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );

        const renderHelp = () => (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="bg-slate-50 py-16 px-8 text-center border-b">
                    <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: headingFont }}>¿Cómo podemos ayudarte?</h2>
                    <div className="max-w-md mx-auto h-12 bg-white rounded-full border shadow-sm flex items-center px-4 gap-3">
                        <div className="w-4 h-4 bg-slate-200 rounded-full" />
                        <span className="text-sm text-muted-foreground">Escribe tu duda aquí...</span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {helpCategories.map((cat: any) => (
                            <div key={cat.id} className="p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <div className="w-6 h-6 bg-primary" style={{ backgroundColor: primaryColor, opacity: 0.5, borderRadius: '4px' }} />
                                </div>
                                <h3 className="font-bold mb-2">{cat.title}</h3>
                                <p className="text-xs text-muted-foreground mb-4">{cat.description || "Información de ayuda..."}</p>
                                <div className="h-0.5 w-full bg-slate-100" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 max-w-2xl mx-auto space-y-6">
                        <h3 className="text-xl font-bold text-center">Preguntas Frecuentes</h3>
                        <div className="space-y-4">
                            {helpFaqs.map((faq: any) => (
                                <div key={faq.id} className="p-4 border rounded-xl bg-white">
                                    <p className="font-bold text-sm mb-2">{faq.question}</p>
                                    <p className="text-xs text-muted-foreground">{faq.answer || "Cargando respuesta..."}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="bg-white dark:bg-zinc-950 h-full flex flex-col font-sans" style={{ fontFamily: bodyFont }}>
                {/* Announcement Bar */}
                {announcementActive && (
                    <div style={{ backgroundColor: announcementBg, color: announcementColor }} className="py-2 px-4 text-center text-xs font-medium">
                        {announcementText}
                    </div>
                )}

                {/* Header */}
                <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <div className={`p-4 flex items-center ${headerLayout === 'center' ? 'justify-center relative' : 'justify-between'}`}>
                        <div className="flex items-center gap-2">
                            {logo ? (
                                <img src={logo} alt="Store Logo" className="h-8 object-contain" />
                            ) : (
                                <div className="font-bold text-xl" style={{ fontFamily: headingFont }}>STORE</div>
                            )}
                        </div>

                        {headerLayout === 'center' && (
                            <div className="absolute right-4 flex gap-3">
                                {showHeaderSearch && <div className="w-5 h-5 bg-slate-200 rounded-full" />}
                                <div className="w-5 h-5 bg-slate-200 rounded-full" />
                            </div>
                        )}
                        {headerLayout === 'left' && (
                            <div className="flex gap-3">
                                {showHeaderSearch && <div className="w-5 h-5 bg-slate-200 rounded-full" />}
                                <div className="w-5 h-5 bg-slate-200 rounded-full" />
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {previewPage === 'home' && renderHome()}
                    {previewPage === 'about' && renderAbout()}
                    {previewPage === 'help' && renderHelp()}
                </div>

                {/* Footer */}
                <footer className="bg-slate-900 text-slate-300 py-8 px-6 text-sm">
                    <div className={`grid gap-8 ${footerLayout === 'columns' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 text-center'}`}>
                        <div>
                            {logo ? (
                                <img src={logo} alt="Store Logo" className="h-6 object-contain mb-4 grayscale brightness-200" />
                            ) : (
                                <div className="font-bold text-white mb-4">STORE</div>
                            )}
                            <p className="text-xs opacity-70">© 2024 {store?.name || "Store Inc."}</p>
                            {address && <p className="text-xs opacity-50 mt-2">{address}</p>}
                            {contactEmail && <p className="text-xs opacity-50">{contactEmail}</p>}
                        </div>
                        {footerLayout === 'columns' && (
                            <>
                                <div className="space-y-2">
                                    <div className="h-2 w-20 bg-slate-800 rounded" />
                                    <div className="h-2 w-24 bg-slate-800 rounded" />
                                </div>
                                <div>
                                    {showFooterSocial && (
                                        <div className="flex gap-2">
                                            {socialLinks.instagram && <div className="w-6 h-6 bg-slate-800 rounded-full" title="Instagram" />}
                                            {socialLinks.facebook && <div className="w-6 h-6 bg-slate-800 rounded-full" title="Facebook" />}
                                            {socialLinks.whatsapp && <div className="w-6 h-6 bg-slate-800 rounded-full" title="WhatsApp" />}
                                            {!socialLinks.instagram && !socialLinks.facebook && !socialLinks.whatsapp && (
                                                <>
                                                    <div className="w-6 h-6 bg-slate-800 rounded-full" />
                                                    <div className="w-6 h-6 bg-slate-800 rounded-full" />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </footer>
            </div>
        );
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-0 overflow-hidden bg-background">
            {/* Left Sidebar - Controls */}
            <div className="w-full md:w-[400px] flex flex-col border-r bg-background/50 backdrop-blur-sm z-20 shadow-xl">
                <div className="p-4 border-b flex justify-between items-center bg-background">
                    <h1 className="font-bold text-lg">Editor de Tienda</h1>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => {
                            setActiveTab(v);
                            if (v === 'about') setPreviewPage('about');
                            else if (v === 'advanced') setPreviewPage('help');
                            else if (v === 'general' || v === 'content' || v === 'design') setPreviewPage('home');
                        }}
                        className="w-full"
                    >
                        <div className="px-4 py-2 border-b bg-background sticky top-0 z-10 overflow-x-auto hide-scrollbar">
                            <TabsList className="h-9 w-max">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="content">Contenido</TabsTrigger>
                                <TabsTrigger value="about">Nosotros</TabsTrigger>
                                <TabsTrigger value="design">Diseño</TabsTrigger>
                                <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 py-6 space-y-6">
                            {/* GENERAL TAB */}
                            <TabsContent value="general" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Logo URL</Label>
                                        <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
                                        <p className="text-xs text-muted-foreground">Recomendado: PNG transparente</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Favicon URL</Label>
                                        <Input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-medium text-sm">Información de Contacto</h3>
                                    <div className="space-y-2">
                                        <Label>Email Público</Label>
                                        <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Teléfono / WhatsApp</Label>
                                        <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dirección</Label>
                                        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-medium text-sm">Redes Sociales</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Input placeholder="Instagram URL" value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} />
                                        <Input placeholder="Facebook URL" value={socialLinks.facebook} onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })} />
                                        <Input placeholder="WhatsApp URL" value={socialLinks.whatsapp} onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })} />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* DESIGN TAB (Old Style + Layout) */}
                            <TabsContent value="design" className="mt-0 space-y-6">
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Plantilla</Label>
                                    <RadioGroup value={template} onValueChange={(v) => setTemplate(v as any)} className="grid grid-cols-3 gap-2">
                                        {['modern', 'minimal', 'bold'].map((t) => (
                                            <Label key={t} className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-accent transition-all ${template === t ? 'border-primary bg-primary/5' : 'border-transparent bg-muted'}`}>
                                                <RadioGroupItem value={t} id={t} className="sr-only" />
                                                <span className="capitalize font-medium text-sm">{t}</span>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Colors & Type */}
                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Paleta de Colores</Label>

                                    {/* Color Presets */}
                                    <div className="grid grid-cols-5 gap-2 mb-4">
                                        {[
                                            { name: "Lujo", p: "#000000", s: "#ffffff" },
                                            { name: "Gold", p: "#D4AF37", s: "#000000" },
                                            { name: "Earth", p: "#5D5C61", s: "#F5F5F5" },
                                            { name: "Navy", p: "#1A237E", s: "#ffffff" },
                                            { name: "Forest", p: "#1B5E20", s: "#F1F8E9" },
                                        ].map((preset) => (
                                            <button
                                                key={preset.name}
                                                className="flex flex-col items-center gap-1 group"
                                                onClick={() => {
                                                    setPrimaryColor(preset.p);
                                                    setSecondaryColor(preset.s);
                                                    toast.success(`Paleta ${preset.name} aplicada`);
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden relative shadow-sm group-hover:scale-110 transition-transform">
                                                    <div className="absolute inset-0 w-1/2 h-full" style={{ backgroundColor: preset.p }} />
                                                    <div className="absolute inset-0 left-1/2 w-1/2 h-full" style={{ backgroundColor: preset.s }} />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
                                        <div>
                                            <Label className="text-xs">Color Principal</Label>
                                            <div className="flex gap-2 mt-1">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border shadow-sm">
                                                    <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] p-0 -top-[25%] -left-[25%] cursor-pointer border-none" />
                                                </div>
                                                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Color Secundario</Label>
                                            <div className="flex gap-2 mt-1">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border shadow-sm">
                                                    <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] p-0 -top-[25%] -left-[25%] cursor-pointer border-none" />
                                                </div>
                                                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-8 text-xs font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-xs">Tipografía</Label>
                                        <Select value={headingFont} onValueChange={setHeadingFont}>
                                            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Inter" className="font-sans">Inter (Modern)</SelectItem>
                                                <SelectItem value="Playfair Display" className="font-serif">Playfair Display (Luxury)</SelectItem>
                                                <SelectItem value="Montserrat" className="font-sans">Montserrat (Bold)</SelectItem>
                                                <SelectItem value="Lora" className="font-serif">Lora (Elegant)</SelectItem>
                                                <SelectItem value="Oswald" className="font-sans uppercase">Oswald (Urban)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Header & Layout */}
                                <div className="space-y-3 pt-4 border-t">
                                    <Label>Cabecera</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs">Alineación</Label>
                                            <Select value={headerLayout} onValueChange={(v: any) => setHeaderLayout(v)}>
                                                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="left">Izquierda</SelectItem>
                                                    <SelectItem value="center">Centro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between mt-6">
                                            <Label className="text-xs">Buscador</Label>
                                            <Switch checked={showHeaderSearch} onCheckedChange={setShowHeaderSearch} />
                                        </div>
                                    </div>
                                </div>

                                {/* Announcement Bar */}
                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex justify-between">
                                        <Label className="text-sm font-medium">Barra de Anuncios</Label>
                                        <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                                    </div>
                                    {announcementActive && (
                                        <div className="space-y-2">
                                            <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Mensaje..." />
                                            <div className="flex gap-2">
                                                <Input type="color" value={announcementBg} onChange={(e) => setAnnouncementBg(e.target.value)} className="w-full h-8 p-0" />
                                                <Input type="color" value={announcementColor} onChange={(e) => setAnnouncementColor(e.target.value)} className="w-full h-8 p-0" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* CONTENT TAB */}
                            <TabsContent value="content" className="mt-0 space-y-6">
                                {/* Home Sections */}
                                <Card>
                                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-3 h-3" /> Secciones de Inicio</CardTitle></CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {homeSections.map((section, idx) => (
                                            <div key={section.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-xs font-mono text-muted-foreground">{idx + 1}</div>
                                                    <span className="text-sm font-medium">{section.title}</span>
                                                </div>
                                                <Switch
                                                    checked={section.enabled}
                                                    onCheckedChange={(checked) => {
                                                        const newSections = [...homeSections];
                                                        newSections[idx].enabled = checked;
                                                        setHomeSections(newSections);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-3 h-3" /> Filtros</CardTitle></CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Precio</Label>
                                            <Switch checked={filters.price} onCheckedChange={(v) => setFilters({ ...filters, price: v })} />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Label>Categorías</Label>
                                            <Switch checked={filters.categories} onCheckedChange={(v) => setFilters({ ...filters, categories: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Slides Manager (Simplified) */}
                                <Card>
                                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm">Hero Slides</CardTitle>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addSlide}><Plus className="h-4 w-4" /></Button>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        {slides.map((slide, idx) => (
                                            <div key={slide.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                                                <span className="truncate w-32">{slide.title}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeSlide(idx)}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ABOUT PAGE TAB */}
                            <TabsContent value="about" className="mt-0 space-y-6">
                                <Card>
                                    <CardHeader className="py-3 px-4">
                                        <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-3 h-3" /> Página "Nosotros"</CardTitle>
                                        <CardDescription className="text-xs">Personaliza la historia y valores de tu marca.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Título Principal</Label>
                                            <Input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} placeholder="Ej: Nuestra Historia" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Descripción / Historia</Label>
                                            <Textarea value={aboutDescription} onChange={(e) => setAboutDescription(e.target.value)} placeholder="Cuéntale a tus clientes quiénes son..." />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label>Nuestra Misión</Label>
                                                <Textarea value={aboutMission} onChange={(e) => setAboutMission(e.target.value)} className="min-h-[100px]" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nuestra Visión</Label>
                                                <Textarea value={aboutVision} onChange={(e) => setAboutVision(e.target.value)} className="min-h-[100px]" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <Label>Imágenes para la página</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Imagen Principal</Label>
                                                    <Input value={aboutImage1} onChange={(e) => setAboutImage1(e.target.value)} placeholder="URL..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Imagen Secundaria</Label>
                                                    <Input value={aboutImage2} onChange={(e) => setAboutImage2(e.target.value)} placeholder="URL..." />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm">Valores de Marca</CardTitle>
                                            <CardDescription className="text-[10px]">Añade pilares que definan tu negocio.</CardDescription>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAboutValues([...aboutValues, { id: Date.now().toString(), title: "Nuevo Valor", description: "Descripción corta" }])}>
                                            <Plus className="h-3 h-3" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {aboutValues.map((val, idx) => (
                                            <div key={val.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Input
                                                        value={val.title}
                                                        onChange={(e) => {
                                                            const newVals = [...aboutValues];
                                                            newVals[idx].title = e.target.value;
                                                            setAboutValues(newVals);
                                                        }}
                                                        className="h-7 text-xs font-bold bg-transparent border-none p-0 focus-visible:ring-0"
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setAboutValues(aboutValues.filter((_, i) => i !== idx))}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    value={val.description}
                                                    onChange={(e) => {
                                                        const newVals = [...aboutValues];
                                                        newVals[idx].description = e.target.value;
                                                        setAboutValues(newVals);
                                                    }}
                                                    className="text-xs min-h-[60px]"
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ADVANCED TAB */}
                            <TabsContent value="advanced" className="mt-0 space-y-6">
                                <div className="space-y-2">
                                    <Label>Custom CSS</Label>
                                    <p className="text-xs text-muted-foreground">CSS personalizado para tu tienda. Ten cuidado.</p>
                                    <textarea
                                        className="w-full min-h-[200px] p-2 font-mono text-xs bg-slate-950 text-slate-300 rounded-md border"
                                        value={customCSS}
                                        onChange={(e) => setCustomCSS(e.target.value)}
                                        placeholder=".product-card { border: 1px solid red; }"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-medium text-sm">Configuración de Checkout</h3>
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label>Mini-Carrito (Drawer)</Label>
                                            <p className="text-[10px] text-muted-foreground">Habilita el despliegue lateral del carrito.</p>
                                        </div>
                                        <Switch checked={allowCartDrawer} onCheckedChange={setAllowCartDrawer} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label>Control de Stock</Label>
                                            <p className="text-[10px] text-muted-foreground">Evita compras sobre el stock disponible.</p>
                                        </div>
                                        <Switch checked={showStockGuards} onCheckedChange={setShowStockGuards} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Símbolo Moneda</Label>
                                            <Input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Monto Mínimo Compra</Label>
                                            <Input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-sm">Centro de Ayuda</h3>
                                        <Switch checked={helpEnabled} onCheckedChange={setHelpEnabled} />
                                    </div>

                                    {helpEnabled && (
                                        <div className="space-y-4">
                                            <div className="p-3 border rounded-lg bg-muted/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold">Categorías ({helpCategories.length})</span>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setHelpCategories([...helpCategories, { id: Date.now().toString(), title: "Nueva Categoría", description: "", links: [] }])}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {helpCategories.map((cat, idx) => (
                                                        <div key={cat.id} className="text-[10px] p-2 bg-background border rounded flex justify-between items-center">
                                                            <span>{cat.title}</span>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => setHelpCategories(helpCategories.filter((_, i) => i !== idx))}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3 border rounded-lg bg-muted/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold">FAQs ({helpFaqs.length})</span>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setHelpFaqs([...helpFaqs, { id: Date.now().toString(), question: "Nueva Pregunta", answer: "" }])}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {helpFaqs.map((faq, idx) => (
                                                        <div key={faq.id} className="text-[10px] p-2 bg-background border rounded flex justify-between items-center">
                                                            <span className="truncate w-40">{faq.question}</span>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => setHelpFaqs(helpFaqs.filter((_, i) => i !== idx))}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* Right Preview */}
            <div className="flex-1 bg-muted/20 relative flex flex-col overflow-hidden">
                {/* Preview Toolbar */}
                <div className="h-12 border-b bg-white flex items-center justify-between gap-4 px-4 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-md">
                            <button
                                onClick={() => setPreviewPage('home')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${previewPage === 'home' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => setPreviewPage('about')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${previewPage === 'about' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Nosotros
                            </button>
                            <button
                                onClick={() => setPreviewPage('help')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${previewPage === 'help' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Ayuda
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-md">
                        <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={`p-2 rounded-sm transition-all ${previewDevice === 'desktop' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Vista Escritorio"
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPreviewDevice('mobile')}
                            className={`p-2 rounded-sm transition-all ${previewDevice === 'mobile' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Vista Móvil"
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Preview Container */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-slate-50/50">
                    <div
                        className={`bg-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col border border-border/50 overflow-hidden ${previewDevice === 'mobile'
                            ? 'w-[375px] h-[750px] rounded-[3rem] border-8 border-slate-900 ring-1 ring-slate-900/5'
                            : 'w-full h-full max-w-[1200px] rounded-xl'
                            }`}
                    >
                        {previewDevice === 'desktop' && (
                            <div className="bg-slate-100 border-b p-2 flex gap-2 shrink-0">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">localhost:3000</div>
                            </div>
                        )}

                        {previewDevice === 'mobile' && (
                            <div className="bg-slate-900 text-white text-[10px] px-6 py-2 flex justify-between items-center shrink-0 rounded-t-[2.5rem]">
                                <span>9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20" />
                                    <div className="w-3 h-3 bg-white rounded-full" />
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                            <Preview />
                        </div>

                        {previewDevice === 'mobile' && (
                            <div className="bg-slate-900 h-6 shrink-0 rounded-b-[2.5rem] flex justify-center items-center">
                                <div className="w-32 h-1 bg-white/20 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
