#!/bin/sh

# Verificar se o arquivo existe
if [ ! -f "webhook-evolution-complete-corrigido.cjs" ]; then
  echo "❌ Erro: arquivo webhook-evolution-complete-corrigido.cjs não encontrado"
  exit 1
fi

# Iniciar o webhook
echo "🚀 Iniciando webhook Evolution API..."
node webhook-evolution-complete-corrigido.cjs 