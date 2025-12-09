import { motion } from 'framer-motion';

interface SkeletonCardProps {
  variant?: 'default' | 'large' | 'horizontal';
}

const SkeletonCard = ({ variant = 'default' }: SkeletonCardProps) => {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="w-24 h-36 rounded-lg skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-2/3 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card"
      >
        <div className="absolute inset-0 skeleton-shimmer" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="h-8 w-3/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full skeleton-shimmer" />
            <div className="h-8 w-24 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-card"
    >
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        <div className="flex gap-1">
          <div className="h-6 w-12 rounded-full skeleton-shimmer" />
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </motion.div>
  );
};

export const SkeletonGrid = ({ count = 6, variant = 'default' }: { count?: number; variant?: 'default' | 'large' | 'horizontal' }) => {
  return (
    <div className={variant === 'horizontal' 
      ? 'space-y-4' 
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'
    }>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
};

export default SkeletonCard;
