import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhotoUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  currentUser?: {
    firstName?: string | null;
    lastName?: string | null;
    username: string;
  };
  maxSize?: number; // in MB
  className?: string;
}

export default function ProfilePhotoUpload({ 
  value = '', 
  onChange, 
  currentUser,
  maxSize = 2,
  className = '' 
}: ProfilePhotoUploadProps) {
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
    if (files.length === 0) return;

    const file = files[0]; // Only take the first file for profile photo
    if (!validateFile(file)) return;

    setUploading(true);

    try {
      const base64 = await convertToBase64(file);
      onChange(base64);
      toast({
        title: 'Profile photo uploaded',
        description: 'Your profile photo has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [onChange, maxSize, toast]);

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

  const removePhoto = useCallback(() => {
    onChange('');
    toast({
      title: 'Profile photo removed',
      description: 'Your profile photo has been removed',
    });
  }, [onChange, toast]);

  const getInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`;
    }
    return currentUser?.username?.[0] || 'U';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Photo Display */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={value} />
          <AvatarFallback className="text-lg">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground">
            Upload a new photo or drag and drop
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
          data-testid="input-profile-photo"
        />
        
        <div className="space-y-2">
          <Camera className="h-8 w-8 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => (document.querySelector('input[data-testid="input-profile-photo"]') as HTMLInputElement)?.click()}
          disabled={uploading}
          data-testid="button-choose-photo"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Photo
        </Button>
        
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removePhoto}
            disabled={uploading}
            data-testid="button-remove-photo"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}