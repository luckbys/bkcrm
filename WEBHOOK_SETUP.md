# Configuração do Webhook no n8n

## Visão Geral
Este documento descreve como configurar o webhook no n8n para receber e processar mensagens do WhatsApp.

## Passo a Passo

1. Acesse o n8n em https://press-n8n.jhkbgs.easypanel.host

2. Crie um novo workflow:
   - Nome: "WhatsApp Message Handler"
   - Descrição: "Processa mensagens do WhatsApp enviadas pelo CRM"

3. Adicione um nó "Webhook":
   - Método: POST
   - Path: /webhook/whatsapp
   - Authentication: Header Auth
   - Auth Header: apikey
   - Auth Value: 429683C4C977415CAAFCCE10F7D57E11

4. Adicione um nó "Function" para processar a mensagem:
```javascript
const inputData = items[0].json;
const { type, source, data } = inputData;

if (type !== 'whatsapp_message') {
  return [];
}

// Preparar dados para Evolution API
const evolutionPayload = {
  number: data.to,
  text: data.message
};

// Retornar payload formatado
return [{
  json: {
    success: true,
    evolutionPayload,
    metadata: {
      source,
      ticketId: data.ticketId,
      messageId: data.messageId
    }
  }
}];
```

5. Adicione um nó "HTTP Request" para enviar para Evolution API:
   - URL: https://press-evolution-api.jhkbgs.easypanel.host/message/sendText/{{$node["Function"].json["metadata"]["instance"]}}
   - Method: POST
   - Headers:
     - Content-Type: application/json
     - apikey: 429683C4C977415CAAFCCE10F7D57E11
   - Body: {{$node["Function"].json["evolutionPayload"]}}

6. Ative o workflow

## Formato do Payload
```json
{
  "type": "whatsapp_message",
  "source": "crm",
  "timestamp": "2024-03-19T12:34:56.789Z",
  "data": {
    "instanceName": "instance_name",
    "to": "5511999999999",
    "message": "Conteúdo da mensagem",
    "messageType": "text",
    "ticketId": "123",
    "messageId": "abc-123",
    "metadata": {
      "department": "suporte",
      "isAgent": true,
      "isInternal": false
    }
  }
}
```

## Testando

1. Use o Insomnia ou Postman para testar:
   - URL: https://press-n8n.jhkbgs.easypanel.host/webhook/whatsapp
   - Method: POST
   - Headers:
     - Content-Type: application/json
     - apikey: 429683C4C977415CAAFCCE10F7D57E11
   - Body: Use o exemplo de payload acima

2. Verifique os logs no n8n para confirmar o recebimento
3. Monitore a Evolution API para confirmar o envio

## Troubleshooting

Se encontrar erros:

1. Verifique se o workflow está ativo no n8n
2. Confirme se as credenciais estão corretas
3. Verifique os logs do n8n para mais detalhes
4. Teste o endpoint da Evolution API separadamente 