import { MessageCircle, Smartphone } from 'lucide-react';
import { Instance } from '@/types/api';

interface ChatWelcomeProps {
  hasInstances: boolean;
  selectedInstance: Instance | null;
}

export default function ChatWelcome({ hasInstances, selectedInstance }: ChatWelcomeProps) {
  if (!hasInstances) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Nenhuma instância conectada
          </h2>
          <p className="text-gray-600 mb-6">
            Para começar a usar o chat, você precisa ter pelo menos uma instância do WhatsApp conectada.
          </p>
          <a
            href="/conexao"
            className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Conectar WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (!selectedInstance) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Selecione uma instância
          </h2>
          <p className="text-gray-600">
            Escolha uma instância do WhatsApp na barra lateral para ver suas conversas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Bem-vindo ao WhatsApp Web
        </h2>
        <p className="text-gray-600 mb-6">
          Selecione uma conversa para começar a enviar e receber mensagens com a instância{' '}
          <span className="font-medium text-green-600">{selectedInstance.name}</span>.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Use a barra de busca para encontrar conversas rapidamente!
          </p>
        </div>
      </div>
    </div>
  );
}
