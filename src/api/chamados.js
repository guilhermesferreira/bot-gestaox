const axios = require('axios');

async function abrirChamado(dadosChamado) {
    try {
        const response = await axios.post('http://suporte.mazatarraf.com.br:4000/API/api/Chamado/AbrirChamado', dadosChamado);
        return response.data;
    } catch (error) {
        throw new Error(`Erro ao abrir chamado: ${error.message}`);
    }
}

module.exports = {
    abrirChamado
};
