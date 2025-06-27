const fs = require('fs');
const archiver = require('archiver');

// Criar um arquivo de saída
const output = fs.createWriteStream('bkcrm-websocket-deploy-v5.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

// Pipe o arquivo
archive.pipe(output);

// Adicionar os arquivos
archive.file('webhook-evolution-websocket.js', { name: 'webhook-evolution-websocket.js' });
archive.file('webhook.env', { name: 'webhook.env' });
archive.file('package.json', { name: 'package.json' });
archive.file('package-lock.json', { name: 'package-lock.json' });
archive.file('Dockerfile', { name: 'Dockerfile' });

// Finalizar
archive.finalize(); 