
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imageDataUrl: string | null;
  uploadProgress: number | null;
  preparingText: string;
  uploadPromptText: string;
  formatsText: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imageDataUrl, uploadProgress, preparingText, uploadPromptText, formatsText }) => {
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
        className={`relative w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-500 flex flex-col justify-center items-center text-center p-4 transition-colors ${uploadProgress === null ? 'cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600' : 'cursor-default'}`}
      >
        {uploadProgress !== null ? (
            <div className="w-full max-w-xs px-4">
                <p className="text-gray-600 dark:text-gray-300 font-semibold mb-2">{preparingText}</p>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                        className="bg-teal-500 h-2.5 rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">{uploadProgress}%</p>
            </div>
        ) : imageDataUrl ? (
          <img src={imageDataUrl} alt="Crop preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : (
          <>
            <svg className="w-12 h-12 text-gray-500 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p className="text-gray-600 dark:text-gray-300 font-semibold">{uploadPromptText}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatsText}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
