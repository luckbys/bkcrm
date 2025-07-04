import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { customerCategories, customerChannels, responsibleAgents, customerStatuses } from '@/data/customers';
import { X, Save, User, Building, MapPin } from 'lucide-react';
export const AddCustomerModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        document: '',
        documentType: 'cpf',
        company: '',
        position: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        },
        status: 'prospect',
        category: 'bronze',
        channel: 'whatsapp',
        tags: [],
        notes: '',
        customerSince: new Date().toISOString().split('T')[0],
        lastInteraction: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalValue: 0,
        averageTicket: 0,
        responsibleAgent: 'Ana Costa'
    });
    const [errors, setErrors] = useState({});
    const [currentTag, setCurrentTag] = useState('');
    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
        // Limpar erro quando usuário começar a digitar
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };
    const addTag = () => {
        if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, currentTag.trim()]
            }));
            setCurrentTag('');
        }
    };
    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim())
            newErrors.name = 'Nome é obrigatório';
        if (!formData.email.trim())
            newErrors.email = 'Email é obrigatório';
        if (!formData.phone.trim())
            newErrors.phone = 'Telefone é obrigatório';
        if (!formData.document.trim())
            newErrors.document = 'CPF/CNPJ é obrigatório';
        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = () => {
        if (validateForm()) {
            onSave(formData);
            onClose();
            // Resetar formulário
            setFormData({
                name: '',
                email: '',
                phone: '',
                document: '',
                documentType: 'cpf',
                company: '',
                position: '',
                address: {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: ''
                },
                status: 'prospect',
                category: 'bronze',
                channel: 'whatsapp',
                tags: [],
                notes: '',
                customerSince: new Date().toISOString().split('T')[0],
                lastInteraction: new Date().toISOString().split('T')[0],
                totalOrders: 0,
                totalValue: 0,
                averageTicket: 0,
                responsibleAgent: 'Ana Costa'
            });
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5 text-blue-600" }), "Cadastrar Novo Cliente"] }), _jsx(DialogDescription, { children: "Preencha as informa\u00E7\u00F5es do cliente. Campos marcados com * s\u00E3o obrigat\u00F3rios." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 py-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(User, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Informa\u00E7\u00F5es B\u00E1sicas" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "Nome Completo *" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: errors.name ? 'border-red-500' : '', placeholder: "Ex: Jo\u00E3o Silva" }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), className: errors.email ? 'border-red-500' : '', placeholder: "joao@email.com" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Telefone *" }), _jsx(Input, { id: "phone", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), className: errors.phone ? 'border-red-500' : '', placeholder: "(11) 99999-9999" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Tipo de Documento" }), _jsxs(Select, { value: formData.documentType, onValueChange: (value) => handleInputChange('documentType', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "cpf", children: "CPF" }), _jsx(SelectItem, { value: "cnpj", children: "CNPJ" })] })] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "document", children: [formData.documentType.toUpperCase(), " *"] }), _jsx(Input, { id: "document", value: formData.document, onChange: (e) => handleInputChange('document', e.target.value), className: errors.document ? 'border-red-500' : '', placeholder: formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00' }), errors.document && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.document })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Building, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Informa\u00E7\u00F5es Profissionais" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "company", children: "Empresa" }), _jsx(Input, { id: "company", value: formData.company, onChange: (e) => handleInputChange('company', e.target.value), placeholder: "Nome da empresa" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "position", children: "Cargo" }), _jsx(Input, { id: "position", value: formData.position, onChange: (e) => handleInputChange('position', e.target.value), placeholder: "Ex: Diretor, CEO, Gerente" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange('status', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerStatuses.filter(s => s.value !== 'todos').map(status => (_jsx(SelectItem, { value: status.value, children: status.label }, status.value))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Categoria" }), _jsxs(Select, { value: formData.category, onValueChange: (value) => handleInputChange('category', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerCategories.filter(c => c.value !== 'todos').map(category => (_jsx(SelectItem, { value: category.value, children: category.label }, category.value))) })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Canal de Origem" }), _jsxs(Select, { value: formData.channel, onValueChange: (value) => handleInputChange('channel', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerChannels.filter(c => c.value !== 'todos').map(channel => (_jsx(SelectItem, { value: channel.value, children: channel.label }, channel.value))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Agente Respons\u00E1vel" }), _jsxs(Select, { value: formData.responsibleAgent, onValueChange: (value) => handleInputChange('responsibleAgent', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: responsibleAgents.filter(a => a.value !== 'todos').map(agent => (_jsx(SelectItem, { value: agent.value, children: agent.label }, agent.value))) })] })] })] })] }), _jsxs("div", { className: "space-y-4 md:col-span-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Endere\u00E7o" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx(Label, { htmlFor: "street", children: "Rua" }), _jsx(Input, { id: "street", value: formData.address.street, onChange: (e) => handleInputChange('address.street', e.target.value), placeholder: "Nome da rua" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "number", children: "N\u00FAmero" }), _jsx(Input, { id: "number", value: formData.address.number, onChange: (e) => handleInputChange('address.number', e.target.value), placeholder: "123" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "complement", children: "Complemento" }), _jsx(Input, { id: "complement", value: formData.address.complement, onChange: (e) => handleInputChange('address.complement', e.target.value), placeholder: "Apt 45" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "neighborhood", children: "Bairro" }), _jsx(Input, { id: "neighborhood", value: formData.address.neighborhood, onChange: (e) => handleInputChange('address.neighborhood', e.target.value), placeholder: "Centro" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: "Cidade" }), _jsx(Input, { id: "city", value: formData.address.city, onChange: (e) => handleInputChange('address.city', e.target.value), placeholder: "S\u00E3o Paulo" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "state", children: "Estado" }), _jsx(Input, { id: "state", value: formData.address.state, onChange: (e) => handleInputChange('address.state', e.target.value), placeholder: "SP" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "zipCode", children: "CEP" }), _jsx(Input, { id: "zipCode", value: formData.address.zipCode, onChange: (e) => handleInputChange('address.zipCode', e.target.value), placeholder: "01234-567" })] })] })] }), _jsxs("div", { className: "space-y-4 md:col-span-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Informa\u00E7\u00F5es Adicionais" }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "tags", children: "Tags" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx(Input, { id: "tags", value: currentTag, onChange: (e) => setCurrentTag(e.target.value), placeholder: "Digite uma tag e pressione Enter", onKeyPress: (e) => e.key === 'Enter' && addTag() }), _jsx(Button, { type: "button", onClick: addTag, size: "sm", children: "Adicionar" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: formData.tags.map((tag, index) => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm", children: [tag, _jsx("button", { type: "button", onClick: () => removeTag(tag), className: "ml-1 text-blue-600 hover:text-blue-800", children: _jsx(X, { className: "w-3 h-3" }) })] }, index))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "notes", children: "Observa\u00E7\u00F5es" }), _jsx(Textarea, { id: "notes", value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), placeholder: "Informa\u00E7\u00F5es adicionais sobre o cliente...", rows: 4 })] })] })] }), _jsxs(DialogFooter, { className: "gap-2", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }), _jsxs(Button, { onClick: handleSave, className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Salvar Cliente"] })] })] }) }));
};
