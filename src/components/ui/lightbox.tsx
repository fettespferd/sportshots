"use client";

import { useEffect, useState } from "react";
import { ShareButton } from "./share-button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  onViewCart?: () => void;
  showShare?: boolean;
  shareUrl?: string;
  shareTitle?: string;
  editedUrl?: string | null;
  watermarkEditedUrl?: string | null;
  watermarkOriginalUrl?: string | null;
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
  onViewCart,
  showShare = false,
  shareUrl = "",
  shareTitle,
  editedUrl,
  watermarkEditedUrl,
  watermarkOriginalUrl
}: LightboxProps) {
  const { t } = useLanguage();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showEdited, setShowEdited] = useState(false);
  const [showWatermarkEdited, setShowWatermarkEdited] = useState(true); // Default to edited watermark

  useEffect(() => {
    if (isOpen) {
      // Reset to default view when opening
      setShowEdited(false);
      // Default to edited watermark if available
      setShowWatermarkEdited(!!watermarkEditedUrl);
      // Show swipe hint and hide after 3 seconds
      setShowSwipeHint(true);
      const hintTimer = setTimeout(() => {
        setShowSwipeHint(false);
      }, 3000);

      // Prevent page scrolling but allow pinch-zoom on image
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        clearTimeout(hintTimer);
        const scrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(true);
    setShowSwipeHint(false); // Hide hint immediately when user starts swiping
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentTouch = e.targetTouches[0].clientY;
    const distance = currentTouch - touchStart;
    
    // Only allow dragging down, not up
    if (distance > 0) {
      setDragDistance(distance);
      setTouchEnd(currentTouch);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // If dragged down more than 100px, close the lightbox
    if (dragDistance > 100) {
      onClose();
    }
    
    // Reset
    setDragDistance(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex touch-auto items-center justify-center overflow-hidden"
      style={{
        transform: `translateY(${dragDistance}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        opacity: isDragging ? Math.max(1 - dragDistance / 300, 0.5) : 1
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Mobile: Close button bottom-left (Instagram-style) */}
      <button
        onClick={onClose}
        className="absolute z-50 flex items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95 md:hidden"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        aria-label={t("lightbox.close")}
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
      
      {/* Desktop: Close button top-right */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 hidden items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95 md:flex"
        aria-label={t("lightbox.close")}
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

      {/* Version Toggle Button - Show for purchased photos (original/edited) or non-purchased (watermarked versions) */}
      {(editedUrl || (watermarkEditedUrl && watermarkOriginalUrl)) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (editedUrl) {
              // Toggle between original and edited (purchased photos)
              setShowEdited(!showEdited);
            } else {
              // Toggle between watermarked original and edited
              setShowWatermarkEdited(!showWatermarkEdited);
            }
          }}
          className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-xl transition-all hover:bg-white active:scale-95 sm:left-4 sm:top-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>
            {editedUrl 
              ? (showEdited ? "Original" : "Bearbeitet")
              : (showWatermarkEdited ? "Original" : "Bearbeitet")
            }
          </span>
        </button>
      )}

      {/* Action buttons - Share Button (Top Right) */}
      {showShare && shareUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Trigger share
            const title = shareTitle || t("lightbox.sharePhoto");
            if (navigator.share) {
              navigator.share({
                title: title,
                text: title,
                url: shareUrl,
              }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareUrl);
              });
            } else {
              navigator.clipboard.writeText(shareUrl);
            }
          }}
          className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-blue-700 active:scale-95 sm:right-4 sm:top-4 sm:px-3 sm:py-3"
          aria-label={t("lightbox.share")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="sm:hidden">{t("lightbox.share")}</span>
        </button>
      )}

      {/* Image - Mobile optimized with pinch-zoom enabled */}
      <div className="relative z-10 flex h-[60vh] w-full max-w-[95vw] touch-auto items-center justify-center overflow-auto sm:h-[85vh] sm:max-w-[90vw]">
        <img
          src={
            editedUrl
              ? (showEdited && editedUrl ? editedUrl : imageUrl) // Purchased: toggle original/edited
              : watermarkEditedUrl && watermarkOriginalUrl
                ? (showWatermarkEdited ? watermarkEditedUrl : watermarkOriginalUrl) // Non-purchased: toggle watermarked versions
                : imageUrl // Fallback to imageUrl if no watermark versions available
          }
          alt={alt}
          className="max-h-full max-w-full touch-auto object-contain transition-opacity duration-300"
          style={{
            transform: `rotate(${rotation}deg)`,
            touchAction: 'pinch-zoom',
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

      {/* Cart status indicator - Top left corner, clickable */}
      {photoId && isInCart && onViewCart && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewCart();
          }}
          className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-sm font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-green-700 active:scale-95 sm:left-4 sm:top-4 sm:px-4"
          aria-label="Warenkorb ansehen"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 7.4M17 13l1.6 7.4M9 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            <circle cx="9" cy="19.5" r="1.5" fill="white"/>
            <circle cx="17" cy="19.5" r="1.5" fill="white"/>
          </svg>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}

      {/* Add to cart button - Fixed at bottom with safe area */}
      {photoId && (onAddToCart || onRemoveFromCart) && (
        <div 
          className="absolute bottom-24 left-1/2 z-50 -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {isInCart ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCart?.(photoId);
              }}
              className="flex items-center gap-2.5 rounded-full bg-red-600 px-8 py-4 text-base font-bold text-white shadow-[0_8px_30px_rgb(220,38,38,0.5)] ring-2 ring-red-400 transition-all hover:scale-105 hover:bg-red-700 hover:ring-red-300 active:scale-95 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-6 w-6 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" />
              </svg>
              <span>{t("lightbox.removeFromCart")}</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(photoId);
              }}
              className="flex items-center gap-2.5 rounded-full bg-green-600 px-8 py-4 text-base font-bold text-white shadow-[0_8px_30px_rgb(22,163,74,0.5)] ring-2 ring-green-400 transition-all hover:scale-105 hover:bg-green-700 hover:ring-green-300 active:scale-95 sm:rounded-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <svg className="h-6 w-6 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t("lightbox.addToCart")}</span>
            </button>
          )}
        </div>
      )}

      {/* Swipe indicator - Visible only on mobile, fades out after 3s */}
      {showSwipeHint && (
        <div 
          className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-opacity duration-500 md:hidden"
          style={{ opacity: showSwipeHint ? 1 : 0 }}
        >
          <svg className="h-6 w-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="text-xs font-medium">Wischen zum Schließen</span>
        </div>
      )}

      {/* Instructions - Hidden on mobile */}
      <div className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-sm text-white/70 sm:block">
        {t("lightbox.clickOutside")}
      </div>
    </div>
  );
}

