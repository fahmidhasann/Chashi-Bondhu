// components/ApiKeyInstructions.tsx - Modern Vercel & local setup instructions
import React from 'react';

interface ApiKeyInstructionsProps {
  t: (key: string) => string;
}

const ApiKeyInstructions: React.FC<ApiKeyInstructionsProps> = ({ t }) => {
  return (
    <div className="flex items-center justify-center min-h-[350px] p-4">
      <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-teal-200 dark:border-teal-800 animate-scale-in">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t('apiKeyRequiredTitle')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-xl mx-auto">
          {t('apiKeyRequiredMessage')}
        </p>

        <div className="mt-8 text-left space-y-4 bg-teal-50/50 dark:bg-teal-950/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-900">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
              1
            </div>
            <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm sm:text-base pt-1">
              <p>{t('apiKeyStep1')}</p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold hover:underline mt-1"
              >
                Google AI Studio Key Page →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
              2
            </div>
            <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm sm:text-base pt-1">
              <p>{t('apiKeyStep2')}</p>
              <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-xl text-xs sm:text-sm font-mono border border-gray-200 dark:border-gray-700">
                <p>
                  <span className="text-gray-500 font-sans">{t('apiKeyExampleName')}</span>{' '}
                  <code className="text-teal-600 dark:text-teal-400 font-bold">GEMINI_API_KEY</code>
                </p>
                <p>
                  <span className="text-gray-500 font-sans">{t('apiKeyExampleValue')}</span>{' '}
                  <code className="text-gray-600 dark:text-gray-400">AIzaSy...</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
              3
            </div>
            <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm sm:text-base pt-1">
              <p>{t('apiKeyStep3')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            🔄 {t('reloadApp') || 'রিফ্রেশ করুন (Reload)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInstructions;
