@echo off
echo Configurando webhook Evolution API...

curl.exe -k -X POST "https://evochat.devsible.com.br/webhook/set/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json" ^
  -d "{\"enabled\":true,\"url\":\"http://localhost:4000/webhook/evolution\",\"events\":[\"MESSAGES_UPSERT\",\"CONNECTION_UPDATE\",\"QRCODE_UPDATED\"],\"webhook_by_events\":false,\"webhook_base64\":false}"

echo.
echo Verificando configuracao...

curl.exe -k -X GET "https://evochat.devsible.com.br/webhook/find/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json"

echo.
echo Configuracao concluida!
pause 