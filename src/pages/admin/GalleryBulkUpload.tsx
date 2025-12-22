import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryBulkUploadProps {
  galleryId: string;
  year: number;
  onBack: () => void;
}

type GalleryImageRow = {
  id: string;
  gallery_id: string;
  image_path: string;
  created_at: string;
};

type GalleryImageInsert = {
  id?: string;
  gallery_id: string;
  image_path: string;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      gallery_images: {
        Row: GalleryImageRow;
        Insert: GalleryImageInsert;
        Update: Partial<GalleryImageInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const GalleryBulkUpload: React.FC<GalleryBulkUploadProps> = ({ galleryId, year, onBack }) => {
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseDb = supabase as unknown as SupabaseClient<any, any, any, any>;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `galleries/${galleryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('galleries')
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) throw uploadError;

        // Insert into gallery_images
        const { error: dbError } = await supabaseDb
          .from('gallery_images')
          .insert([{ gallery_id: galleryId, image_path: path }]);

        if (dbError) throw dbError;

        return path;
      });

      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      toast.success('Images uploaded successfully');
      setSelectedFiles([]);
    },
    onError: (error) => {
      toast.error('Failed to upload images: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 100) {
      toast.error('Maximum 100 images allowed');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    setIsUploading(true);
    uploadImagesMutation.mutate(selectedFiles);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Images</h1>
          <p className="text-muted-foreground mt-1">Gallery for {year} - {selectedFiles.length}/100 images selected</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            Bulk Image Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-files">Select Images (max 100)</Label>
            <Input
              id="image-files"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading || selectedFiles.length >= 100}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Images ({selectedFiles.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedFiles([])} disabled={isUploading}>
              Clear All
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length} Images
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryBulkUpload;