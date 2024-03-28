const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { abrirChamado } = require('../api/chamados');

const client = new Client();

let isFirstMessage = true;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado. Escaneie-o para se autenticar:', qr);
});

client.on('ready', () => {
    console.log('WhatsApp client está pronto');

    client.on('message', async (message) => {
        if (!message.fromMe) {
            const sender = message.from;
            const text = message.body;

            // Verifica se é a primeira mensagem recebida ou se houve um erro na abertura do chamado
            if (isFirstMessage) {
                // Responde apenas à primeira mensagem de saudação
                isFirstMessage = false;
                await client.sendMessage(sender, 'Olá! Escolha uma das opções a seguir:\n1 - Abrir chamado');
                return;
            }

            // Verifica se a mensagem contém o texto "1" (opção para abrir chamado)
            if (text && text.trim() === '1') {
                // Envia uma mensagem solicitando o login do usuário
                await client.sendMessage(sender, 'Por favor, informe o seu login:');

                // Função para aguardar a próxima mensagem do usuário
                const waitForLogin = new Promise(resolve => {
                    client.on('message', async (message) => {
                        if (message.from === sender) {
                            resolve(message.body.trim());
                        }
                    });
                });

                // Aguarda a resposta do usuário
                const login = await waitForLogin;

                // Envia uma mensagem solicitando a descrição do chamado
                await client.sendMessage(sender, 'Por favor, descreva o chamado:');

                // Função para aguardar a próxima mensagem do usuário
                const waitForDescricao = new Promise(resolve => {
                    client.on('message', async (message) => {
                        if (message.from === sender) {
                            resolve(message.body.trim());
                        }
                    });
                });

                // Aguarda a resposta do usuário
                const descricao = await waitForDescricao;

                // Informações fixas do chamado
                const dadosChamado = {
                    CatalogoServicosid: 2089, // Definindo o ID do catálogo de serviços como 2089
                    Urgencia: 3, // Definindo a urgência como 3 (Alta) diretamente
                    Prioridade: 1, // Definindo a prioridade como 1 (Baixa) diretamente
                    Descricao: descricao,
                    LoginSolicitante: login
                };

                try {
                    const resposta = await abrirChamado(dadosChamado);
                    console.log('Chamado aberto com sucesso:', resposta);
                    // Envia uma mensagem de confirmação para o remetente
                    await client.sendMessage(sender, 'Chamado aberto com sucesso! Número do chamado: ' + resposta);
                    isFirstMessage = true; // Reinicia o loop
                } catch (error) {
                    console.error('Erro ao abrir chamado:', error.message);
                    // Envia uma mensagem de erro para o remetente
                    await client.sendMessage(sender, 'Erro ao abrir chamado. Por favor, tente novamente.');
                    isFirstMessage = true; // Reinicia o loop
                }
            }
            
        }
    });
});

client.initialize();
