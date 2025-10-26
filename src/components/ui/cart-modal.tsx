"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Photo {
  id: string;
  watermark_url: string;
  bib_number: string | null;
  price: number;
  rotation?: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  onRemovePhoto: (photoId: string) => void;
  onCheckout: () => void;
  totalPrice: number;
  isCheckingOut?: boolean;
  isAuthenticated?: boolean;
  guestEmail?: string;
  onGuestEmailChange?: (email: string) => void;
}

export function CartModal({
  isOpen,
  onClose,
  photos,
  onRemovePhoto,
  onCheckout,
  totalPrice,
  isCheckingOut = false,
  isAuthenticated = false,
  guestEmail = "",
  onGuestEmailChange,
}: CartModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-2xl" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {t("common.photos")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {photos.length} {photos.length === 1 ? t("common.photo") : t("common.photos")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {photos.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-16 w-16 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">{t("event.noPhotos")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-700">
                    <img
                      src={photo.watermark_url}
                      alt={photo.bib_number ? `#${photo.bib_number}` : "Foto"}
                      className="h-full w-full object-cover"
                      style={{
                        transform: `rotate(${photo.rotation || 0}deg)`,
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    {photo.bib_number && (
                      <div className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        #{photo.bib_number}
                      </div>
                    )}
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {photo.price.toFixed(2)} €
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    className="rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    aria-label={t("common.delete")}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        {photos.length > 0 && (
          <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
            {/* Guest email input */}
            {!isAuthenticated && (
              <div className="mb-4">
                <label htmlFor="cart-email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("event.emailForDownload")}
                </label>
                <input
                  id="cart-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => onGuestEmailChange?.(e.target.value)}
                  placeholder={t("event.guestEmailPlaceholder")}
                  className="w-full rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                  style={{ fontSize: '16px' }}
                  required
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("orders.total")}
              </span>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {totalPrice.toFixed(2)} €
              </span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isCheckingOut || (!isAuthenticated && !guestEmail)}
              className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("common.loading")}
                </span>
              ) : (
                t("event.checkout")
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

