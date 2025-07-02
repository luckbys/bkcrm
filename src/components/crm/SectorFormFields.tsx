import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { sectorSchema, type SectorFormFieldsProps } from './SectorFormFields.types';

export function SectorFormFieldsComponent({ 
  defaultValues, 
  onSubmit,
  isLoading,
  error 
}: SectorFormFieldsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sectorSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Setor</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Suporte Técnico"
          className="w-full"
          disabled={isLoading}
        />
        {errors.name && (
          <span className="text-sm text-red-500">{errors.name.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select onValueChange={(value) => register('type').onChange({ target: { value } })} defaultValue={defaultValues?.type || 'default'}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="support">Suporte</SelectItem>
            <SelectItem value="sales">Vendas</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="development">Desenvolvimento</SelectItem>
            <SelectItem value="finance">Financeiro</SelectItem>
            <SelectItem value="hr">RH</SelectItem>
            <SelectItem value="legal">Jurídico</SelectItem>
            <SelectItem value="operations">Operações</SelectItem>
            <SelectItem value="logistics">Logística</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <span className="text-sm text-red-500">{errors.type.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descreva o propósito deste setor..."
          className="w-full min-h-[100px]"
          disabled={isLoading}
        />
        {errors.description && (
          <span className="text-sm text-red-500">{errors.description.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade</Label>
        <Select onValueChange={(value) => register('priority').onChange({ target: { value } })} defaultValue={defaultValues?.priority || 'normal'}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority && (
          <span className="text-sm text-red-500">{errors.priority.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Ícone (opcional)</Label>
        <Input
          id="icon"
          {...register('icon')}
          placeholder="Ex: UserGroupIcon"
          className="w-full"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Cor (opcional)</Label>
        <Input
          id="color"
          type="color"
          {...register('color')}
          className="w-full h-10"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 mt-2">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
} 