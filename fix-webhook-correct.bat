@echo off
echo Atualizando URL do webhook Evolution API...

REM Primeiro, vamos ver a configuracao atual
echo Configuracao atual:
curl.exe -k -X GET "https://evochat.devsible.com.br/webhook/find/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json"

echo.
echo.
echo Atualizando para localhost:4000...

REM Tentar com POST e estrutura correta
curl.exe -k -X POST "https://evochat.devsible.com.br/webhook/set/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json" ^
  -d "{\"enabled\":true,\"url\":\"http://localhost:4000/webhook/evolution\",\"events\":[\"MESSAGES_UPSERT\",\"CONNECTION_UPDATE\",\"QRCODE_UPDATED\"],\"webhookByEvents\":false,\"webhookBase64\":false}"

echo.
echo.
echo Configuracao final:
curl.exe -k -X GET "https://evochat.devsible.com.br/webhook/find/atendimento-ao-cliente-suporte-n1" ^
  -H "apikey: AE69F672-751C-41DC-81E7-86BF5074208E" ^
  -H "Content-Type: application/json"

echo.
echo.
echo Testando webhook localhost:4000...
curl.exe -X POST "http://localhost:4000/webhook/evolution" ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"TEST\",\"instance\":\"atendimento-ao-cliente-suporte-n1\",\"data\":{\"message\":\"Teste de configuracao\"}}"

echo.
echo Atualizacao concluida!
pause 