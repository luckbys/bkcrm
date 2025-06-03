
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SalesFunnelProps {
  sector: any;
}

export const SalesFunnel = ({ sector }: SalesFunnelProps) => {
  const funnelStages = [
    { name: 'Leads', count: 150, percentage: 100, color: 'bg-blue-500' },
    { name: 'Qualificados', count: 90, percentage: 60, color: 'bg-green-500' },
    { name: 'Propostas', count: 45, percentage: 30, color: 'bg-orange-500' },
    { name: 'Negociação', count: 25, percentage: 17, color: 'bg-purple-500' },
    { name: 'Fechados', count: 12, percentage: 8, color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Funil de Vendas - {sector.name}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Taxa de Conversão: 8%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {funnelStages.map((stage, index) => (
          <Card key={stage.name} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">
                {stage.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold mb-2">{stage.count}</div>
              <Progress 
                value={stage.percentage} 
                className="h-2 mb-2"
              />
              <div className="text-sm text-gray-600">{stage.percentage}%</div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${stage.color}`} />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades em Andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { client: 'Empresa ABC Ltda', value: 'R$ 15.000', stage: 'Negociação', probability: 75 },
              { client: 'Tech Solutions', value: 'R$ 8.500', stage: 'Proposta', probability: 50 },
              { client: 'Inovação Corp', value: 'R$ 22.000', stage: 'Qualificado', probability: 25 }
            ].map((opportunity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{opportunity.client}</div>
                  <div className="text-sm text-gray-600">Valor: {opportunity.value}</div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{opportunity.stage}</Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    {opportunity.probability}% probabilidade
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
