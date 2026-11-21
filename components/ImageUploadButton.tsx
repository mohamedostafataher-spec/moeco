
import React, { useRef, useState } from 'react';
import { Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  label?: string;
  bucket?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ onUpload, label, bucket = 'images' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploaded(false);
    try {
      const url = await storageService.uploadImage(file, bucket);
      if (url) {
        onUpload(url);
        setUploaded(true);
        notificationService.success('Image uploaded successfully');
      } else {
        notificationService.error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      notificationService.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[10px] font-black text-zinc-500 uppercase px-2">{label}</label>}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all ${
          uploaded 
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
            : 'border-white/10 bg-white/5 text-zinc-400 hover:border-blue-500/50 hover:bg-blue-500/5'
        }`}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : uploaded ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
        <span className="text-xs font-bold">
          {isUploading ? 'Uploading...' : uploaded ? 'Image Attached' : 'Attach Image'}
        </span>
      </button>
    </div>
  );
};
