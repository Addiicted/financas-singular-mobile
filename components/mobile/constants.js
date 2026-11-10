// components/mobile/constants.js
// Listas de ícones e cores (mesmas opções da tela Configurações do desktop).
import {
  Home, Utensils, Car, Briefcase, HeartPulse, GraduationCap, Plane, Zap,
  ShoppingBag, Laptop, TrendingUp, DollarSign, Gift, Shield, Phone, Layers,
} from 'lucide-react';

export const ICON_MAP = {
  Home, Utensils, Car, Briefcase, HeartPulse, GraduationCap, Plane, Zap,
  ShoppingBag, Laptop, TrendingUp, DollarSign, Gift, Shield, Phone, Layers,
};

export const AVAILABLE_ICONS = [
  { name: 'Home', label: 'Moradia' },
  { name: 'Utensils', label: 'Alimentação' },
  { name: 'Car', label: 'Transporte' },
  { name: 'Briefcase', label: 'Trabalho' },
  { name: 'HeartPulse', label: 'Saúde' },
  { name: 'GraduationCap', label: 'Educação' },
  { name: 'Plane', label: 'Viagem' },
  { name: 'Zap', label: 'Serviços' },
  { name: 'ShoppingBag', label: 'Compras' },
  { name: 'Laptop', label: 'Tecnologia' },
  { name: 'TrendingUp', label: 'Investimentos' },
  { name: 'DollarSign', label: 'Renda' },
  { name: 'Gift', label: 'Presentes' },
  { name: 'Shield', label: 'Seguros' },
  { name: 'Phone', label: 'Comunicação' },
  { name: 'Layers', label: 'Geral' },
];

export const ICON_COLORS = [
  { name: 'indigo', label: 'Índigo', circle: 'bg-indigo-500' },
  { name: 'emerald', label: 'Esmeralda', circle: 'bg-emerald-500' },
  { name: 'rose', label: 'Vermelho', circle: 'bg-rose-500' },
  { name: 'amber', label: 'Âmbar', circle: 'bg-amber-400' },
  { name: 'purple', label: 'Roxo', circle: 'bg-purple-500' },
  { name: 'sky', label: 'Azul Céu', circle: 'bg-sky-400' },
  { name: 'pink', label: 'Pink', circle: 'bg-pink-500' },
  { name: 'teal', label: 'Verde Água', circle: 'bg-teal-500' },
  { name: 'orange', label: 'Laranja', circle: 'bg-orange-500' },
  { name: 'slate', label: 'Neutro', circle: 'bg-slate-400' },
];

export const ACCOUNT_COLORS = [
  { label: 'Roxo (Nubank)', value: 'bg-purple-600' },
  { label: 'Laranja (Inter)', value: 'bg-orange-500' },
  { label: 'Azul (Itaú / Caixa)', value: 'bg-blue-600' },
  { label: 'Vermelho (Santander / Bradesco)', value: 'bg-rose-600' },
  { label: 'Amarelo (Banco do Brasil)', value: 'bg-amber-400' },
  { label: 'Verde (Sicredi / Sicoob)', value: 'bg-emerald-600' },
  { label: 'Azul Claro (C6 / Mercado Pago)', value: 'bg-sky-500' },
  { label: 'Rosa', value: 'bg-pink-600' },
  { label: 'Cinza / Neutro', value: 'bg-slate-600' },
  { label: 'Verde Água', value: 'bg-teal-500' },
];
