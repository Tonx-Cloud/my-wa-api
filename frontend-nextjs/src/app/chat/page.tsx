"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatWelcome from '@/components/chat/ChatWelcome';
import { api } from '@/utils/api';
import { Chat, Instance, Message } from '@/types/api';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const selectedInstanceId = searchParams.get('instance');
  const selectedChatId = searchParams.get('chat');

  // Estados
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar instâncias quando o componente monta
  useEffect(() => {
    if (session) {
      loadInstances();
    }
  }, [session]);

  // Carregar chats quando uma instância é selecionada
  useEffect(() => {
    if (selectedInstance) {
      loadChats(selectedInstance.id);
    }
  }, [selectedInstance]);

  // Carregar mensagens quando um chat é selecionado
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Selecionar instância e chat baseado nos parâmetros da URL
  useEffect(() => {
    if (selectedInstanceId && instances.length > 0) {
      const instance = instances.find(i => i.id === selectedInstanceId);
      if (instance) {
        setSelectedInstance(instance);
      }
    }
  }, [selectedInstanceId, instances]);

  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === selectedChatId);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [selectedChatId, chats]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/instances');
      const connectedInstances = response.data.filter(
        (instance: Instance) => instance.status === 'connected'
      );
      setInstances(connectedInstances);
      
      // Selecionar a primeira instância se não houver uma selecionada
      if (!selectedInstance && connectedInstances.length > 0) {
        setSelectedInstance(connectedInstances[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async (instanceId: string) => {
    try {
      setChatLoading(true);
      const response = await api.get(`/api/instances/${instanceId}/chats`);
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      setChats([]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const response = await api.get(`/api/chats/${chatId}/messages`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (message: string, quotedMessageId?: string) => {
    if (!selectedChat || !message.trim()) return;

    try {
      // Adicionar mensagem temporária
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: selectedChat.id,
        instanceId: selectedInstance!.id,
        fromMe: true,
        from: 'me',
        to: selectedChat.contact.id,
        body: message,
        type: 'text',
        timestamp: new Date(),
        status: 'sending',
        quotedMessageId
      };

      setMessages(prev => [...prev, tempMessage]);

      // Enviar mensagem
      const response = await api.post(`/api/chats/${selectedChat.id}/messages`, {
        message,
        quotedMessageId
      });

      // Atualizar mensagem com resposta do servidor
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: response.data.messageId, status: 'sent' }
            : msg
        )
      );

      // Recarregar chats para atualizar última mensagem
      loadChats(selectedInstance!.id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Marcar mensagem como falha
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Faça login para acessar o chat.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-100">
        {/* Sidebar com lista de chats */}
        <ChatSidebar
          instances={instances}
          selectedInstance={selectedInstance}
          onInstanceSelect={setSelectedInstance}
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={setSelectedChat}
          loading={chatLoading}
        />

        {/* Área principal do chat */}
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            onSendMessage={sendMessage}
            loading={messagesLoading}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <ChatWelcome 
            hasInstances={instances.length > 0}
            selectedInstance={selectedInstance}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
