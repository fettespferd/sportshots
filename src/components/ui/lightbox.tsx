"use client";

import { useEffect } from "react";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  photoId?: string;
  bibNumber?: string | null;
  price?: number;
  takenAt?: string | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  isInCart?: boolean;
  onAddToCart?: (photoId: string) => void;
  onRemoveFromCart?: (photoId: string) => void;
}

export function Lightbox({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt = "",
  photoId,
  bibNumber,
  price,
  takenAt,
  cameraMake,
  cameraModel,
  isInCart = false,
  onAddToCart,
  onRemoveFromCart
}: LightboxProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Schließen"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image */}
      <div className="relative z-10 max-h-[90vh] max-w-[90vw]">
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Photo info overlay */}
        {(bibNumber || price !== undefined || takenAt || cameraMake) && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {bibNumber && (
                <div className="rounded-lg bg-black/70 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  #{bibNumber}
                </div>
              )}
              {price !== undefined && (
                <div className="rounded-lg bg-black/70 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  {price.toFixed(2)} €
                </div>
              )}
            </div>
            {/* Metadata info */}
            {(takenAt || cameraMake) && (
              <div className="rounded-lg bg-black/70 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
                {takenAt && (
                  <div>
                    📅 {new Date(takenAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {(cameraMake || cameraModel) && (
                  <div className="mt-1">
                    📷 {cameraMake} {cameraModel}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add to cart button */}
      {photoId && (onAddToCart || onRemoveFromCart) && (
        <div className="absolute bottom-4 right-4 z-10">
          {isInCart ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCart?.(photoId);
              }}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-red-700 hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Aus Warenkorb entfernen</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(photoId);
              }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-green-700 hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Zum Warenkorb hinzufügen</span>
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm text-white/70">
        Klicke außerhalb oder drücke ESC zum Schließen
      </div>
    </div>
  );
}

