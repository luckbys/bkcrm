export const exportToExcel = (customers, filename = 'clientes') => {
    // Preparar dados para exportação
    const exportData = customers.map(customer => ({
        'Nome': customer.name,
        'Email': customer.email,
        'Telefone': customer.phone,
        'Documento': customer.document,
        'Tipo Documento': customer.documentType.toUpperCase(),
        'Empresa': customer.company || '',
        'Cargo': customer.position || '',
        'Status': customer.status,
        'Categoria': customer.category,
        'Canal': customer.channel,
        'Endereço': `${customer.address.street}, ${customer.address.number}${customer.address.complement ? ` - ${customer.address.complement}` : ''}`,
        'Bairro': customer.address.neighborhood,
        'Cidade': customer.address.city,
        'Estado': customer.address.state,
        'CEP': customer.address.zipCode,
        'Tags': customer.tags.join(', '),
        'Observações': customer.notes,
        'Cliente Desde': new Date(customer.customerSince).toLocaleDateString('pt-BR'),
        'Última Interação': new Date(customer.lastInteraction).toLocaleDateString('pt-BR'),
        'Total de Pedidos': customer.totalOrders,
        'Valor Total': customer.totalValue,
        'Ticket Médio': customer.averageTicket,
        'Agente Responsável': customer.responsibleAgent,
        'Data de Criação': new Date(customer.createdAt).toLocaleDateString('pt-BR'),
        'Última Atualização': new Date(customer.updatedAt).toLocaleDateString('pt-BR')
    }));
    // Converter para CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => {
            const value = row[header];
            // Escapar aspas e quebras de linha
            const escapedValue = String(value).replace(/"/g, '""');
            // Envolver em aspas se contém vírgulas, quebras de linha ou aspas
            return /[,\n"]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
        }).join(','))
    ].join('\n');
    // Adicionar BOM para UTF-8 (suporte para caracteres especiais no Excel)
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    // Criar e baixar arquivo
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
export const exportToJSON = (customers, filename = 'clientes') => {
    const jsonContent = JSON.stringify(customers, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
