// components/ImageUploader.tsx - Mobile camera capture, drag-and-drop, and compression stats
import React, { useRef, useState } from 'react';

export interface ImageOptimizationInfo {
  originalSize: string;
  optimizedSize: string;
  reductionPercentage: number;
}

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imageDataUrl: string | null;
  uploadProgress: number | null;
  preparingText: string;
  uploadPromptText: string;
  formatsText: string;
  language: 'bn' | 'en';
  optimizationInfo?: ImageOptimizationInfo | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  imageDataUrl,
  uploadProgress,
  preparingText,
  uploadPromptText,
  formatsText,
  language,
  optimizationInfo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden file input for file picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      {/* Hidden camera input for direct mobile camera capture */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (uploadProgress === null && !imageDataUrl) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative w-full rounded-2xl border-2 transition-all duration-300 ${
          isDragging
            ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 scale-[1.01]'
            : uploadProgress === null
            ? 'cursor-pointer border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/20'
            : 'cursor-default border-solid border-teal-500'
        } ${
          imageDataUrl ? 'aspect-video sm:aspect-[16/9]' : 'aspect-[4/3] sm:aspect-[16/10]'
        } bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 flex flex-col justify-center items-center text-center p-6 sm:p-8 overflow-hidden`}
      >
        {uploadProgress !== null ? (
          <div className="w-full max-w-md px-4">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-teal-500 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-bold text-lg mb-3">{preparingText}</p>
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-teal-500 to-green-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 font-semibold">{uploadProgress}%</p>
          </div>
        ) : imageDataUrl ? (
          <>
            <img src={imageDataUrl} alt="Crop preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 rounded-2xl pointer-events-none"></div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="text-white bg-black/60 hover:bg-teal-600 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 border border-white/20"
              >
                📸 {language === 'bn' ? 'ক্যামেরা' : 'Camera'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center gap-1.5"
              >
                🔄 {language === 'bn' ? 'পরিবর্তন' : 'Change'}
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-white font-semibold text-xs sm:text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5 border border-white/10">
                ✅ {language === 'bn' ? 'ছবি প্রস্তুত আছে' : 'Image Ready'}
              </span>

              {optimizationInfo && optimizationInfo.reductionPercentage > 0 && (
                <span className="text-teal-200 text-xs bg-teal-950/80 border border-teal-500/40 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1">
                  ⚡ {optimizationInfo.originalSize} → {optimizationInfo.optimizedSize} ({optimizationInfo.reductionPercentage}% {language === 'bn' ? 'ছোট করা হয়েছে' : 'smaller'})
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="relative">
              <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
            </div>

            <div>
              <p className="text-gray-800 dark:text-gray-100 font-bold text-lg sm:text-xl mb-1">{uploadPromptText}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatsText}</p>
            </div>

            {/* Quick Action Buttons: Camera and Gallery */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {language === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন' : 'Take Photo'}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all"
              >
                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                {language === 'bn' ? 'ফাইল বেছে নিন' : 'Choose File'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
