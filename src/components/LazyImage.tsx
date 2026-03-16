import { useRef, useState, useEffect } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

const LazyImage = ({ src, alt, className = "", style, width, height }: LazyImageProps) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`} style={style}>
      {!isLoaded && (
        <div
          className="w-full h-full absolute inset-0 animate-pulse rounded-inherit"
          style={{ background: "hsl(var(--border))", borderRadius: "inherit" }}
        />
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          style={{ borderRadius: "inherit" }}
        />
      )}
    </div>
  );
};

export default LazyImage;
