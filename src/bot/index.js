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

function isClientAuthenticated() {
  return client.state === "authenticated";
}

if (!isClientAuthenticated()) {
  client.on("qr", (qr) => {
    console.log("Cliente não autenticado... Iniciando autenticação");
    qrcode.generate(qr, { small: true });
    console.log("QR Code gerado. Escaneie-o para se autenticar:", qr);
  });
} else {
  console.log("Cliente já autenticado...");
}

client.on("ready", async () => {
  console.log("WhatsApp client está pronto");
});

//Armazenar as sessões em um obj
const sessions = new Map();

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

async function handleAbrirChamado(sender, choice_dept) {
  const session = getSession(sender);
  session.afterSendOptionMenu = true;

  await client.sendMessage(sender, "Por favor, informe o seu login:");
  const login = await waitingForMessage(sender);
  await client.sendMessage(sender, "Por favor, descreva o chamado:");
  const descricao = await waitingForMessage(sender);

   const dadosChamado = {
    CatalogoServicosid: await getIdDept(choice_dept),
    Urgencia: 3,
    Prioridade: 1,
    Descricao: descricao,
    LoginSolicitante: login,
  };

  try {
    const resposta = await abrirChamado(dadosChamado);
    await client.sendMessage(sender,"Chamado aberto com sucesso! Número do chamado: " + resposta);
    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
    console.log("Reinicializando sessão");
    return;
  } catch (error) {
    console.error("Erro ao abrir chamado:", error.message);
    await client.sendMessage(sender,"Erro ao abrir chamado. Por favor, tente novamente.");
    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
  }
}

function getIdDept(choice_dept) {
  if (choice_dept === "infra") {
    const id = 2056; // ID Solicitação de Serviço
    return id;
  } else if (choice_dept === "sist") {
    const id = 1982;// ID Dúvida na utilização
    return id;
  }
}

async function handleConsultarChamados(sender) {
  const session = getSession(sender);
  session.afterSendOptionMenu = true;
  await client.sendMessage(sender, "Por favor, informe o seu login:");
  const login = await waitingForMessage(sender);

  try {
    const idUsuario = await getIdUsu(login);
    const tickets = await getTickets(idUsuario);
    if (tickets.length === 0) {
      await client.sendMessage(sender,"Você não tem nenhum chamado aberto/resolvido recentemente.");
    } else {
      await client.sendMessage(sender, "Aqui estão seus chamados recentes:");
        tickets.forEach((ticket) => {
          const mensagem = `*Chamado: ${ticket.codigo}*\n - Status: ${ticket.status}\n - Responsável: ${ticket.responsavel}\n - Abertura: ${ticket.dataAbertura}`;
          client.sendMessage(sender, mensagem);
      });
    }

    session.afterSendOptionMenu = false;
    session.isFirstMessage = true;
  } catch (error) {
    await client.sendMessage(sender,"Erro ao validar o usuário. Por favor, tente novamente.");
    session.afterSendOptionMenu = false;
    session.isFirstMessage = true; 
  }
}

async function handleInvalidOption(sender) {
  const session = getSession(sender);
  if (!isMessageFromBot(sender) && !session.afterSendOptionMenu) {
    await client.sendMessage(sender,"Opção inválida, por favor selecione uma opção válida. Escreva *menu*, para obter as opções.");
  }
}

function isMessageFromBot(message) {
  return message.from === client.info.wid;
}

async function waitingForMessage(sender) {
  return new Promise((resolve) => {
    client.on("message", async (message) => {
      if (message.from === sender) {
        resolve(message.body.trim());
      }
    });
  });
}


const sendDefaultMessage = async (sender) => {
  await client.sendMessage(
    sender,
    "Olá! Escolha uma das opções a seguir:\n`1 - Abrir chamado - TI Infraestrutura`\n`2 - Abrir chamado - TI Sistemas`\n`3 - Consultar meus chamados`"
  );
};

client.on("message", async (message) => {
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
      const choice_dept = "infra";
      await handleAbrirChamado(sender, choice_dept);
    } else if (text && text.trim() === "2") {
      const choice_dept = "sist";
      await handleAbrirChamado(sender, choice_dept);
    } else if (text && text.trim() === "3") {
      await handleConsultarChamados(sender);
    } else {
      await handleInvalidOption(sender);
    }
  }
});

client.initialize();
