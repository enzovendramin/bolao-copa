"use client";

import { useEffect, useRef, useState } from "react";

// Revela o conteúdo com uma animação suave quando ele entra na tela.
// Usado na cerimônia e na retrospectiva (mostrar "de um em um" ao rolar).
export function Reveal({
  children,
  onShow,
  className = "",
}: {
  children: React.ReactNode;
  onShow?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          onShow?.();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onShow]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
