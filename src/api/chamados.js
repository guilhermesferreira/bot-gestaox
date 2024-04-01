const axios = require('axios');

async function abrirChamado(dadosChamado) {
    try {
        const response = await axios.post(process.env.URL_API_ABRECHAMADO, dadosChamado);
        return response.data;
    } catch (error) {
        throw new Error(`Erro ao abrir chamado: ${error.message}`);
    }
}

// Função para obter o IdUsu a partir do login
async function getIdUsu(login) {
    try {
        const response = await axios.get(`${process.env.URL_API_USUARIO}?Login=${login}`);
        return response.data.IdUsu;
    } catch (error) {
        if (error.response && error.response.status === 500 && error.response.data) {
            // Se houver uma resposta no erro 500 e dados retornados, retornamos o IdUsu
            return error.response.data.IdUsu;
        } else {
            // Se não for um erro 500 ou não houver dados retornados, tratamos o erro normalmente
            throw error;
        }
    }
}


module.exports = {
    abrirChamado,
    getIdUsu
};
