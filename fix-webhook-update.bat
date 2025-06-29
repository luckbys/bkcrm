@echo off
echo Atualizando webhook Evolution API...

curl.exe -k -X PUT "https://evochat.devsible.com.br/webhook/set/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json" ^
  -d "{\"webhook\":{\"enabled\":true,\"url\":\"http://localhost:4000/webhook/evolution\",\"events\":[\"MESSAGES_UPSERT\",\"CONNECTION_UPDATE\",\"QRCODE_UPDATED\"],\"webhookByEvents\":false,\"webhookBase64\":false}}"

echo.
echo Verificando configuracao atualizada...

curl.exe -k -X GET "https://evochat.devsible.com.br/webhook/find/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json"

echo.
echo Atualizacao concluida!
pause 