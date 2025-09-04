import React from 'react';
import { useUiStore } from '../store/uiStore';
import { X, CreditCard, Star, Zap } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <Star className="text-yellow-300" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade para Premium</h2>
              <p className="text-purple-100 text-sm">Desbloqueie músicas ilimitadas</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">🔒 Limite de músicas gratuitas atingido</p>
              <p className="text-red-600 text-sm mt-1">
                Você já criou sua música gratuita. Faça upgrade para continuar!
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-1 rounded-full">
                <Zap className="text-green-600" size={16} />
              </div>
              <span className="text-gray-700">Músicas ilimitadas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-1 rounded-full">
                <Star className="text-blue-600" size={16} />
              </div>
              <span className="text-gray-700">Qualidade premium</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-1 rounded-full">
                <CreditCard className="text-purple-600" size={16} />
              </div>
              <span className="text-gray-700">Sem anúncios</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">R$ 19,90</div>
              <div className="text-sm text-gray-600">por mês</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Fazer Upgrade Agora
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Talvez mais tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;