const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { abrirChamado, getIdUsu, getTickets } = require("../api/chamados");

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "sessions",
  }),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

// Função para verificar se o cliente está autenticado
function isClientAuthenticated() {
  return client.state === "authenticated";
}

// Verificação de Autenticação do Cliente
if (!isClientAuthenticated()) {
  client.on("qr", (qr) => {
    console.log("Cliente não autenticado... Iniciando autenticação");
    qrcode.generate(qr, { small: true });
    console.log("QR Code gerado. Escaneie-o para se autenticar:", qr);
  });
} else {
  console.log("Cliente já autenticado...");
}

// Cria um objeto para armazenar as sessões, usando o número do usuário como chave
const sessions = new Map();

// Função para obter o objeto session para um determinado número de usuário
function getSession(sender) {
  let session = sessions.get(sender);
  if (!session) {
    session = {
      isFirstMessage: true,
      afterSendOptionMenu: false,
    };
    sessions.set(sender, session);
  }
  return session;
}

// Função para limpar o objeto session para um determinado número de usuário
function clearSession(sender) {
  sessions.delete(sender);
}

// Função para manipular a opção de abrir chamado
async function handleAbrirChamado(sender) {
  const session = getSession(sender);
  session.afterSendOptionMenu = true;

  console.log("Iniciando manipulação de abrir chamado");

  await client.sendMessage(sender, "Por favor, informe o seu login:");
  console.log("Aguardando mensagem do usuário...");

  const login = await waitingForMessage(sender);
  console.log("Login recebido:", login);

  await client.sendMessage(sender, "Por favor, descreva o chamado:");
  console.log("Aguardando mensagem do usuário...");

  const descricao = await waitingForMessage(sender);
  console.log("Descrição do chamado recebida:", descricao);

  const dadosChamado = {
    CatalogoServicosid: 2089,
    Urgencia: 3,
    Prioridade: 1,
    Descricao: descricao,
    LoginSolicitante: login,
  };

  try {
    console.log("Abrindo chamado...");
    const resposta = await abrirChamado(dadosChamado);
    console.log("Chamado aberto com sucesso:", resposta);

    await client.sendMessage(
      sender,
      "Chamado aberto com sucesso! Número do chamado: " + resposta
    );
    console.log("Mensagem enviada com sucesso");

    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
    console.log("Reinicializando sessão");
    return;
  } catch (error) {
    console.error("Erro ao abrir chamado:", error.message);
    await client.sendMessage(
      sender,
      "Erro ao abrir chamado. Por favor, tente novamente."
    );
    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
  }
}

// Função para manipular a opção de consultar chamados
async function handleConsultarChamados(sender) {
  const session = getSession(sender);
  session.afterSendOptionMenu = true;

  await client.sendMessage(sender, "Por favor, informe o seu login:");
  const login = await waitingForMessage(sender);

  try {
    const idUsuario = await getIdUsu(login);

    //await client.sendMessage(sender, "Aguarde... Consultando chamados.");

    console.log(`Dados do usuário: ${login} ${idUsuario}`);

    const tickets = await getTickets(idUsuario);

    if (tickets.length === 0) {
      await client.sendMessage(
        sender,
        "Você não tem nenhum chamado aberto/resolvido recentemente."
      );
      console.log(`O usuário não tem chamados`);
    } else {
      await client.sendMessage(sender, "Aqui estão seus chamados recentes:");

      tickets.forEach((ticket) => {
        const mensagem = `*Chamado: ${ticket.codigo}*\n - Status: ${ticket.status}\n - Responsável: ${ticket.responsavel}\n - Abertura: ${ticket.dataAbertura}`;

        client.sendMessage(sender, mensagem);
        console.log(mensagem);
      });
    }

    console.log("Chamados abertos:");
    tickets.forEach((ticket) => {
      console.log(`Código: ${ticket.codigo}, Status: ${ticket.status}`);
    });

    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
  } catch (error) {
    console.error("Erro ao obter o IdUsuário:", error.message);
    await client.sendMessage(sender, "Erro ao validar o usuário. Por favor, tente novamente.");
    session.afterSendOptionMenu = false;
    session.isFirstMessage = true; // Keep the user in the same state
  }
}

// Função para manipular a opção de mensagem inválida
async function handleInvalidOption(sender) {
  const session = getSession(sender);
  if (!isMessageFromBot(sender) && !session.afterSendOptionMenu) {
    await client.sendMessage(
      sender,
      "Opção inválida, por favor selecione uma opção válida. Escreva *menu*, para obter as opções."
    );
  }
}

// Função para verificar se a mensagem veio do próprio bot
function isMessageFromBot(message) {
  return message.from === client.info.wid;
}

// Função para aguardar a próxima mensagem do usuário
async function waitingForMessage(sender) {
  return new Promise((resolve) => {
    client.on("message", async (message) => {
      if (message.from === sender) {
        resolve(message.body.trim());
      }
    });
  });
}

// Função para aguardar a próxima mensagem do usuário e retornar um objeto com o login e o IdUsu
async function waitingForMessageAndIdUsu(sender) {
  return new Promise(async (resolve, reject) => {
    client.once("message", async (message) => {
      if (message.from === sender) {
        const login = message.body.trim(); // Obtém a mensagem digitada pelo usuário (login)
        const idUsuario = await getIdUsu(login); // Obtém o IdUsu com base na mensagem
        resolve({ login, idUsuario }); // Retorna um objeto com o login e o IdUsu
      }
    });
  });
}

// Função para enviar a mensagem padrão com as opções disponíveis
const sendDefaultMessage = async (sender) => {
  await client.sendMessage(
    sender,
    "Olá! Escolha uma das opções a seguir:\n`1 - Abrir chamado`\n`2 - Consultar chamados`"
  );
};

// Função para enviar a mensagem de erro ao usuário
const sendErrorMessage = async (sender) => {
  await client.sendMessage(sender, "Ocorreu um erro, tente novamente.");
};

// Inicialização do Cliente e Configuração de Eventos
client.on("ready", async () => {
  console.log("WhatsApp client está pronto");
});

client.on("message", async (message) => {
  console.log("Mensagem recebida:", message);
  if (!isMessageFromBot(message)) {
    const sender = message.from;
    const text = message.body;

    const session = getSession(sender);

    if (session.isFirstMessage) {
      session.isFirstMessage = false;
      await sendDefaultMessage(sender);
      return;
    }

    if (text.toLowerCase().includes("menu")) {
      await sendDefaultMessage(sender);
      return;
    }

    if (text && text.trim() === "1") {
      await handleAbrirChamado(sender);
    } else if (text && text.trim() === "2") {
      await handleConsultarChamados(sender);
    } else {
      await handleInvalidOption(sender);
    }
  }
});

// Inicialização do Cliente
client.initialize();
