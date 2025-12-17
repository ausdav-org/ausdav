import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { useLiveViewerCount } from '@/hooks/useLiveViewerCount';
import { cn } from '@/lib/utils';

interface LiveViewerBadgeProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LiveViewerBadge: React.FC<LiveViewerBadgeProps> = ({ 
  className, 
  showLabel = true,
  size = 'md' 
}) => {
  const { viewerCount, isConnected, isAuthenticated } = useLiveViewerCount();

  // Only show for authenticated users
  if (!isAuthenticated) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "flex items-center gap-2 rounded-full glass-card border border-border/50",
          sizeClasses[size],
          className
        )}
      >
        {/* Live indicator */}
        <div className="relative">
          {isConnected ? (
            <>
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              <span className="relative block w-2 h-2 rounded-full bg-green-500" />
            </>
          ) : (
            <span className="block w-2 h-2 rounded-full bg-muted-foreground" />
          )}
        </div>

        {/* Icon */}
        <Users className={cn(iconSizes[size], "text-primary")} />

        {/* Count */}
        <motion.span
          key={viewerCount}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-medium text-foreground"
        >
          {viewerCount}
        </motion.span>

        {/* Label */}
        {showLabel && (
          <span className="text-muted-foreground hidden sm:inline">
            {viewerCount === 1 ? 'viewer' : 'viewers'}
          </span>
        )}

        {/* Connection status icon */}
        {isConnected ? (
          <Wifi className={cn(iconSizes[size], "text-green-500")} />
        ) : (
          <WifiOff className={cn(iconSizes[size], "text-muted-foreground")} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveViewerBadge;
