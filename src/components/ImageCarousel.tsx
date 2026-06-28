"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  images: { id: string; filePath: string }[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: Props) {
  const [current, setCurrent] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const total = images.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    setSwipeOffset(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setSwipeOffset(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (swipeOffset < -50) {
      goTo(current + 1);
    } else if (swipeOffset > 50) {
      goTo(current - 1);
    }
    setSwipeOffset(0);
  };

  if (total === 0) return null;

  return (
    <div className="mb-5">
      {/* Card stack container */}
      <div
        className="relative w-full aspect-[16/9] cursor-grab active:cursor-grabbing select-none touch-pan-y overflow-hidden rounded-xl"
        onPointerDown={total > 1 ? onPointerDown : undefined}
        onPointerMove={total > 1 ? onPointerMove : undefined}
        onPointerUp={total > 1 ? onPointerUp : undefined}
        onPointerCancel={total > 1 ? onPointerUp : undefined}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {images.map((img, i) => {
          // Distance from current in the forward (rightward) direction
          const dist = (i - current + total) % total;
          const baseX = dist * 24;
          const z = total - dist;

          return (
            <img
              key={img.id}
              src={img.filePath}
              alt={`${alt} - ${i + 1}`}
              className="absolute top-0 left-0 h-full rounded-xl border border-gray-100 object-cover transition-transform duration-300 ease-out"
              style={{
                width: "100%",
                transform: `translateX(${baseX + (dist === 0 ? swipeOffset * 0.6 : 0)}px)`,
                zIndex: z,
                boxShadow:
                  dist === 0
                    ? "0 1px 2px rgba(0,0,0,0.04)"
                    : "0 1px 2px rgba(0,0,0,0.02)",
              }}
              draggable={false}
            />
          );
        })}

        {/* Counter badge */}
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none">
          {current + 1} / {total}
        </div>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setCurrent(i);
                setSwipeOffset(0);
              }}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? "bg-[#635bff] w-4 h-2"
                  : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
              }`}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
