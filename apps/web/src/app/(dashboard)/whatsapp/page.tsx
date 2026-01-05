'use client';

import { useState } from 'react';
import { WhatsAppConfigModal } from '@/components/WhatsAppConfigModal';

// TODO: Get from auth context
const MOCK_BUSINESS_ID = 'demo-business-id';

const mockConversations = [
  { id: '1', clientName: 'Maria Silva', lastMessage: 'Quero agendar um corte para amanha', time: '10:30', unread: 2, status: 'waiting' },
  { id: '2', clientName: 'Joao Santos', lastMessage: 'Confirmado! Ate amanha as 14h', time: '10:15', unread: 0, status: 'resolved' },
  { id: '3', clientName: 'Carla Oliveira', lastMessage: 'Qual horario tem disponivel?', time: '09:45', unread: 1, status: 'waiting' },
  { id: '4', clientName: 'Pedro Costa', lastMessage: 'Ok, vou remarcar entao', time: '09:30', unread: 0, status: 'resolved' },
  { id: '5', clientName: 'Ana Souza', lastMessage: 'Boa tarde! Gostaria de saber o preco da coloracao', time: 'Ontem', unread: 1, status: 'waiting' },
];

const mockMessages = [
  { id: '1', content: 'Ola! Gostaria de agendar um horario', direction: 'inbound', time: '10:25' },
  { id: '2', content: 'Ola Maria! Claro, qual servico voce gostaria?', direction: 'outbound', time: '10:26' },
  { id: '3', content: 'Quero fazer um corte', direction: 'inbound', time: '10:28' },
  { id: '4', content: 'Otimo! Temos horarios disponiveis amanha. Qual horario seria melhor para voce?', direction: 'outbound', time: '10:29' },
  { id: '5', content: 'Quero agendar um corte para amanha', direction: 'inbound', time: '10:30' },
];

export default function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas conversas</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Configurar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 h-[calc(100%-5rem)] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar conversa..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 ${
                  selectedConversation === conv.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium shrink-0">
                    {conv.clientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 truncate">{conv.clientName}</p>
                      <span className="text-xs text-gray-500">{conv.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium">
                  {selectedConv.clientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedConv.clientName}</p>
                  <p className="text-xs text-gray-500">Ultima mensagem: {selectedConv.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg">
                  Ver perfil
                </button>
                <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Agendar
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      msg.direction === 'outbound'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400'
                    }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  disabled={!message.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione uma conversa
          </div>
        )}
      </div>

      <WhatsAppConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        businessId={MOCK_BUSINESS_ID}
        onStatusChange={setIsConnected}
      />
    </div>
  );
}
