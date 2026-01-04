'use client';

import { useState } from 'react';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'negocio' | 'horarios' | 'profissionais' | 'whatsapp'>('negocio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuracoes</h1>
        <p className="text-gray-600">Gerencie as configuracoes do seu negocio</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'negocio', label: 'Negocio' },
            { id: 'horarios', label: 'Horarios' },
            { id: 'profissionais', label: 'Profissionais' },
            { id: 'whatsapp', label: 'WhatsApp' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'negocio' && (
          <form className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do estabelecimento
              </label>
              <input
                type="text"
                defaultValue="Salao Exemplo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                defaultValue="(11) 99999-9999"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="contato@salao.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereco
              </label>
              <input
                type="text"
                defaultValue="Rua Exemplo, 123 - Centro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  defaultValue="Sao Paulo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  defaultValue="SP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  defaultValue="01234-567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Salvar alteracoes
            </button>
          </form>
        )}

        {activeTab === 'horarios' && (
          <div className="space-y-6 max-w-2xl">
            <p className="text-gray-600">Configure os horarios de funcionamento do seu negocio.</p>
            {[
              { day: 'Segunda-feira', open: '09:00', close: '18:00', active: true },
              { day: 'Terca-feira', open: '09:00', close: '18:00', active: true },
              { day: 'Quarta-feira', open: '09:00', close: '18:00', active: true },
              { day: 'Quinta-feira', open: '09:00', close: '18:00', active: true },
              { day: 'Sexta-feira', open: '09:00', close: '18:00', active: true },
              { day: 'Sabado', open: '09:00', close: '14:00', active: true },
              { day: 'Domingo', open: '', close: '', active: false },
            ].map((schedule) => (
              <div key={schedule.day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 w-40">
                  <input
                    type="checkbox"
                    defaultChecked={schedule.active}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{schedule.day}</span>
                </label>
                {schedule.active && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue={schedule.open}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">ate</span>
                      <input
                        type="time"
                        defaultValue={schedule.close}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Salvar horarios
            </button>
          </div>
        )}

        {activeTab === 'profissionais' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Gerencie os profissionais do seu negocio.</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                + Adicionar profissional
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Ana Silva', role: 'Cabeleireira', color: '#7C3AED', active: true },
                { name: 'Carlos Santos', role: 'Barbeiro', color: '#EC4899', active: true },
                { name: 'Julia Oliveira', role: 'Cabeleireira', color: '#10B981', active: true },
              ].map((prof) => (
                <div key={prof.name} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: prof.color }}
                    >
                      {prof.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{prof.name}</p>
                      <p className="text-sm text-gray-500">{prof.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${prof.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-6 max-w-2xl">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">WhatsApp Conectado</h3>
                  <p className="text-sm text-green-600">+55 11 99999-9999</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Configuracoes do Bot</h3>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Respostas automaticas</p>
                  <p className="text-sm text-gray-500">Responder automaticamente mensagens fora do horario</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Lembretes automaticos</p>
                  <p className="text-sm text-gray-500">Enviar lembrete 24h antes do agendamento</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Confirmacao automatica</p>
                  <p className="text-sm text-gray-500">Confirmar agendamentos automaticamente</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>

            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Salvar configuracoes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
