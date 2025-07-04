import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { customerCategories, customerChannels, responsibleAgents, customerStatuses } from '@/data/customers';
import { X, Save, User, Building, MapPin, Edit } from 'lucide-react';
export const EditCustomerModal = ({ customer, isOpen, onClose, onSave }) => {
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
        customerSince: '',
        lastInteraction: '',
        totalOrders: 0,
        totalValue: 0,
        averageTicket: 0,
        responsibleAgent: ''
    });
    const [errors, setErrors] = useState({});
    const [currentTag, setCurrentTag] = useState('');
    // Preencher os dados do formulário quando o cliente for selecionado
    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                document: customer.document,
                documentType: customer.documentType,
                company: customer.company,
                position: customer.position,
                address: customer.address,
                status: customer.status,
                category: customer.category,
                channel: customer.channel,
                tags: customer.tags,
                notes: customer.notes,
                customerSince: customer.customerSince,
                lastInteraction: customer.lastInteraction,
                totalOrders: customer.totalOrders,
                totalValue: customer.totalValue,
                averageTicket: customer.averageTicket,
                responsibleAgent: customer.responsibleAgent
            });
        }
    }, [customer]);
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
        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        }
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefone é obrigatório';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = () => {
        if (!validateForm() || !customer)
            return;
        const updatedCustomer = {
            ...customer,
            ...formData,
            id: customer.id,
            createdAt: customer.createdAt,
            updatedAt: new Date().toISOString()
        };
        onSave(updatedCustomer);
    };
    const handleClose = () => {
        setErrors({});
        setCurrentTag('');
        onClose();
    };
    if (!customer)
        return null;
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Edit, { className: "w-5 h-5 text-blue-600" }), "Editar Cliente - ", customer.name] }), _jsx(DialogDescription, { children: "Atualize as informa\u00E7\u00F5es do cliente. Campos marcados com * s\u00E3o obrigat\u00F3rios." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 py-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(User, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Informa\u00E7\u00F5es B\u00E1sicas" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "Nome Completo *" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: errors.name ? 'border-red-500' : '', placeholder: "Ex: Jo\u00E3o Silva" }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), className: errors.email ? 'border-red-500' : '', placeholder: "joao@email.com" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Telefone *" }), _jsx(Input, { id: "phone", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), className: errors.phone ? 'border-red-500' : '', placeholder: "(11) 99999-9999" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Tipo de Documento" }), _jsxs(Select, { value: formData.documentType, onValueChange: (value) => handleInputChange('documentType', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "cpf", children: "CPF" }), _jsx(SelectItem, { value: "cnpj", children: "CNPJ" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "document", children: "Documento" }), _jsx(Input, { id: "document", value: formData.document, onChange: (e) => handleInputChange('document', e.target.value), placeholder: formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00' })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Building, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Informa\u00E7\u00F5es Profissionais" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "company", children: "Empresa" }), _jsx(Input, { id: "company", value: formData.company, onChange: (e) => handleInputChange('company', e.target.value), placeholder: "Nome da empresa" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "position", children: "Cargo" }), _jsx(Input, { id: "position", value: formData.position, onChange: (e) => handleInputChange('position', e.target.value), placeholder: "Ex: Diretor, CEO, Gerente" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange('status', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerStatuses.filter(s => s.value !== 'todos').map(status => (_jsx(SelectItem, { value: status.value, children: status.label }, status.value))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Categoria" }), _jsxs(Select, { value: formData.category, onValueChange: (value) => handleInputChange('category', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerCategories.filter(c => c.value !== 'todos').map(category => (_jsx(SelectItem, { value: category.value, children: category.label }, category.value))) })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Canal" }), _jsxs(Select, { value: formData.channel, onValueChange: (value) => handleInputChange('channel', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: customerChannels.filter(c => c.value !== 'todos').map(channel => (_jsx(SelectItem, { value: channel.value, children: channel.label }, channel.value))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Agente Respons\u00E1vel" }), _jsxs(Select, { value: formData.responsibleAgent, onValueChange: (value) => handleInputChange('responsibleAgent', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: responsibleAgents.filter(a => a.value !== 'todos').map(agent => (_jsx(SelectItem, { value: agent.value, children: agent.label }, agent.value))) })] })] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Endere\u00E7o" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx(Label, { htmlFor: "street", children: "Rua" }), _jsx(Input, { id: "street", value: formData.address.street, onChange: (e) => handleInputChange('address.street', e.target.value), placeholder: "Nome da rua" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "number", children: "N\u00FAmero" }), _jsx(Input, { id: "number", value: formData.address.number, onChange: (e) => handleInputChange('address.number', e.target.value), placeholder: "123" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "complement", children: "Complemento" }), _jsx(Input, { id: "complement", value: formData.address.complement, onChange: (e) => handleInputChange('address.complement', e.target.value), placeholder: "Apto, Sala, etc." })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "neighborhood", children: "Bairro" }), _jsx(Input, { id: "neighborhood", value: formData.address.neighborhood, onChange: (e) => handleInputChange('address.neighborhood', e.target.value), placeholder: "Nome do bairro" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "zipCode", children: "CEP" }), _jsx(Input, { id: "zipCode", value: formData.address.zipCode, onChange: (e) => handleInputChange('address.zipCode', e.target.value), placeholder: "00000-000" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "city", children: "Cidade" }), _jsx(Input, { id: "city", value: formData.address.city, onChange: (e) => handleInputChange('address.city', e.target.value), placeholder: "Nome da cidade" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "state", children: "Estado" }), _jsx(Input, { id: "state", value: formData.address.state, onChange: (e) => handleInputChange('address.state', e.target.value), placeholder: "SP", maxLength: 2 })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Tags e Observa\u00E7\u00F5es" }), _jsxs("div", { children: [_jsx(Label, { children: "Tags" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx(Input, { value: currentTag, onChange: (e) => setCurrentTag(e.target.value), placeholder: "Digite uma tag", onKeyPress: (e) => e.key === 'Enter' && addTag() }), _jsx(Button, { type: "button", variant: "outline", onClick: addTag, children: "Adicionar" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: formData.tags.map((tag, index) => (_jsxs("div", { className: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1", children: [tag, _jsx("button", { type: "button", onClick: () => removeTag(tag), className: "text-blue-600 hover:text-blue-800", children: _jsx(X, { className: "w-3 h-3" }) })] }, index))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "notes", children: "Observa\u00E7\u00F5es" }), _jsx(Textarea, { id: "notes", value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), placeholder: "Observa\u00E7\u00F5es sobre o cliente...", rows: 3 })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "M\u00E9tricas do Cliente" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx(Label, { className: "text-sm text-gray-600", children: "Total de Pedidos" }), _jsx("p", { className: "font-semibold text-lg", children: formData.totalOrders })] }), _jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx(Label, { className: "text-sm text-gray-600", children: "Valor Total" }), _jsx("p", { className: "font-semibold text-lg", children: new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL'
                                            }).format(formData.totalValue) })] }), _jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx(Label, { className: "text-sm text-gray-600", children: "Ticket M\u00E9dio" }), _jsx("p", { className: "font-semibold text-lg", children: new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL'
                                            }).format(formData.averageTicket) })] })] })] }), _jsxs(DialogFooter, { className: "gap-2", children: [_jsx(Button, { variant: "outline", onClick: handleClose, children: "Cancelar" }), _jsxs(Button, { onClick: handleSave, className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Salvar Altera\u00E7\u00F5es"] })] })] }) }));
};
