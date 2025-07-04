import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { channelOptions, statusOptions } from '@/data/sectors';
export const AddTicketModal = ({ sector, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        client: '',
        email: '',
        phone: '',
        subject: '',
        description: '',
        priority: 'normal',
        channel: 'whatsapp',
        status: 'pendente',
        assignee: ''
    });
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleSave = () => {
        const ticketData = {
            ...formData,
            sector: sector.name,
            sectorId: sector.id,
            created: new Date().toISOString()
        };
        onSave(ticketData);
    };
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Novo Ticket - ", sector.name] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "client", children: "Nome do Cliente *" }), _jsx(Input, { id: "client", value: formData.client, onChange: (e) => handleInputChange('client', e.target.value), placeholder: "Digite o nome do cliente" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), placeholder: "cliente@email.com" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Telefone" }), _jsx(Input, { id: "phone", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), placeholder: "(11) 99999-9999" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "channel", children: "Canal" }), _jsxs(Select, { value: formData.channel, onValueChange: (value) => handleInputChange('channel', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: channelOptions.map(option => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "subject", children: "Assunto *" }), _jsx(Input, { id: "subject", value: formData.subject, onChange: (e) => handleInputChange('subject', e.target.value), placeholder: "Descreva brevemente o problema" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Descri\u00E7\u00E3o" }), _jsx(Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), placeholder: "Descreva detalhadamente o problema ou solicita\u00E7\u00E3o", rows: 4 })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", children: "Prioridade" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => handleInputChange('priority', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "baixa", children: "Baixa" }), _jsx(SelectItem, { value: "normal", children: "Normal" }), _jsx(SelectItem, { value: "alta", children: "Alta" }), _jsx(SelectItem, { value: "urgente", children: "Urgente" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange('status', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: statusOptions.map(option => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "assignee", children: "Respons\u00E1vel" }), _jsxs(Select, { value: formData.assignee, onValueChange: (value) => handleInputChange('assignee', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecionar" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "auto", children: "Atribui\u00E7\u00E3o Autom\u00E1tica" }), _jsx(SelectItem, { value: "user1", children: "Jo\u00E3o Silva" }), _jsx(SelectItem, { value: "user2", children: "Maria Santos" }), _jsx(SelectItem, { value: "user3", children: "Pedro Costa" })] })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: !formData.client || !formData.subject, children: "Criar Ticket" })] })] })] }) }));
};
