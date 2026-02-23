"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Image as ImageIcon, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Review } from "@/types";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/fade-in";

interface ReviewsSectionProps {
    storeId: string;
    productId: string;
    productName: string;
}

export function ReviewsSection({ storeId, productId, productName }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(
                    collection(db, "reviews"),
                    where("storeId", "==", storeId),
                    where("productId", "==", productId),
                    where("status", "==", "approved"), // Only show approved reviews
                    orderBy("createdAt", "desc"),
                    limit(10)
                );
                const snapshot = await getDocs(q);
                setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [storeId, productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Por favor selecciona una calificación");
            return;
        }

        setIsSubmitting(true);
        try {
            // Check for verified purchase (Simple check by email would go here in backend)
            // For now, we default to verified false unless we implement auth check

            const reviewData: Omit<Review, "id"> = {
                storeId,
                productId,
                customerName: name,
                rating,
                comment,
                isVerifiedPurchase: false, // Pending implementation
                status: "approved", // Auto-approve for demo, normally 'pending'
                createdAt: Date.now(),
            };

            await addDoc(collection(db, "reviews"), reviewData);

            toast.success("¡Gracias por tu reseña!");
            setReviews(prev => [{ id: "temp-" + Date.now(), ...reviewData } as Review, ...prev]);
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Error al enviar reseña");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setName("");
        setComment("");
    };

    return (
        <section className="py-12 border-t mt-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Opiniones de Clientes</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "w-5 h-5",
                                        star <= (reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0)
                                            ? "fill-primary text-primary"
                                            : "fill-muted text-muted-foreground"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Baseado en {reviews.length} reseñas
                        </span>
                    </div>
                </div>
                <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
                    {showForm ? "Cancelar" : "Escribir Reseña"}
                </Button>
            </div>

            {/* Review Form */}
            {showForm && (
                <FadeIn className="mb-12 bg-muted/30 p-6 rounded-lg border">
                    <h3 className="font-semibold text-lg mb-4">Comparte tu experiencia</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Calificación</label>
                            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="focus:outline-none transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={cn(
                                                "w-8 h-8 transition-colors",
                                                star <= (hoverRating || rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tu Nombre</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tu Opinión</label>
                            <textarea
                                required
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="¿Qué te pareció el producto?"
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <span className="flex items-center gap-2">Enviando...</span> : "Publicar Reseña"}
                        </Button>
                    </form>
                </FadeIn>
            )}

            {/* Review List */}
            <div className="space-y-8">
                {loading ? (
                    <p className="text-muted-foreground">Cargando reseñas...</p>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">Aún no hay reseñas. ¡Sé el primero en opinar!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b pb-8 last:border-0">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="font-semibold">{review.customerName}</div>
                                    {review.isVerifiedPurchase && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" /> Compra Verificada
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "w-4 h-4",
                                            star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
