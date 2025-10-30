
import React from 'react';
import { AnalysisResult } from '../types';

interface ResultDisplayProps {
  result: AnalysisResult;
  onPlayAudio: (text: string) => void;
  audioState: 'idle' | 'loading' | 'playing' | 'error';
  audioError: string | null;
  t: (key: string) => string;
}

const SpeakerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const LoadingIcon: React.FC = () => (
    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <rect x="9" y="9" width="6" height="6" rx="1" fill="white" stroke="none" />
    </svg>
);

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const StatusIcon: React.FC<{ status: 'healthy' | 'diseased' | 'irrelevant'; size?: 'large' | 'small' }> = ({ status, size = 'large' }) => {
    const styles = {
        large: {
            wrapper: 'w-14 h-14',
            icon: 'w-8 h-8'
        },
        small: {
            wrapper: 'w-9 h-9',
            icon: 'w-5 h-5'
        }
    };
    const currentSize = styles[size];

    const iconData = {
        healthy: {
            bg: 'bg-green-100 dark:bg-green-900/50',
            text: 'text-green-600 dark:text-green-400',
            svg: (
                <svg className={currentSize.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        diseased: {
            bg: 'bg-yellow-100 dark:bg-yellow-800/50',
            text: 'text-yellow-600 dark:text-yellow-400',
            svg: (
                 <svg className={currentSize.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        irrelevant: {
            bg: 'bg-blue-100 dark:bg-blue-900/50',
            text: 'text-blue-600 dark:text-blue-400',
            svg: (
                 <svg className={currentSize.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    };

    const selected = iconData[status];

    return (
        <div className={`flex-shrink-0 flex items-center justify-center rounded-full ${currentSize.wrapper} ${selected.bg}`}>
            <span className={selected.text}>{selected.svg}</span>
        </div>
    );
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onPlayAudio, audioState, audioError, t }) => {
  const isHealthy = result.status === 'healthy';
  const isDiseased = result.status === 'diseased';
  const isIrrelevant = result.status === 'irrelevant';

  const handlePlayClick = () => {
    let textToSpeak: string;

    if (isIrrelevant) {
        textToSpeak = [result.diseaseName, result.description].filter(Boolean).join('. ');
    } else {
       textToSpeak = [
            isHealthy ? t('plantStatus') : t('identifiedDisease'),
            result.diseaseName,
            t('descriptionLabel'),
            result.description,
            isHealthy && result.preventativeMeasures ? t('preventativeMeasuresLabel') : '',
            ...(isHealthy && result.preventativeMeasures ? result.preventativeMeasures : []),
            isDiseased && result.controlMeasures ? t('controlMeasuresLabel') : '',
            ...(isDiseased && result.controlMeasures ? result.controlMeasures : [])
        ].filter(Boolean).join('. ');
    }

    onPlayAudio(textToSpeak);
  };
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-2xl p-8 md:p-10 space-y-8 animate-fade-in w-full border-2 border-gray-200 dark:border-gray-700">
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full">
            <div className="relative">
              <StatusIcon status={result.status} size="large" />
              {isDiseased && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="flex-1">
                <h2 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                     {isHealthy ? t('plantStatus') : (isIrrelevant ? t('irrelevantImage') : t('identifiedDisease'))}
                </h2>
                <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
                    {result.diseaseName}
                </p>
            </div>
        </div>
        <div className="relative flex-shrink-0 self-start sm:self-center">
             <button
                onClick={handlePlayClick}
                disabled={audioState === 'loading'}
                className="p-3 rounded-xl text-white bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-wait transition-all shadow-lg hover:shadow-2xl hover:scale-110"
                aria-label={t('readAloudLabel')}
                title={audioState === 'error' ? audioError ?? t('audioError') : t('readAloud')}
            >
                {audioState === 'loading' && <LoadingIcon />}
                {(audioState === 'idle') && <SpeakerIcon />}
                {audioState === 'playing' && <StopIcon />}
                {audioState === 'error' && <ErrorIcon />}
            </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 shadow-inner border border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider pb-3 mb-4 border-b-2 border-teal-200 dark:border-teal-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          {t('descriptionLabel')}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{result.description}</p>
      </div>

      {isHealthy && result.preventativeMeasures && result.preventativeMeasures.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 shadow-lg border-2 border-green-200 dark:border-green-800">
          <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider pb-3 mb-4 border-b-2 border-green-300 dark:border-green-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            {t('preventativeMeasuresLabel')}
          </h3>
          <ul className="space-y-4">
            {result.preventativeMeasures.map((measure, index) => (
              <li key={index} className="flex items-start gap-3 bg-white/60 dark:bg-gray-800/40 p-4 rounded-lg shadow-sm">
                <StatusIcon status="healthy" size="small" />
                <p className="flex-1 text-gray-700 dark:text-gray-300 text-base leading-relaxed">{measure}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDiseased && result.controlMeasures && result.controlMeasures.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 shadow-lg border-2 border-yellow-300 dark:border-yellow-700">
          <h3 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider pb-3 mb-4 border-b-2 border-yellow-300 dark:border-yellow-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
            {t('controlMeasuresLabel')}
          </h3>
          <ul className="space-y-4">
            {result.controlMeasures.map((measure, index) => (
              <li key={index} className="flex items-start gap-3 bg-white/60 dark:bg-gray-800/40 p-4 rounded-lg shadow-sm">
                <StatusIcon status="diseased" size="small" />
                <p className="flex-1 text-gray-700 dark:text-gray-300 text-base leading-relaxed">{measure}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
