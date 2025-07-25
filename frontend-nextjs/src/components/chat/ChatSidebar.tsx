import { useState } from 'react';
import { Search, MessageCircle, Archive, Settings } from 'lucide-react';
import { Chat, Instance } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatSidebarProps {
  instances: Instance[];
  selectedInstance: Instance | null;
  onInstanceSelect: (instance: Instance) => void;
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  loading: boolean;
}

export default function ChatSidebar({
  instances,
  selectedInstance,
  onInstanceSelect,
  chats,
  selectedChat,
  onChatSelect,
  loading
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.contact.phone.includes(searchTerm);
    const matchesArchive = showArchived ? chat.isArchived : !chat.isArchived;
    return matchesSearch && matchesArchive;
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Conversas</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-full ${showArchived ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} hover:bg-green-200 transition-colors`}
              title={showArchived ? "Mostrar não arquivadas" : "Mostrar arquivadas"}
            >
              <Archive size={20} />
            </button>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-green-200 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Seletor de Instância */}
        {instances.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedInstance?.id || ''}
              onChange={(e) => {
                const instance = instances.find(i => i.id === e.target.value);
                if (instance) onInstanceSelect(instance);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecione uma instância</option>
              {instances.map(instance => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Chats */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">Carregando conversas...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">
              {searchTerm ? 'Nenhuma conversa encontrada' : 
               showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa ativa'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    {chat.contact.profilePicUrl ? (
                      <img
                        src={chat.contact.profilePicUrl}
                        alt={chat.contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {chat.contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {chat.contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Informações do Chat */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.contact.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.lastMessage && formatDistanceToNow(new Date(chat.lastMessage.timestamp), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessage.fromMe && "Você: "}
                            {chat.lastMessage.type === 'text' 
                              ? chat.lastMessage.body 
                              : `📎 ${chat.lastMessage.type === 'image' ? 'Imagem' : 
                                    chat.lastMessage.type === 'video' ? 'Vídeo' : 
                                    chat.lastMessage.type === 'audio' ? 'Áudio' : 'Arquivo'}`
                            }
                          </>
                        ) : (
                          'Sem mensagens'
                        )}
                      </p>
                      
                      {/* Indicadores */}
                      <div className="flex items-center space-x-1">
                        {chat.isPinned && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
