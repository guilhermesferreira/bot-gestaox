const { Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { abrirChamado, getIdUsu } = require('../api/chamados');

const client = new Client({
    authStrategy: new LocalAuth()
});

let isFirstMessage = true;
let afterSendOptionMenu = false;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado. Escaneie-o para se autenticar:', qr);
});

// Função para aguardar a próxima mensagem do usuário
function waitingForMessage(sender) {
    const waitFor = new Promise(resolve => {
        client.on('message', async (message) => {
            if (message.from === sender) {
                resolve(message.body.trim());
            }
        });
    });
    return waitFor;
}

// Função para aguardar a próxima mensagem do usuário e retornar um objeto com a mensagem e o IdUsu
async function waitingForMessageAndIdUsu(sender) {
    const waitFor = new Promise(async (resolve, reject) => {
        client.once('message', async (message) => { // Use 'once' em vez de 'on' para ouvir apenas uma vez
            if (message.from === sender) {
                const login = message.body.trim(); // Obtém a mensagem digitada pelo usuário (login)
                const idUsu = await getIdUsu(login); // Obtém o IdUsu com base na mensagem
                resolve({ login, idUsu }); // Retorna um objeto com a mensagem e o IdUsu
            }
        });
    });
    return waitFor;
}

// Deixei segregado por poder ser um método utilizado várias vezes, com isso, basta você chamar o método e enviar o sender como parâmetro.
const sendDefaultMessage = async (sender) => {
    await client.sendMessage(sender, 'Olá! Escolha uma das opções a seguir:\n`1 - Abrir chamado`');
}

client.on('ready',  async () => {
    console.log('WhatsApp client está pronto');

    client.on('message', async (message) => {
        if (!message.fromMe) {
            const sender = message.from;
            const text = message.body;


            if (isFirstMessage) {
                isFirstMessage = false;
                await sendDefaultMessage(sender);
                return;
            }

            //Exemplo de uso 2x do mesmo método, criado acima.
            if(text.toLowerCase().includes('menu')){
                await sendDefaultMessage(sender);
            }

            // Verifica se a mensagem contém o texto "1" (opção para abrir chamado)
            if (text && text.trim() === '1') {
                afterSendOptionMenu = true;
                await client.sendMessage(sender, 'Por favor, informe o seu login:');

                const usuario = await waitingForMessageAndIdUsu(sender);
                console.log('Mensagem do usuário:',usuario.login);
                console.log('Id do usuário:', usuario.idUsu);

                await client.sendMessage(sender, 'Por favor, descreva o chamado:');

                const descricao = await waitingForMessage(sender);

                const dadosChamado = {
                    CatalogoServicosid: 2089, // Definindo o ID do catálogo de serviços como 2089
                    Urgencia: 3, // Definindo a urgência como 3 (Alta) diretamente
                    Prioridade: 1, // Definindo a prioridade como 1 (Baixa) diretamente
                    Descricao: descricao,
                    LoginSolicitante: usuario.login
                };

                try {
                    const resposta = await abrirChamado(dadosChamado);
                    await client.sendMessage(sender, 'Aguarde... Abrindo o chamado.')
                    console.log('Chamado aberto com sucesso:', resposta);
                    // Envia uma mensagem de confirmação para o remetente
                    await client.sendMessage(sender, 'Chamado aberto com sucesso! Número do chamado: ' + resposta);
                    afterSendOptionMenu = false;
                    isFirstMessage = true; // Reinicia o loop
                } catch (error) {
                    console.error('Erro ao abrir chamado:', error.message);
                    // Envia uma mensagem de erro para o remetente
                    await client.sendMessage(sender, 'Erro ao abrir chamado. Por favor, tente novamente.');
                    afterSendOptionMenu = false;
                    isFirstMessage = true; // Reinicia o loop
                }
            } else if(!text.toLowerCase().includes("menu") && !afterSendOptionMenu){
                await client.sendMessage(sender, "Opção inválida, por favor selecione uma opção válida. Escreva menu, para obter as opções.")
                afterSendOptionMenu = false;
            }
            
        }
    });
});

client.initialize();
