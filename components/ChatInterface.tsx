
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  t: (key: string) => string;
}

const ModelIcon: React.FC = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM5 17a1 1 0 001.447.894l4-2A1 1 0 0011 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 005 7v10z" />
        </svg>
    </div>
);

const UserIcon: React.FC = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  // Fix: Qualify JSX.Element with the React namespace to resolve "Cannot find namespace 'JSX'" error.
  const elements: React.JSX.Element[] = [];
  let listItems: string[] = [];

  // Fix: Qualify JSX.Element with the React namespace to resolve "Cannot find namespace 'JSX'" error.
  const renderLine = (line: string): (string | React.JSX.Element)[] => {
    const segments = line.split(/(\*\*.*?\*\*)/g);
    return segments.filter(Boolean).map((segment, i) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={i}>{segment.slice(2, -2)}</strong>;
      }
      return segment;
    });
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-4">
          {listItems.map((item, i) => (
            <li key={i}>{renderLine(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('* ')) {
      listItems.push(line.trim().substring(2));
    } else {
      flushList();
      if (line.trim().startsWith('### ')) {
        elements.push(<h3 key={index} className="font-bold text-md mt-2 mb-1">{renderLine(line.trim().substring(4))}</h3>);
      } else if (line.trim().startsWith('## ')) {
        elements.push(<h2 key={index} className="font-bold text-lg mt-3 mb-1">{renderLine(line.trim().substring(3))}</h2>);
      } else if (line.trim()) {
        elements.push(<p key={index}>{renderLine(line.trim())}</p>);
      }
    }
  });

  flushList(); // Flush any remaining list items

  return <div className="text-sm leading-relaxed space-y-2">{elements}</div>;
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, isChatLoading, onSendMessage, onClearChat, t }) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isChatLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-teal-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-2xl p-6 md:p-8 space-y-4 animate-fade-in w-full border-2 border-teal-200 dark:border-teal-800">
        <div className="flex justify-between items-center pb-4 border-b-2 border-teal-200 dark:border-teal-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide">{t('chatTitle')}</h3>
            </div>
            {chatHistory.length > 1 && (
                <button
                    onClick={onClearChat}
                    disabled={isChatLoading}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait transition-all shadow-sm"
                    aria-label={t('clearChat')}
                    title={t('clearChat')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
        <div ref={chatContainerRef} className="h-80 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">
            {chatHistory.map((chat, index) => (
                <div key={index} className={`flex items-start gap-3 animate-fade-in ${chat.role === 'user' ? 'justify-end' : ''}`}>
                    {chat.role === 'model' && <ModelIcon />}
                    <div className={`max-w-md p-4 rounded-2xl shadow-lg transition-all hover:shadow-xl ${
                      chat.role === 'user' 
                        ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-600'
                    }`}>
                        {chat.role === 'model' ? (
                          <>
                            <SimpleMarkdownRenderer content={chat.parts[0].text} />
                            {chat.groundingChunks && chat.groundingChunks.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                  </svg>
                                  {t('sources')}
                                </h4>
                                <ul className="space-y-2">
                                  {chat.groundingChunks.map((chunk, i) => (
                                    chunk.web && (
                                      <li key={i} className="text-xs">
                                        <a
                                          href={chunk.web.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline flex items-center gap-2 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                                          title={chunk.web.title}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                          </svg>
                                          <span className="truncate font-medium">{chunk.web.title || chunk.web.uri}</span>
                                        </a>
                                      </li>
                                    )
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm leading-relaxed font-medium">{chat.parts[0].text}</p>
                        )}
                    </div>
                     {chat.role === 'user' && <UserIcon />}
                </div>
            ))}
            {isChatLoading && (
                <div className="flex items-start gap-3 animate-fade-in">
                    <ModelIcon />
                    <div className="max-w-md p-4 rounded-2xl bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce"></div>
                            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-4 border-t-2 border-teal-200 dark:border-teal-700">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('chatPlaceholder')}
                disabled={isChatLoading}
                className="flex-1 w-full px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm shadow-sm transition-all"
                aria-label="Chat message input"
            />
            <button
                type="submit"
                disabled={isChatLoading || !message.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-teal-600 to-green-600 text-white hover:from-teal-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg hover:shadow-xl hover:scale-110 transition-all"
                aria-label={t('chatSend')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </form>
    </div>
  );
};

export default ChatInterface;
