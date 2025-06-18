// Teste do mapeamento de status - cole no console do navegador
console.log('🧪 Testando mapeamento de status...');

// Função para mapear status (mesma lógica do frontend)
const mapStatus = (status) => {
  const statusMap = {
    'pendente': 'pendente',
    'open': 'pendente',
    'atendimento': 'atendimento',
    'in_progress': 'atendimento',
    'finalizado': 'finalizado',
    'resolved': 'finalizado',
    'closed': 'finalizado',
    'cancelado': 'cancelado',
    'cancelled': 'cancelado'
  };
  return statusMap[status] || 'pendente';
};

// Testar mapeamentos
const testStatuses = ['open', 'in_progress', 'closed', 'resolved', 'pendente', 'atendimento', 'finalizado', 'cancelado'];

console.log('📊 Resultados do mapeamento:');
testStatuses.forEach(status => {
  const mapped = mapStatus(status);
  console.log(`  ${status} → ${mapped}`);
});

// Testar especificamente 'closed'
console.log('\n🔒 Teste específico para "closed":');
console.log(`  closed → ${mapStatus('closed')}`);
console.log(`  Vai aparecer na aba "Finalizados"? ${mapStatus('closed') === 'finalizado' ? '✅ SIM' : '❌ NÃO'}`);

console.log('\n✅ Teste concluído!'); 