import { useState, useRef, KeyboardEvent } from 'react';
import { Send, MoreVertical, Phone, Video, Search, Paperclip, Smile } from 'lucide-react';
import { Chat, Message } from '@/types/api';
import MessageBubble from './MessageBubble';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (message: string, quotedMessageId?: string) => void;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatWindow({
  chat,
  messages,
  onSendMessage,
  loading,
  messagesEndRef
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim(), quotedMessage?.id);
      setMessageText('');
      setQuotedMessage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleQuoteMessage = (message: Message) => {
    setQuotedMessage(message);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header do Chat */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            {chat.contact.profilePicUrl ? (
              <img
                src={chat.contact.profilePicUrl}
                alt={chat.contact.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {chat.contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Informações do Contato */}
            <div>
              <h2 className="font-medium text-gray-900">{chat.contact.name}</h2>
              <p className="text-sm text-gray-500">
                {chat.contact.isOnline ? (
                  'Online'
                ) : chat.contact.lastSeen ? (
                  `Visto por último ${formatDistanceToNow(new Date(chat.contact.lastSeen), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}`
                ) : (
                  chat.contact.phone
                )}
              </p>
            </div>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Video size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm">Carregando mensagens...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">💬</span>
              </div>
              <p className="text-gray-600">Comece uma conversa enviando uma mensagem</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                showSender={index === 0 || messages[index - 1].fromMe !== message.fromMe}
                onQuote={() => handleQuoteMessage(message)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input de Mensagem */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Mensagem Citada */}
        {quotedMessage && (
          <div className="mb-3 p-3 bg-gray-50 border-l-4 border-green-500 rounded">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {quotedMessage.fromMe ? 'Você' : chat.contact.name}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {quotedMessage.type === 'text' 
                    ? quotedMessage.body 
                    : `📎 ${quotedMessage.type}`
                  }
                </p>
              </div>
              <button
                onClick={() => setQuotedMessage(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Campo de Input */}
        <div className="flex items-end space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-30"
              rows={1}
              style={{ minHeight: '40px' }}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors">
              <Smile size={18} />
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className={`p-2 rounded-full transition-colors ${
              messageText.trim()
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
