# Script para organizar arquivos restantes
Write-Host "🔧 Organizando arquivos restantes..." -ForegroundColor Cyan

# Arrays com arquivos para cada categoria
$frontendDocs = @(
    "CORRECAO_MODAL_CHAT.md",
    "CORRECAO_MUDANCA_ABA.md", 
    "CORRECAO_POSICIONAMENTO_FIXO_CHATS.md",
    "CORRECAO_RESPONSIVIDADE_SIDEBAR_TICKETCHAT.md",
    "CORRECAO_TICKETCHAT_FINAL.md",
    "CORRECAO_TICKETCHAT_MODAL_FINAL.md",
    "CORRECAO_TICKETCHAT_RESPONSIVO_FUNCIONAL.md",
    "ESTUDO_UX_TICKETCHAT_MODAL.md",
    "FASE_2_UX_AVANCADA_IMPLEMENTADA.md",
    "FASE_3_ACESSIBILIDADE_IMPLEMENTADA.md",
    "GUIA_NOVA_INTERFACE_TICKETCHAT.md",
    "IMPLEMENTACAO_CONCLUIDA_UX_TICKETCHAT.md",
    "IMPLEMENTACAO_DRAWER_CHATS_MINIMIZADOS.md",
    "LIMPEZA_DUPLICACOES_CHAT_TICKET.md",
    "MELHORIAS_DRAG_DROP_IMPLEMENTADAS.md",
    "MELHORIAS_UI_UX_TICKETCHAT.md",
    "REFATORACAO_FUNCAO_MINIMIZAR_TICKET.md",
    "REMOCAO_MOCK_TICKETCHAT.md",
    "SIMPLIFICACAO_CHATS_MINIMIZADOS.md",
    "SISTEMA_AVANCADO_MINIMIZACAO_IMPLEMENTADO.md",
    "SISTEMA_CHAT_MINIMIZADO_AVANCADO.md"
)

$backendDocs = @(
    "CORRECAO_RLS_REALTIME_URGENTE.md",
    "CORRECAO_SUPABASE_API_KEY.md",
    "CORRECAO_SUPABASE_LOCAL_VPS.md", 
    "CORRECAO_WEBSOCKET_SSL_DEVSIBLE.md",
    "GUIA_MIGRACAO_NOVO_SUPABASE.md",
    "GUIA_RESOLUCAO_SUPABASE_URGENTE.md",
    "PASSO_A_PASSO_REALTIME.md",
    "ROTEAMENTO_AUTOMATICO_TICKETS.md"
)

$databaseFiles = @(
    "CORRECAO_CUSTOMER_ID_NULL.sql",
    "CORRECAO_DEPARTMENTS_SIMPLES.sql", 
    "CORRECAO_ENUM_USER_ROLE.sql",
    "CORRECAO_ERRO_CHANNEL_TICKETS.sql",
    "CORRECAO_FUNCOES_REALTIME.sql",
    "CORRECAO_FUNCOES_REALTIME_V2.sql",
    "CORRECAO_INSTANCIA_DUPLICADA.sql",
    "CORRECAO_REALTIME_SEGURA.sql",
    "CORRECAO_REALTIME_TABELAS.sql",
    "CORRECAO_REGISTRO_PROFILES.sql",
    "CORRECAO_REGISTRO_PROFILES_V2.sql",
    "CORRECAO_RELACIONAMENTOS_TICKETS_DEPARTMENTS.sql",
    "CORRECAO_RLS_DEPARTMENTS.sql",
    "CORRECAO_RLS_SEM_CONFLITOS.sql",
    "CORRECAO_ROBUSTA_SUPABASE.sql",
    "CORRECAO_SENDER_ID_MESSAGES.sql",
    "CORRECAO_SIMPLES_TICKETS.sql",
    "CORRECAO_TABELA_DEPARTMENT_INSTANCES.sql",
    "CORRECAO_URGENTE_RLS_SUPABASE.sql",
    "CORRIGIR_SCHEMA_FINAL.sql",
    "CORRIGIR_SCHEMA_MESSAGES.sql",
    "CORRIGIR_SCHEMA_SIMPLES.sql",
    "CRIAR_COLUNA_CHANNEL_DEFINITIVO.sql",
    "CRIAR_TABELA_TICKETS.sql",
    "DIAGNOSTICO_BANCO_TICKETS.sql",
    "DIAGNOSTICO_SETORES_REMOVIDOS.sql",
    "DIAGNOSTICO_SUPABASE.sql",
    "FORCAR_ATUALIZACAO_SCHEMA_DEFINITIVA.sql",
    "FORCE_EMAIL_CONFIRMATION_DEV.sql",
    "REALTIME_SIMPLES.sql",
    "SETUP_RAPIDO_SUPABASE.sql",
    "SOLUCAO_RAPIDA_RLS.sql",
    "SOLUCAO_RAPIDA_RLS_V2.sql",
    "SOLUCAO_TICKETS_400_COMPLETA.sql",
    "supabase_realtime_setup.sql"
)

$testFiles = @(
    "debug-ticket-click.js",
    "debug-webhook-error.js",
    "DEBUG_REMOCAO_SETOR.js",
    "evolution-webhook-server.js",
    "FIX_WEBHOOK_404_EVOLUTION.js",
    "SCRIPT_CORRECAO_WEBHOOK_404.js",
    "SOLUCAO_COMPLETA_WEBHOOK_EVOLUTION_404.js"
)

$scriptFiles = @(
    "corrigir-webhook-local.js",
    "CORRECAO_WEBHOOK_CRIACAO_TICKETS.js",
    "CORRIGIR_EVOLUTION_COMPLETO.js",
    "CORRIGIR_EVOLUTION_SIMPLIFICADO.js"
)

$troubleshootingDocs = @(
    "CORRECOES_FINAIS_URGENTES.md",
    "CORRECAO_WEBHOOK_N8N_404.md",
    "DEBUG_GUIDE.md",
    "SOLUCAO_ASSIGNED_TO.md",
    "SOLUCAO_EMAIL_CONFIRMACAO_SUPABASE.md",
    "SOLUCAO_ERRO_DEPARTMENT_ID.md",
    "SOLUCAO_ERRO_ENUM_USER_ROLE.md",
    "SOLUCAO_ERRO_REACT_HOOKS.md",
    "SOLUCAO_ERRO_RELACIONAMENTO_SUPABASE.md",
    "SOLUCAO_ERRO_SALVAMENTO_BANCO.md"
)

$webhookDocs = @(
    "CORRECAO_ENDPOINTS_WEBHOOK_EVOLUTION.md",
    "GUIA_COMPLETO_WEBHOOK_EVOLUTION_FUNCIONAR.md",
    "GUIA_CORRIGIR_BANCO_WEBHOOK.md",
    "GUIA_CORRIGIR_ERRO_CHANNEL_TICKETS.md",
    "GUIA_CORRIGIR_WEBHOOK_PRODUCAO.md",
    "GUIA_DEPLOY_WEBHOOK_PRODUCAO.md",
    "INTEGRACAO_EVOLUTION_API.md",
    "MELHORIAS_CONEXAO_WHATSAPP.md",
    "MELHORIAS_EVOLUTION_API.md",
    "RESUMO_CORRECAO_EVOLUTION_404.md",
    "RESUMO_FINAL_WEBHOOK_EVOLUTION.md",
    "RESUMO_IMPLEMENTACAO_WEBHOOK.md",
    "RESUMO_SOLUCAO_WEBHOOK.md",
    "RESUMO_WEBHOOK_FUNCIONANDO.md",
    "SOLUCAO_NGROK_WEBHOOK.md",
    "SOLUCAO_QR_CODE_EVOLUTION.md",
    "STATUS_INTEGRACAO_EVOLUTION.md"
)

$deploymentDocs = @(
    "RESUMO_FINAL_DEPLOY_EASYPANEL.md"
)

$generalDocs = @(
    "DOCUMENTACAO_ENVIO_MENSAGENS_EVOLUTION.md",
    "EXIBICAO_NOME_TELEFONE_CHAT.md",
    "EXECUTAR_AGORA.md",
    "FUNCIONALIDADE_AUTO_CADASTRO_CLIENTES.md",
    "FUNCIONALIDADE_FINALIZAR_TICKETS.md",
    "FUNCIONALIDADE_TICKETS_FINALIZADOS.md",
    "GUIA_CORRECAO_FINAL_TICKETS.md",
    "GUIA_EXECUCAO_RAPIDA.md",
    "GUIA_EXTRACAO_TELEFONE_COMPLETO.md",
    "GUIA_FINALIZACAO_MASSA.md",
    "GUIA_FINALIZACAO_SIMPLES.md",
    "GUIA_SIDEBAR_APRIMORADO.md",
    "GUIA_SOLUCAO_CLIENTES.md",
    "OPCAO_2_ATUALIZAR_CODIGO_DEPARTMENT_INSTANCES.md",
    "PRODUCTION_GUIDE.md",
    "README_SOLUCAO_DEPARTAMENTOS.md",
    "SISTEMA_FINALIZAR_TICKETS_COMPLETO.md",
    "SOLUCAO_FINALIZAR_TICKETS_BANCO.md",
    "SOLUCAO_FINAL_CRIACAO_TICKETS.md",
    "SOLUCAO_FINAL_ENVIO_MENSAGENS.md",
    "SOLUCAO_FINAL_TRIGGERS.md",
    "TELEFONE_CLIENTE_RESPOSTA.md"
)

# Função para mover arquivos
function Move-FilesToFolder {
    param (
        [string[]]$files,
        [string]$destination,
        [string]$description
    )
    
    Write-Host "📁 Movendo $description..." -ForegroundColor Yellow
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            try {
                Move-Item $file $destination -ErrorAction Stop
                Write-Host "  ✅ $file" -ForegroundColor Green
            }
            catch {
                Write-Host "  ❌ Erro ao mover $file : $_" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  ⚠️  $file não encontrado" -ForegroundColor Yellow
        }
    }
}

# Mover arquivos para suas respectivas pastas
Move-FilesToFolder $frontendDocs "docs\frontend\" "documentação do frontend"
Move-FilesToFolder $backendDocs "docs\backend\" "documentação do backend"
Move-FilesToFolder $databaseFiles "backend\database\" "arquivos do banco de dados"
Move-FilesToFolder $testFiles "backend\tests\" "arquivos de teste"
Move-FilesToFolder $scriptFiles "backend\scripts\" "scripts"
Move-FilesToFolder $troubleshootingDocs "docs\troubleshooting\" "documentação de troubleshooting"
Move-FilesToFolder $webhookDocs "docs\webhooks\" "documentação de webhooks"
Move-FilesToFolder $deploymentDocs "docs\deployment\" "documentação de deployment"
Move-FilesToFolder $generalDocs "docs\backend\" "documentação geral"

Write-Host "🎉 Organização concluída!" -ForegroundColor Green 