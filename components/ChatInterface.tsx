
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 space-y-4 animate-fade-in w-full border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">{t('chatTitle')}</h3>
            {chatHistory.length > 1 && (
                <button
                    onClick={onClearChat}
                    disabled={isChatLoading}
                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-wait transition-all"
                    aria-label={t('clearChat')}
                    title={t('clearChat')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
        <div ref={chatContainerRef} className="h-64 overflow-y-auto pr-2 space-y-4">
            {chatHistory.map((chat, index) => (
                <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                    {chat.role === 'model' && <ModelIcon />}
                    <div className={`max-w-md p-3 rounded-lg ${chat.role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        {chat.role === 'model' ? (
                          <>
                            <SimpleMarkdownRenderer content={chat.parts[0].text} />
                            {chat.groundingChunks && chat.groundingChunks.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('sources')}</h4>
                                <ul className="space-y-1">
                                  {chat.groundingChunks.map((chunk, i) => (
                                    chunk.web && (
                                      <li key={i} className="text-xs">
                                        <a
                                          href={chunk.web.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5"
                                          title={chunk.web.title}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                          </svg>
                                          <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                                        </a>
                                      </li>
                                    )
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm leading-relaxed">{chat.parts[0].text}</p>
                        )}
                    </div>
                     {chat.role === 'user' && <UserIcon />}
                </div>
            ))}
            {isChatLoading && (
                <div className="flex items-start gap-3">
                    <ModelIcon />
                    <div className="max-w-md p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                        <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('chatPlaceholder')}
                disabled={isChatLoading}
                className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                aria-label="Chat message input"
            />
            <button
                type="submit"
                disabled={isChatLoading || !message.trim()}
                className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                aria-label={t('chatSend')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </form>
    </div>
  );
};

export default ChatInterface;
