import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Users, 
  Settings,
  Wrench,
  User,
  Building,
  AlertCircle
} from 'lucide-react';
import { runDepartmentDiagnostic, checkDepartmentIssues, DepartmentIssue } from '@/utils/fixDepartmentIssues';
import { toast } from '@/hooks/use-toast';

export const DepartmentDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<DepartmentIssue[]>([]);
  const [lastDiagnostic, setLastDiagnostic] = useState<Date | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      
      const result = await runDepartmentDiagnostic();
      
      setIssues(result.issues);
      setLastDiagnostic(new Date());
      setHasRun(true);

      if (result.issues.length === 0) {
        toast({
          title: "✅ Sistema OK",
          description: "Nenhum problema de departamento encontrado.",
        });
      } else {
        toast({
          title: "🔧 Problemas corrigidos",
          description: `${result.issues.length} problemas encontrados e corrigidos automaticamente.`,
        });
      }
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      toast({
        title: "❌ Erro no diagnóstico",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkOnly = async () => {
    try {
      setLoading(true);
      
      const foundIssues = await checkDepartmentIssues();
      
      setIssues(foundIssues);
      setLastDiagnostic(new Date());
      setHasRun(true);

      if (foundIssues.length === 0) {
        toast({
          title: "✅ Sistema OK",
          description: "Nenhum problema de departamento encontrado.",
        });
      } else {
        toast({
          title: "⚠️ Problemas encontrados",
          description: `${foundIssues.length} problemas detectados. Use "Executar Correção" para corrigir.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
      toast({
        title: "❌ Erro na verificação",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Settings className="w-4 h-4 text-red-600" />;
      case 'agent': return <User className="w-4 h-4 text-blue-600" />;
      case 'customer': return <Users className="w-4 h-4 text-green-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      agent: 'bg-blue-100 text-blue-800 border-blue-200',
      customer: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge className={variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Diagnóstico de Departamentos</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Verifique e corrija problemas relacionados à separação de tickets por departamento
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Button 
              onClick={checkOnly} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              Verificar Apenas
            </Button>
            
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 mr-2" />
              )}
              Executar Correção
            </Button>
          </div>

          {lastDiagnostic && (
            <p className="text-xs text-gray-500 text-center">
              Última verificação: {lastDiagnostic.toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      {hasRun && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {issues.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <span>Resultado do Diagnóstico</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sistema OK</AlertTitle>
                <AlertDescription>
                  Todos os usuários estão corretamente atribuídos aos seus departamentos.
                  O filtro de tickets por setor deve estar funcionando corretamente.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Problemas Encontrados</AlertTitle>
                  <AlertDescription>
                    {issues.length} problema(s) detectado(s) que podem estar causando a visibilidade incorreta de tickets entre setores.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Detalhes dos Problemas:</h4>
                  {issues.map((issue, index) => (
                    <Card key={index} className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(issue.userRole)}
                              <span className="font-medium">{issue.userName}</span>
                              {getRoleBadge(issue.userRole)}
                            </div>
                            
                            <p className="text-sm text-gray-600">{issue.userEmail}</p>
                            
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-red-600 font-medium">Problema:</span>
                              <span>{issue.issue}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-blue-600 font-medium">Correção:</span>
                              <span>{issue.suggested_fix}</span>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Badge variant="outline" className="border-amber-200 text-amber-800">
                              ID: {issue.userId.slice(0, 8)}...
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Como funciona o filtro por departamento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>Customers:</strong> Veem apenas seus próprios tickets</p>
          <p><strong>Agents:</strong> Veem apenas tickets do seu departamento</p>
          <p><strong>Admins com departamento:</strong> Veem apenas tickets do seu departamento</p>
          <p><strong>Admins sem departamento:</strong> Veem todos os tickets (super admin)</p>
          
          <Separator className="my-3" />
          
          <p className="text-xs text-gray-500">
            💡 Se os tickets ainda estão aparecendo para outros setores, execute o diagnóstico para identificar e corrigir configurações incorretas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 