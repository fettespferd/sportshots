"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryImage {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  display_order: number;
}

interface GallerySettingsProps {
  profile: any;
}

interface SortableImageProps {
  image: GalleryImage;
  selectedImages: Set<string>;
  deletingId: string | null;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string, url: string) => void;
}

function SortableImage({
  image,
  selectedImages,
  deletingId,
  onToggleSelection,
  onDelete,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
    >
      <img
        src={image.thumbnail_url || image.image_url}
        alt="Gallery"
        loading="lazy"
        className="h-full w-full object-cover"
      />

      {/* Drag Handle - Always visible on mobile, hover on desktop */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-lg bg-black/60 p-3 opacity-90 backdrop-blur-sm transition-all active:scale-95 active:bg-black/80 md:opacity-0 md:group-hover:opacity-100"
        title="Ziehen zum Sortieren"
      >
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(image.id, image.image_url);
        }}
        disabled={deletingId === image.id}
        className="absolute right-2 top-2 z-10 rounded-full bg-red-600 p-2 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100 disabled:opacity-50"
        title="Löschen"
      >
        {deletingId === image.id ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>

      {/* Checkbox - Bottom Right */}
      <label
        className="absolute bottom-2 right-2 z-10 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selectedImages.has(image.id)}
          onChange={() => onToggleSelection(image.id)}
          className="h-5 w-5 cursor-pointer rounded border-2 border-white bg-white/80 text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </label>
    </div>
  );
}

export function GallerySettings({ profile }: GallerySettingsProps) {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("photographer_id", profile.id)
      .order("display_order", { ascending: true });

    if (data) {
      setImages(data);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesToUpload = Array.from(e.target.files);
    const remainingSlots = 10 - images.length;

    if (filesToUpload.length > remainingSlots) {
      setModalState({
        isOpen: true,
        title: "Limit erreicht",
        message: `Du kannst nur noch ${remainingSlots} Bild(er) hochladen. Limit: 10 Bilder.`,
        type: "warning",
      });
      return;
    }

    setUploading(true);

    try {
      let uploadedCount = 0;
      let currentDisplayOrder = images.length;

      for (const file of filesToUpload) {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `gallery/${profile.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error for", file.name, uploadError);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl: imageUrl },
        } = supabase.storage.from("photos").getPublicUrl(fileName);

        // No watermark for gallery images - use original image directly
        // Save to database
        const { error: dbError } = await supabase.from("gallery_images").insert({
          photographer_id: profile.id,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          display_order: currentDisplayOrder++,
        });

        if (dbError) {
          console.error("DB error for", file.name, dbError);
          continue;
        }

        uploadedCount++;
      }

      await loadImages();

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: `${uploadedCount} von ${filesToUpload.length} Bild(ern) erfolgreich hochgeladen!`,
        type: uploadedCount === filesToUpload.length ? "success" : "warning",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Hochladen der Bilder",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    setDeletingId(imageId);

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", imageId);

      if (dbError) throw dbError;

      // Delete from storage
      const path = imageUrl.split("/photos/").pop();
      if (path) {
        await supabase.storage.from("photos").remove([path]);
      }

      await loadImages();

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Bild erfolgreich gelöscht!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Löschen des Bildes",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return;

    setBatchDeleting(true);

    try {
      const imagesToDelete = images.filter(img => selectedImages.has(img.id));
      const imageIds = imagesToDelete.map(img => img.id);
      
      // Batch delete from database (single query)
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .in("id", imageIds);

      if (dbError) {
        throw dbError;
      }

      // Batch delete from storage
      const storagePaths = imagesToDelete
        .map(img => img.image_url.split("/photos/").pop())
        .filter(Boolean) as string[];
      
      if (storagePaths.length > 0) {
        await supabase.storage.from("photos").remove(storagePaths);
      }

      // Optimistic update - remove from local state immediately
      setImages(images.filter(img => !selectedImages.has(img.id)));
      setSelectedImages(new Set());

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: `${imageIds.length} Bild(er) erfolgreich gelöscht!`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Batch delete error:", error);
      // Reload on error to restore correct state
      await loadImages();
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Löschen der Bilder",
        type: "error",
      });
    } finally {
      setBatchDeleting(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map(img => img.id)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const newImages = arrayMove(images, oldIndex, newIndex);
    
    // Optimistic update - update UI immediately
    setImages(newImages);

    // Update display_order in database (batch update using Promise.all)
    try {
      const updates = newImages.map((img, index) => 
        supabase
          .from("gallery_images")
          .update({ display_order: index })
          .eq("id", img.id)
      );

      // Execute all updates in parallel
      await Promise.all(updates);
    } catch (error) {
      console.error("Error updating image order:", error);
      // Reload images on error to restore correct order
      await loadImages();
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Beispielbilder
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Lade bis zu 10 Beispielbilder hoch, um dein Profil zu präsentieren.
          Diese Bilder werden auf deiner öffentlichen Profilseite angezeigt.
        </p>
        <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
          💡 Das erste Bild wird automatisch als dein Profilbild verwendet.
        </p>

        {/* Upload Button */}
        {images.length < 10 && (
          <div className="mt-4">
            <label
              htmlFor="gallery-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-900 dark:border-t-transparent" />
                  <span>Lädt hoch...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Bild hochladen ({images.length}/10)</span>
                </>
              )}
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || images.length >= 10}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Batch Controls - Floating Bottom Right */}
        {selectedImages.size > 0 && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white p-3 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {selectedImages.size} ausgewählt
              </span>
              <button
                onClick={deselectAll}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
            <button
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {batchDeleting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Lösche...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Löschen</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Images Grid */}
        {images.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    selectedImages={selectedImages}
                    deletingId={deletingId}
                    onToggleSelection={toggleImageSelection}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {images.length === 0 && (
          <div className="mt-6 rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Noch keine Beispielbilder hochgeladen
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}

