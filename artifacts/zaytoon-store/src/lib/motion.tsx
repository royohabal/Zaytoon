import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react';
import { animate, motion, useAnimationControls, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useLocation } from 'wouter';
import { resolveImageSource } from '@/lib/image-source';

export const EASE = [0.2, 0.65, 0.3, 1] as const;

interface RevealProps extends HTMLAttributes<HTMLElement> {
  delay?: number;
  children?: ReactNode;
}

/** Fade + slight rise when entering the viewport. Content stays visible when reduced motion is on. */
export function Reveal({ delay = 0, children, className, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className} {...rest}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function RevealSection({ delay = 0, children, className, id }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <section id={id} className={className}>{children}</section>;
  }
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.section>
  );
}

/** Editorial clip reveal for large images. */
export function ImageReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(10% 0% 0% 0%)', opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.95, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Very subtle scroll parallax on an image. Static when reduced motion is on. */
export function ParallaxImage({
  amount = 5,
  className = '',
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { amount?: number; alt: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);
  if (reduce) {
    return <img ref={ref} className={className} {...props} />;
  }
  return (
    <motion.img
      ref={ref}
      className={className}
      style={{ y, scale: 1 + (amount * 2) / 100 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
      {...(props as object)}
    />
  );
}

/** Subtle decorative reveal (scale from left for rules, fade for icons). */
export function DrawIn({ children, className, delay = 0 }: { children?: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: 'left' }}
      initial={{ opacity: 0, scaleX: 0.2 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Mount animation, for containers that should enter once. */
export function Enter({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Opacity-only page fade. Never touches scroll or state. */
export function PageFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [location] = useLocation();
  const controls = useAnimationControls();
  useEffect(() => {
    void controls.start({
      opacity: reduce ? 1 : [0.35, 1],
      transition: { duration: reduce ? 0 : 0.35, ease: 'easeOut' },
    });
  }, [location, reduce, controls]);
  return (
    <motion.div
      initial={false}
      animate={controls}
    >
      {children}
    </motion.div>
  );
}

/** Image that fades in once loaded. */
export function FadeImage({ className = '', onLoad, onError, src, ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = resolveImageSource(src);
  useEffect(() => {
    setLoaded(Boolean(ref.current?.complete));
  }, [resolvedSrc]);
  return (
    <img
      ref={ref}
      src={resolvedSrc}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setLoaded(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}

/** Visually interpolates a currency value; the real value is always the prop. */
export function AnimatedPrice({
  value,
  className,
  ...rest
}: { value: number; className?: string } & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const latest = useRef(value);
  useEffect(() => {
    if (reduce) {
      latest.current = value;
      setShown(value);
      return;
    }
    const controls = animate(latest.current, value, {
      duration: 0.45,
      ease: EASE,
      onUpdate: (next) => {
        latest.current = next;
        setShown(next);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <span className={className} {...rest}>
      ${(reduce ? value : shown).toFixed(2)}
    </span>
  );
}

export function ProductGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      className={className ?? 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-8'}
      role="status"
      aria-label="Loading pieces"
      data-testid="status-loading"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="aspect-[4/5] animate-pulse bg-[#e9e5de]" style={{ animationDelay: `${index * 90}ms` }} />
            <div className="flex justify-between gap-3 pt-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-full max-w-32 animate-pulse bg-[#e9e5de]" />
              <div className="h-2.5 w-16 animate-pulse bg-[#efebe4]" />
            </div>
              <div className="h-3 w-10 shrink-0 animate-pulse bg-[#e9e5de]" />
          </div>
        </div>
      ))}
    </div>
  );
}
