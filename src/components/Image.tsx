import Image from 'next/image';
import { forwardRef } from 'react';

interface OptimizedImageProps extends Omit<React.ComponentProps<typeof Image>, 'alt'> {
  alt: string;
  priority?: boolean;
  sizes?: string;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ priority = false, sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw", ...props }, ref) => {
    return (
      <Image
        ref={ref}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;