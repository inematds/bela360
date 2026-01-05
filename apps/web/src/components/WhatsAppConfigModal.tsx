'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, CheckCircle, XCircle, RefreshCw, QrCode } from 'lucide-react';
import { whatsappApi, WhatsAppStatus } from '@/lib/api';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onStatusChange?: (connected: boolean) => void;
}

type ConnectionState = 'checking' | 'disconnected' | 'connecting' | 'connected' | 'error';

export function WhatsAppConfigModal({
  isOpen,
  onClose,
  businessId,
  onStatusChange,
}: WhatsAppConfigModalProps) {
  const [state, setState] = useState<ConnectionState>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setState('checking');
      setError(null);
      const result = await whatsappApi.getStatus(businessId);
      setStatus(result);
      setState(result.connected ? 'connected' : 'disconnected');
      onStatusChange?.(result.connected);
    } catch (err) {
      // If not configured yet, show as disconnected
      setState('disconnected');
      setStatus(null);
    }
  }, [businessId, onStatusChange]);

  useEffect(() => {
    if (isOpen && businessId) {
      checkStatus();
    }
  }, [isOpen, businessId, checkStatus]);

  // Poll for status while connecting
  useEffect(() => {
    if (state !== 'connecting') return;

    const interval = setInterval(async () => {
      try {
        const result = await whatsappApi.getStatus(businessId);
        if (result.connected) {
          setState('connected');
          setStatus(result);
          setQrCode(null);
          onStatusChange?.(true);
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [state, businessId, onStatusChange]);

  const handleConnect = async () => {
    try {
      setState('connecting');
      setError(null);
      const result = await whatsappApi.connect(businessId);
      setQrCode(result.qrcode);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
    }
  };

  const handleDisconnect = async () => {
    try {
      setState('checking');
      await whatsappApi.disconnect(businessId);
      setState('disconnected');
      setStatus(null);
      setQrCode(null);
      onStatusChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar');
      setState('connected');
    }
  };

  const handleRefreshQR = async () => {
    try {
      const result = await whatsappApi.getQRCode(businessId);
      setQrCode(result.qrcode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar QR Code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Configurar WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Checking status */}
          {state === 'checking' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              <p className="mt-4 text-gray-600">Verificando conexao...</p>
            </div>
          )}

          {/* Disconnected - Show connect button */}
          {state === 'disconnected' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                WhatsApp Desconectado
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Conecte seu WhatsApp para receber e enviar mensagens automaticamente.
              </p>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Conectar WhatsApp
              </button>
            </div>
          )}

          {/* Connecting - Show QR Code */}
          {state === 'connecting' && (
            <div className="flex flex-col items-center py-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Escaneie o QR Code
              </h3>
              <p className="text-gray-500 text-center text-sm mb-4">
                Abra o WhatsApp no seu celular, va em Dispositivos conectados e escaneie o codigo abaixo.
              </p>

              {qrCode ? (
                <div className="relative">
                  <div className="bg-white p-4 rounded-xl border-2 border-purple-100">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  </div>
                  <button
                    onClick={handleRefreshQR}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar QR
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-64 h-64 bg-gray-50 rounded-xl">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}

              <p className="mt-8 text-sm text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Aguardando leitura do QR Code...
              </p>
            </div>
          )}

          {/* Connected */}
          {state === 'connected' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                WhatsApp Conectado
              </h3>
              <p className="text-gray-500 text-center text-sm mb-2">
                Seu WhatsApp esta conectado e pronto para uso.
              </p>
              {status?.connectedAt && (
                <p className="text-xs text-gray-400 mb-6">
                  Conectado desde: {new Date(status.connectedAt).toLocaleString('pt-BR')}
                </p>
              )}
              <button
                onClick={handleDisconnect}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Desconectar
              </button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Erro na Conexao
              </h3>
              <p className="text-red-500 text-center text-sm mb-6">
                {error || 'Ocorreu um erro ao conectar. Tente novamente.'}
              </p>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
