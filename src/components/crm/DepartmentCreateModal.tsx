import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { 
  Building2, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Target,
  MessageSquare
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Department } from '../../types/department'

interface DepartmentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, priority: Department['priority'], description?: string) => Promise<void>
  isLoading?: boolean
  editMode?: boolean
  initialData?: {
    name: string
    priority: Department['priority']
    description?: string
  }
}

const priorityOptions = [
  {
    value: 'high' as const,
    label: 'Alta Prioridade',
    description: 'Departamento crítico com atendimento prioritário',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  {
    value: 'medium' as const,
    label: 'Prioridade Média',
    description: 'Departamento padrão com atendimento regular',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  {
    value: 'low' as const,
    label: 'Baixa Prioridade',
    description: 'Departamento com atendimento quando possível',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  }
]

const departmentTemplates = [
  {
    name: 'Atendimento ao Cliente',
    priority: 'high' as const,
    description: 'Suporte geral e resolução de problemas dos clientes'
  },
  {
    name: 'Vendas',
    priority: 'high' as const,
    description: 'Captação de leads e fechamento de vendas'
  },
  {
    name: 'Suporte Técnico',
    priority: 'medium' as const,
    description: 'Assistência técnica especializada'
  },
  {
    name: 'Financeiro',
    priority: 'medium' as const,
    description: 'Cobrança, pagamentos e questões financeiras'
  },
  {
    name: 'RH - Recursos Humanos',
    priority: 'low' as const,
    description: 'Gestão de pessoas e processos internos'
  },
  {
    name: 'Marketing',
    priority: 'low' as const,
    description: 'Campanhas, promoções e relacionamento'
  }
]

export const DepartmentCreateModal: React.FC<DepartmentCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  editMode = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name || '')
  const [priority, setPriority] = useState<Department['priority']>(initialData?.priority || 'medium')
  const [description, setDescription] = useState(initialData?.description || '')
  const [step, setStep] = useState<'template' | 'custom'>(editMode ? 'custom' : 'template')

  const selectedPriority = priorityOptions.find(p => p.value === priority)

  const handleTemplateSelect = (template: typeof departmentTemplates[0]) => {
    setName(template.name)
    setPriority(template.priority)
    setDescription(template.description)
    setStep('custom')
  }

  const handleCustomStart = () => {
    setName('')
    setPriority('medium')
    setDescription('')
    setStep('custom')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    try {
      await onSubmit(name.trim(), priority, description.trim() || undefined)
      handleClose()
    } catch (error) {
      console.error('Erro ao criar departamento:', error)
    }
  }

  const handleClose = () => {
    if (editMode && initialData) {
      // Em modo de edição, voltar aos valores iniciais
      setName(initialData.name)
      setPriority(initialData.priority)
      setDescription(initialData.description || '')
    } else {
      // Em modo de criação, limpar tudo
      setName('')
      setPriority('medium')
      setDescription('')
      setStep('template')
    }
    onClose()
  }

  const isValid = name.trim().length >= 2

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {editMode ? 'Editar Departamento' : 'Novo Departamento'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {editMode 
                  ? 'Atualize as informações do departamento'
                  : step === 'template' 
                    ? 'Escolha um template ou crie do zero' 
                    : 'Configure os detalhes do departamento'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'template' ? (
          <div className="space-y-4">
            {/* Templates pré-definidos */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Templates Sugeridos
              </h3>
              <div className="grid gap-2">
                {departmentTemplates.map((template, index) => {
                  const templatePriority = priorityOptions.find(p => p.value === template.priority)
                  return (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {template.description}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs ml-2",
                            templatePriority?.color
                          )}
                        >
                          {templatePriority?.label.split(' ')[0]}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Opção customizada */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCustomStart}
                className="w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
                    <Target className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Criar do Zero
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Configure manualmente todos os detalhes
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do departamento */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do Departamento *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Atendimento ao Cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Mínimo 2 caracteres. Este nome aparecerá nos tickets e relatórios.
              </p>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <div className="grid gap-2">
                {priorityOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = priority === option.value
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      disabled={isLoading}
                      className={cn(
                        "w-full p-3 text-left rounded-lg border transition-all duration-200",
                        isSelected
                          ? `${option.bgColor} ${option.borderColor} border-2`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isSelected ? option.bgColor : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            isSelected ? option.color : "text-gray-600 dark:text-gray-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {option.label}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição (Opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva as responsabilidades e escopo deste departamento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Ajuda a identificar rapidamente o propósito do departamento.
              </p>
            </div>

            {/* Preview */}
            {name && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Preview
                </h4>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    selectedPriority?.bgColor
                  )}>
                    <Building2 className={cn("w-4 h-4", selectedPriority?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {name}
                    </h5>
                    {description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={selectedPriority?.color}>
                    {selectedPriority?.label.split(' ')[0]}
                  </Badge>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className={cn(
              "flex items-center pt-2",
              editMode ? "justify-end" : "justify-between"
            )}>
              {!editMode && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('template')}
                  disabled={isLoading}
                  className="text-sm"
                >
                  ← Voltar aos templates
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editMode ? 'Salvando...' : 'Criando...'}
                    </div>
                  ) : (
                    editMode ? 'Salvar Alterações' : 'Criar Departamento'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default DepartmentCreateModal 