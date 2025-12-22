import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Image as ImageIcon } from 'lucide-react';

interface Gallery {
  id: string;
  event_id: number;
  year: number;
  title: string | null;
  description_en: string | null;
  description_ta: string | null;
  created_at: string;
  events: {
    title_en: string;
    title_ta: string | null;
  } | null;
  gallery_images: {
    id: string;
    file_path: string;
    caption: string | null;
  }[];
}

const GalleryPage = () => {
  const { language } = useLanguage();

  const { data: galleries, isLoading } = useQuery({
    queryKey: ['public-galleries'],
    queryFn: async () => {
      // Temporarily return empty array until galleries table is created
      // TODO: Uncomment when galleries table migration is applied
      /*
      const { data, error } = await supabase
        .from('galleries')
        .select(`
          id,
          event_id,
          year,
          title,
          description_en,
          description_ta,
          created_at,
          events (
            title_en,
            title_ta
          ),
          gallery_images (
            id,
            file_path,
            caption
          )
        `)
        .order('year', { ascending: false });

      if (error) throw error;
      return (data || []) as Gallery[];
      */
      return [] as Gallery[];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading galleries...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {language === 'ta' ? 'கேலரிகள்' : 'Galleries'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ta'
            ? 'நிகழ்வுகளின் நினைவுகளைப் பாருங்கள்'
            : 'Explore memories from our events'
          }
        </p>
      </div>

      {galleries && galleries.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {gallery.year}
                  </Badge>
                  <Badge variant="outline">
                    {gallery.gallery_images.length} {language === 'ta' ? 'படங்கள்' : 'photos'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  {gallery.title || `${language === 'ta' ? 'கேலரி' : 'Gallery'} ${gallery.year}`}
                </CardTitle>
                {gallery.events && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'ta' ? gallery.events.title_ta || gallery.events.title_en : gallery.events.title_en}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {gallery.description_en && (
                  <p className="text-sm mb-4 line-clamp-3">
                    {language === 'ta' && gallery.description_ta
                      ? gallery.description_ta
                      : gallery.description_en
                    }
                  </p>
                )}

                {gallery.gallery_images.length > 0 && (
                  <div className="grid grid-cols-3 gap-1">
                    {gallery.gallery_images.slice(0, 3).map((image, index) => (
                      <div key={image.id} className="aspect-square overflow-hidden rounded">
                        <img
                          src={`${supabase.storage.from('event-gallery').getPublicUrl(image.file_path).data.publicUrl}`}
                          alt={image.caption || `Gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {gallery.gallery_images.length > 3 && (
                      <div className="aspect-square bg-muted rounded flex items-center justify-center">
                        <span className="text-sm font-medium">
                          +{gallery.gallery_images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {gallery.gallery_images.length === 0 && (
                  <div className="aspect-video bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {language === 'ta' ? 'கேலரிகள் இல்லை' : 'No galleries yet'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ta'
              ? 'கேலரிகள் விரைவில் சேர்க்கப்படும்'
              : 'Galleries will be added soon'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;