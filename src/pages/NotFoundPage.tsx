import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-6xl font-serif font-bold text-muted-foreground">404</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
          {language === 'en' ? 'Page Not Found' : 'பக்கம் கிடைக்கவில்லை'}
        </h1>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {language === 'en'
            ? "The page you're looking for doesn't exist or has been moved."
            : 'நீங்கள் தேடும் பக்கம் இல்லை அல்லது நகர்த்தப்பட்டுள்ளது.'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Go Back' : 'திரும்பிச் செல்'}
          </Button>
          <Button variant="donate" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Go Home' : 'முகப்புக்குச் செல்'}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
