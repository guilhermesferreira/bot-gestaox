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

    // Função para reiniciar o fluxo de mensagens
    const restartMessageFlow = (sender) => {
        client.once('message', async (message) => {
            const text = message.body;

            // Verifica se a mensagem contém o texto "1" (opção para abrir chamado)
            if (text && text.trim() === '1') {
                await client.sendMessage(sender, 'Por favor, informe o seu login:');
                const login = await waitForMessage(sender);
                await client.sendMessage(sender, 'Por favor, descreva o chamado:');
                const descricao = await waitForMessage(sender);

                const dadosChamado = {
                    CatalogoServicosid: 2089,
                    Urgencia: 3,
                    Prioridade: 1,
                    Descricao: descricao,
                    LoginSolicitante: login
                };

                try {
                    const resposta = await abrirChamado(dadosChamado);
                    console.log('Chamado aberto com sucesso:', resposta);
                    await client.sendMessage(sender, 'Chamado aberto com sucesso! Número do chamado: ' + resposta);
                } catch (error) {
                    console.error('Erro ao abrir chamado:', error.message);
                    await client.sendMessage(sender, 'Erro ao abrir chamado. Por favor, tente novamente.');
                }

                // Reinicia o fluxo de mensagens
                restartMessageFlow(sender);
            } else {
                // Responde à mensagem com a opção inválida
                await client.sendMessage(sender, 'Opção inválida. Digite "1" para abrir um chamado.');
                // Reinicia o fluxo de mensagens
                restartMessageFlow(sender);
            }
        });
    };

    client.on('message', async (message) => {
        if (!message.fromMe) {
            const sender = message.from;

            if (isFirstMessage) {
                isFirstMessage = false;
                await client.sendMessage(sender, 'Olá! Escolha uma das opções a seguir:\n1 - Abrir chamado');
                // Inicia o fluxo de mensagens
                restartMessageFlow(sender);
            }
        }
    });
});

client.initialize();

// Função para aguardar a próxima mensagem do usuário
const waitForMessage = (sender) => {
    return new Promise(resolve => {
        client.once('message', async (message) => {
            if (message.from === sender) {
                resolve(message.body.trim());
            }
        });
    });
};
