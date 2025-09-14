import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 10, 
  maxSize = 5,
  className = '' 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only image files (JPG, PNG, GIF, etc.)',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please upload images smaller than ${maxSize}MB`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (value.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can upload maximum ${maxFiles} images`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (validateFile(file)) {
          const base64 = await convertToBase64(file);
          newImages.push(base64);
        }
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
        toast({
          title: 'Images uploaded',
          description: `Successfully uploaded ${newImages.length} image(s)`,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to process some images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [value, onChange, maxFiles, maxSize, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = ''; // Reset input
  }, [handleFileUpload]);

  const removeImage = useCallback((index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
    toast({
      title: 'Image removed',
      description: 'Image has been removed from the list',
    });
  }, [value, onChange, toast]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`relative border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <CardContent 
          className="p-8 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={uploading || value.length >= maxFiles}
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {uploading ? (
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              ) : (
                <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium">
                {uploading ? 'Uploading images...' : 'Upload Property Images'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports JPG, PNG, GIF up to {maxSize}MB each. Maximum {maxFiles} images.
              </p>
            </div>
            
            {value.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {value.length}/{maxFiles} images uploaded
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Previews */}
      {value.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Uploaded Images ({value.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {value.map((image, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      loading="lazy"
                      decoding="async"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs px-1 py-0"
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Limits Info */}
      {value.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>
            Add multiple high-quality images to showcase your property. The first image will be used as the main photo.
          </span>
        </div>
      )}
    </div>
  );
}