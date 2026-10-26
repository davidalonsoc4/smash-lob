"use client"
import { FloatingDialog, DialogCloseButton } from "@/components/ui/FloatingDialog"
import { useI18n } from "@/i18n/I18nProvider"
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const { t } = useI18n()
  return <FloatingDialog open onClose={onClose} title={t.imageViewer.dialogLabel} variant="content">
    <div className="flex justify-end p-3"><DialogCloseButton onClick={onClose} /></div>
    <div className="flex min-h-0 items-center justify-center overflow-auto bg-neutral-950 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[76dvh] max-w-full select-none object-contain" draggable={false} />
    </div>
  </FloatingDialog>
}
