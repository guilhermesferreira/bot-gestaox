const axios = require('axios');

async function abrirChamado(dadosChamado) {
    try {
        const response = await axios.post(process.env.URL_API_PROD, dadosChamado);
        return response.data;
    } catch (error) {
        throw new Error(`Erro ao abrir chamado: ${error.message}`);
    }
}

module.exports = {
    abrirChamado
};
