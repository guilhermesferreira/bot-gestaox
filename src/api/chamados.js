const axios = require("axios");

async function abrirChamado(dadosChamado) {
  try {
    const response = await axios.post(
      process.env.URL_API_ABRECHAMADO,
      dadosChamado
    );
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao abrir chamado: ${error.message}`);
  }
}

// Função para obter o IdUsu a partir do login
async function getIdUsu(login) {
  try {
    const response = await axios.get(
      `${process.env.URL_API_USUARIO}?Login=${login}`
    );
    return response.data.IdUsu;
  } catch (error) {
    //A API consumida, retorna os resultados junto com a response
    if (
      error.response &&
      error.response.status === 500 &&
      error.response.data
    ) {
      // Se houver uma resposta no erro 500 e dados retornados, retornamos o IdUsu
      return error.response.data.IdUsu;
    } else {
      // Se não for um erro 500 ou não houver dados retornados, tratamos o erro normalmente
      throw error;
    }
  }
}

// Função para obter os chamados do usuário, passando o ID do usuário
async function getTickets(IdUsu) {
  try {
    const response = await axios.get(
      `${process.env.URL_API_CONSULTA}?Usuarioid=${IdUsu}`
    );

    // Extrair código e status de cada chamado
    const tickets = response.data.map((ticket) => ({
      codigo: ticket.CODIGO,
      status: ticket.STATUS,
      responsavel: ticket.RESPONSAVEL_USER,
      dataAbertura: ticket.DATA_ABERTURA,
      descricao: ticket.DESCRICAO
    }));

    // Ordenar os chamados do mais recente para o mais antigo (formato: DD/MM/AAAA hh:mm:ss)
    tickets.sort((a, b) => {
      const dateA = new Date(a.dataAbertura.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
      const dateB = new Date(b.dataAbertura.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
      return dateB - dateA;
    });

    return tickets;
  } catch (error) {
    throw new Error(`Erro ao consultar os chamados: ${error.message}`);
  }
}

module.exports = {
  abrirChamado,
  getIdUsu,
  getTickets,
};
