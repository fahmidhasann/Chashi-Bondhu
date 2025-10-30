
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 space-y-8 animate-fade-in w-full border border-gray-200 dark:border-gray-700">
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
            <StatusIcon status={result.status} size="large" />
            <div className="flex-1">
                <h2 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                     {isHealthy ? t('plantStatus') : (isIrrelevant ? t('irrelevantImage') : t('identifiedDisease'))}
                </h2>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                    {result.diseaseName}
                </p>
            </div>
        </div>
        <div className="relative flex-shrink-0 self-start sm:self-center">
             <button
                onClick={handlePlayClick}
                disabled={audioState === 'loading'}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-wait transition-all"
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
      
      <div>
        <h3 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide pb-2 border-b border-gray-200 dark:border-gray-700">{t('descriptionLabel')}</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-4 text-base leading-relaxed">{result.description}</p>
      </div>

      {isHealthy && result.preventativeMeasures && result.preventativeMeasures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide pb-2 border-b border-gray-200 dark:border-gray-700">{t('preventativeMeasuresLabel')}</h3>
          <ul className="mt-4 space-y-4">
            {result.preventativeMeasures.map((measure, index) => (
              <li key={index} className="flex items-start gap-3">
                <StatusIcon status="healthy" size="small" />
                <p className="flex-1 text-gray-600 dark:text-gray-300 text-base leading-relaxed pt-1">{measure}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDiseased && result.controlMeasures && result.controlMeasures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide pb-2 border-b border-gray-200 dark:border-gray-700">{t('controlMeasuresLabel')}</h3>
          <ul className="mt-4 space-y-4">
            {result.controlMeasures.map((measure, index) => (
              <li key={index} className="flex items-start gap-3">
                <StatusIcon status="diseased" size="small" />
                <p className="flex-1 text-gray-600 dark:text-gray-300 text-base leading-relaxed pt-1">{measure}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
