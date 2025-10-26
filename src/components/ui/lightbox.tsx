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
      // Prevent scrolling and touch behaviors
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.touchAction = "none";
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.touchAction = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex touch-none items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Action buttons - Prominent Share Button on Mobile */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 sm:right-4 sm:top-4 sm:flex-row">
        {showShare && shareUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Trigger share
              if (navigator.share) {
                navigator.share({
                  title: shareTitle,
                  text: shareTitle,
                  url: shareUrl,
                }).catch(() => {
                  // Fallback to clipboard
                  navigator.clipboard.writeText(shareUrl);
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-blue-700 active:scale-95 sm:px-3 sm:py-3"
            aria-label="Teilen"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="sm:hidden">Teilen</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95"
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

      {/* Add to cart button - Centered at bottom on mobile */}
      {photoId && (onAddToCart || onRemoveFromCart) && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0">
          {isInCart ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCart?.(photoId);
              }}
              className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 hover:bg-red-700 active:scale-95 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Entfernen</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(photoId);
              }}
              className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 hover:bg-green-700 active:scale-95 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Hinzufügen</span>
            </button>
          )}
        </div>
      )}

      {/* Instructions - Hidden on mobile */}
      <div className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-sm text-white/70 sm:block">
        Klicke außerhalb oder drücke ESC zum Schließen
      </div>
    </div>
  );
}

