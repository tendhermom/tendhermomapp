import { useRef, useState, useEffect, useCallback } from "react";

interface LazyVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}

const LazyVideo = ({ src, className = "", style }: LazyVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Intersection observer — only load video when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLoadedData = useCallback(() => setIsLoaded(true), []);
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={style}>
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div
          className="w-full aspect-video rounded-[18px] animate-pulse"
          style={{ background: "hsl(var(--border))" }}
        />
      )}

      {isVisible && (
        <video
          ref={videoRef}
          className={`w-full transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          controls
          playsInline
          preload="none"
          onLoadedData={handleLoadedData}
          onPlay={handlePlay}
          onPause={handlePause}
          style={{ borderRadius: "18px" }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default LazyVideo;
