"use client";

import { useState } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    onRemove: (url: string) => void;
    disabled?: boolean;
    folder?: string;
}

export function ImageUpload({ value, onChange, onRemove, disabled, folder = "uploads" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uniqueId = crypto.randomUUID();
        const storageRef = ref(storage, `${folder}/${uniqueId}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // You can handle progress here if needed
            },
            (error) => {
                toast.error("Error al subir la imagen");
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                onChange(downloadURL);
                setIsUploading(false);
                toast.success("Imagen subida correctamente");
            }
        );
    };

    const onDelete = async () => {
        onRemove(value);
    };

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border bg-muted flex items-center justify-center group">
                {value ? (
                    <>
                        <Image
                            fill
                            src={value}
                            alt="Upload"
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                onClick={onDelete}
                                variant="destructive"
                                size="icon"
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
            </div>

            <div>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled || isUploading}
                    onClick={() => document.getElementById("image-upload")?.click()}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        "Subir Logo"
                    )}
                </Button>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onUpload}
                    disabled={disabled || isUploading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG o WEBP. Máx 2MB.
                </p>
            </div>
        </div>
    );
}
