import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check if already shown this session
    const hasSeenSplash = sessionStorage.getItem('ausdav-splash-shown');
    
    if (hasSeenSplash || prefersReducedMotion) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('ausdav-splash-shown', 'true');
      setTimeout(onComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Skip button handler
  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem('ausdav-splash-shown', 'true');
    onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              {/* Logo */}
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-secondary/20 animate-pulse-glow" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center neon-glow">
                  <span className="text-4xl font-serif font-bold text-primary">A</span>
                </div>
              </div>
              
              {/* Organization Name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-2xl md:text-3xl font-serif font-bold text-primary-foreground mb-2"
              >
                AUSDAV
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-sm md:text-base text-primary-foreground/80 max-w-md mx-auto px-4"
              >
                All University Students' Development Association Vavuniya
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-xs text-secondary mt-4 font-medium tracking-wider uppercase"
              >
                Empowering Students, Transforming Futures
              </motion.p>
            </motion.div>
            
            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="flex justify-center gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-secondary"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </div>
          
          {/* Skip button for accessibility */}
          <button
            onClick={handleSkip}
            className="absolute bottom-8 right-8 text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary rounded px-3 py-1"
            aria-label="Skip splash screen"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
