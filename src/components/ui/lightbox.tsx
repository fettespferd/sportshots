"use client";

import { useEffect } from "react";
import { ShareButton } from "./share-button";

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
  rotation?: number;
  isInCart?: boolean;
  onAddToCart?: (photoId: string) => void;
  onRemoveFromCart?: (photoId: string) => void;
  showShare?: boolean;
  shareUrl?: string;
  shareTitle?: string;
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
  rotation = 0,
  isInCart = false,
  onAddToCart,
  onRemoveFromCart,
  showShare = false,
  shareUrl = "",
  shareTitle = "Foto teilen"
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

      {/* Action buttons */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        {showShare && shareUrl && (
          <div className="rounded-full bg-white/20 backdrop-blur-md shadow-lg ring-1 ring-white/30">
            <ShareButton
              url={shareUrl}
              title={shareTitle}
              text={shareTitle}
              variant="icon"
              className="p-3 text-white hover:bg-white/30"
            />
          </div>
        )}
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
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
      </div>

      {/* Image - Mobile optimized */}
      <div className="relative z-10 flex h-[75vh] w-full max-w-[95vw] items-center justify-center sm:h-[85vh] sm:max-w-[90vw]">
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform duration-300"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Photo info overlay - Mobile optimized */}
        {(bibNumber || price !== undefined || takenAt || cameraMake) && (
          <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 sm:bottom-4 sm:left-4 sm:gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {bibNumber && (
                <div className="rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">
                  #{bibNumber}
                </div>
              )}
              {price !== undefined && (
                <div className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">
                  {price.toFixed(2)} €
                </div>
              )}
            </div>
            {/* Metadata info - Hidden on mobile */}
            {(takenAt || cameraMake) && (
              <div className="hidden rounded-lg bg-black/80 px-3 py-2 text-xs text-white/90 backdrop-blur-sm sm:block">
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

      {/* Add to cart button - Mobile optimized */}
      {photoId && (onAddToCart || onRemoveFromCart) && (
        <div className="absolute bottom-2 right-2 z-10 sm:bottom-4 sm:right-4">
          {isInCart ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCart?.(photoId);
              }}
              className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700 sm:gap-2 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Aus Warenkorb entfernen</span>
              <span className="sm:hidden">Entfernen</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(photoId);
              }}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-green-700 sm:gap-2 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Zum Warenkorb hinzufügen</span>
              <span className="sm:hidden">Hinzufügen</span>
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

