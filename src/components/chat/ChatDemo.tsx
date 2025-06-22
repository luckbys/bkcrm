import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { UnifiedChatModal } from './UnifiedChatModal';
import { MessageSquare, Play, Sparkles } from 'lucide-react';

export const ChatDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  const demoScenarios = [
    {
      id: 'whatsapp',
      title: 'Chat WhatsApp',
      description: 'Simulacao de conversa via WhatsApp',
      clientName: 'Joao Silva',
      clientPhone: '+55 11 99999-9999',
      ticketId: 'WA001',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'email',
      title: 'Chat por Email',
      description: 'Simulacao de conversa via email',
      clientName: 'Maria Santos',
      clientPhone: '+55 11 88888-8888',
      ticketId: 'EM002',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'site',
      title: 'Chat do Site',
      description: 'Simulacao de conversa via chat do site',
      clientName: 'Pedro Costa',
      clientPhone: '+55 11 77777-7777',
      ticketId: 'WB003',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const handleOpenDemo = (scenario: typeof demoScenarios[0]) => {
    setSelectedDemo(scenario.id);
    setIsModalOpen(true);
  };

  const selectedScenario = demoScenarios.find(s => s.id === selectedDemo);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema de Chat CRM
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Demonstracao interativa do sistema de chat unificado. 
          Escolha um cenario abaixo para testar as funcionalidades.
        </p>
      </div>

      {/* Cenarios de Demonstracao */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {demoScenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-white"
          >
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${scenario.color} rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {scenario.title}
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {scenario.description}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Cliente:</span> {scenario.clientName}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Ticket:</span> #{scenario.ticketId}
                </div>
              </div>
              
              <Button 
                onClick={() => handleOpenDemo(scenario)}
                className={`w-full bg-gradient-to-r ${scenario.color} hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                <Play className="w-4 h-4 mr-2" />
                Testar Chat
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Funcionalidades */}
      <Card className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Funcionalidades do Chat
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '💬', title: 'Mensagens', desc: 'Envio e recebimento em tempo real' },
            { icon: '🔒', title: 'Notas Internas', desc: 'Comunicacao privada da equipe' },
            { icon: '↩️', title: 'Responder', desc: 'Sistema de citacao de mensagens' },
            { icon: '😀', title: 'Emojis', desc: 'Seletor completo de emojis' },
            { icon: '📎', title: 'Anexos', desc: 'Envio de arquivos e midia' },
            { icon: '📞', title: 'Chamadas', desc: 'Integracao com telefonia' },
            { icon: '⚡', title: 'Tempo Real', desc: 'Atualizacoes instantaneas' },
            { icon: '📱', title: 'Responsivo', desc: 'Funciona em todos dispositivos' }
          ].map((feature, index) => (
            <div key={index} className="text-center p-4">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal do Chat */}
      {selectedScenario && (
        <UnifiedChatModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticketId={selectedScenario.ticketId}
          clientName={selectedScenario.clientName}
          clientPhone={selectedScenario.clientPhone}
        />
      )}
    </div>
  );
}; 