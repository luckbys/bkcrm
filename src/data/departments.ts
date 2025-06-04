import { Department } from '@/types/evolution-api';

export const departments: Department[] = [
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Equipe responsável por vendas e prospecção de clientes',
    color: 'blue',
    icon: 'TrendingUp',
    isActive: true,
  },
  {
    id: 'support',
    name: 'Suporte Técnico',
    description: 'Atendimento técnico e resolução de problemas',
    color: 'green',
    icon: 'Headphones',
    isActive: true,
  },
  {
    id: 'customer-service',
    name: 'Atendimento ao Cliente',
    description: 'Atendimento geral e informações',
    color: 'purple',
    icon: 'Users',
    isActive: true,
  },
  {
    id: 'billing',
    name: 'Financeiro',
    description: 'Cobrança, pagamentos e questões financeiras',
    color: 'amber',
    icon: 'CreditCard',
    isActive: true,
  },
  {
    id: 'hr',
    name: 'Recursos Humanos',
    description: 'Gestão de pessoas e recursos humanos',
    color: 'pink',
    icon: 'UserCheck',
    isActive: false,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campanhas, divulgação e relacionamento',
    color: 'orange',
    icon: 'Megaphone',
    isActive: true,
  },
]; 