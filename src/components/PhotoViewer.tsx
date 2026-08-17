import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface PhotoViewerProps {
  photos: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
  caption?: string;
}

/**
 * Full-screen, uncropped photo viewer with swipe between photos.
 * Shared by Baby Shower cards and the Profile avatar.
 */
const PhotoViewer = ({ photos, startIndex = 0, open, onClose, caption }: PhotoViewerProps) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(photos.length - 1, 0)));
  }, [open, startIndex, photos.length]);

  const go = (dir: number) => {
    if (photos.length < 2) return;
    setIndex((i) => (i + dir + photos.length) % photos.length);
  };

  return (
    <AnimatePresence>
      {open && photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.94)" }}
          onClick={onClose}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute right-4 z-[3] w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              top: "calc(var(--safe-area-top, 0px) + 14px)",
              background: "rgba(255,255,255,0.14)",
            }}
            aria-label="Close photo"
          >
            <IonIcon name="close" size={22} style={{ color: "white" }} />
          </motion.button>

          <motion.img
            key={photos[index]}
            src={photos[index]}
            alt={caption || "Photo"}
            drag={photos.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[100vw] max-h-[82vh] object-contain select-none"
            draggable={false}
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.14)" }}
                aria-label="Previous photo"
              >
                <IonIcon name="chevron-back" size={20} style={{ color: "white" }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.14)" }}
                aria-label="Next photo"
              >
                <IonIcon name="chevron-forward" size={20} style={{ color: "white" }} />
              </button>
              <div
                className="absolute inset-x-0 flex items-center justify-center gap-1.5"
                style={{ bottom: "calc(var(--safe-area-bottom, 0px) + 26px)" }}
              >
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                    className="rounded-full"
                    style={{
                      width: i === index ? 18 : 6,
                      height: 6,
                      background: i === index ? "white" : "rgba(255,255,255,0.45)",
                    }}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {caption && (
            <p
              className="absolute inset-x-0 text-center text-[13px] font-sans text-white/70 px-6"
              style={{ bottom: "calc(var(--safe-area-bottom, 0px) + 46px)" }}
            >
              {caption}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoViewer;
