
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imageDataUrl: string | null;
  uploadProgress: number | null;
  preparingText: string;
  uploadPromptText: string;
  formatsText: string;
  language: 'bn' | 'en';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imageDataUrl, uploadProgress, preparingText, uploadPromptText, formatsText, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    // Don't allow clicking while an upload is in progress
    if (uploadProgress === null) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        onClick={handleUploadClick}
        className={`relative w-full rounded-2xl border-2 transition-all duration-300 ${
          uploadProgress === null 
            ? 'cursor-pointer border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20' 
            : 'cursor-default border-solid border-teal-500'
        } ${
          imageDataUrl 
            ? 'aspect-video' 
            : 'aspect-[4/3]'
        } bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 flex flex-col justify-center items-center text-center p-8 overflow-hidden`}
      >
        {uploadProgress !== null ? (
            <div className="w-full max-w-md px-4">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-teal-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl"></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-white font-semibold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                ✅ {language === 'bn' ? 'ছবি আপলোড হয়েছে' : 'Image Uploaded'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick();
                }}
                className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg"
              >
                {language === 'bn' ? 'পরিবর্তন করুন' : 'Change'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <svg className="w-20 h-20 text-teal-500 dark:text-teal-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-200 font-bold text-xl mb-1">{uploadPromptText}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatsText}</p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-6 py-2 bg-teal-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all">
                {language === 'bn' ? 'ফাইল নির্বাচন করুন' : 'Select File'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
