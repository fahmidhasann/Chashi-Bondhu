
import React from 'react';

interface ApiKeyInstructionsProps {
  t: (key: string) => string;
}

const ApiKeyInstructions: React.FC<ApiKeyInstructionsProps> = ({ t }) => {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-yellow-300 dark:border-yellow-700">
        <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('apiKeyRequiredTitle')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {t('apiKeyRequiredMessage')}
        </p>

        {/* Visual Guide */}
        <div className="mt-6 text-left border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">{t('visualGuideTitle')}</h3>
            <div className="flex justify-center items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <div className="flex-shrink-0">
                    <div className="flex flex-col items-center space-y-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700">
                        <div className="p-2" title="Files">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="p-2 bg-yellow-200 dark:bg-yellow-800 rounded ring-2 ring-teal-500" title="Secrets">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-700 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                 <div className="text-5xl text-teal-500 relative animate-pulse">→</div>
                <div className="text-left">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                        <p className="ml-4 text-gray-700 dark:text-gray-300 pt-1.5">{t('apiKeyStep1')}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6 text-left space-y-4">
             <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300 pt-1.5">
                    <p>{t('apiKeyStep2')}</p>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-mono">
                        <p><span className="font-semibold">{t('apiKeyExampleName')}</span> <code className="text-teal-600 dark:text-teal-400">API_KEY</code></p>
                        <p><span className="font-semibold">{t('apiKeyExampleValue')}</span> <code className="text-teal-600 dark:text-teal-400">AIzaSy...</code></p>
                    </div>
                </div>
            </div>
             <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <p className="ml-4 text-gray-700 dark:text-gray-300 pt-1.5">{t('apiKeyStep3')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInstructions;
