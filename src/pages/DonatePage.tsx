import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Building2, Phone, Mail, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DonatePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = React.useState<string | null>(null);

  const bankDetails = {
    bankName: 'Bank of Ceylon',
    accountName: 'AUSDAV',
    accountNumber: '12345678901234',
    branch: 'Vavuniya Branch',
    swiftCode: 'BABORLK',
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(language === 'en' ? 'Copied to clipboard!' : 'கிளிப்போர்டுக்கு நகலெடுக்கப்பட்டது!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundImage: 'var(--gradient-hero)' }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {t('donate.title')}
            </h1>
            <p className="text-foreground/80 text-lg">
              {t('donate.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Donation Info */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Bank Details */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-6 md:p-8 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  {t('donate.bank.title')}
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { label: language === 'en' ? 'Bank Name' : 'வங்கி பெயர்', value: bankDetails.bankName, key: 'bank' },
                  { label: language === 'en' ? 'Account Name' : 'கணக்கு பெயர்', value: bankDetails.accountName, key: 'name' },
                  { label: language === 'en' ? 'Account Number' : 'கணக்கு எண்', value: bankDetails.accountNumber, key: 'number' },
                  { label: language === 'en' ? 'Branch' : 'கிளை', value: bankDetails.branch, key: 'branch' },
                  { label: language === 'en' ? 'SWIFT Code' : 'SWIFT குறியீடு', value: bankDetails.swiftCode, key: 'swift' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium text-foreground">{item.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(item.value, item.key)}
                      className="flex-shrink-0"
                    >
                      {copied === item.key ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  {t('donate.contact.title')}
                </h2>

                <div className="space-y-4">
                  <a
                    href="tel:+94XXXXXXXX"
                    className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Call us' : 'எங்களை அழைக்கவும்'}
                      </p>
                      <p className="font-medium text-foreground">+94 XX XXX XXXX</p>
                    </div>
                  </a>

                  <a
                    href="mailto:donate@ausdav.org"
                    className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Email us' : 'மின்னஞ்சல் அனுப்பவும்'}
                      </p>
                      <p className="font-medium text-foreground">donate@ausdav.org</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-card rounded-xl p-6 md:p-8 shadow-lg text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    {language === 'en' ? 'QR Code' : 'QR குறியீடு'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Scan to donate via mobile banking' 
                    : 'மொபைல் வங்கி மூலம் நன்கொடை வழங்க ஸ்கேன் செய்யவும்'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 max-w-2xl mx-auto"
          >
            <p className="text-muted-foreground text-lg">
              {language === 'en'
                ? 'Your generous contribution helps us provide educational resources, conduct seminars, and support students in need. Every donation makes a difference.'
                : 'உங்கள் தாராள பங்களிப்பு கல்வி வளங்களை வழங்கவும், கருத்தரங்குகளை நடத்தவும், தேவைப்படும் மாணவர்களுக்கு ஆதரவளிக்கவும் உதவுகிறது. ஒவ்வொரு நன்கொடையும் ஒரு மாற்றத்தை ஏற்படுத்துகிறது.'}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DonatePage;
