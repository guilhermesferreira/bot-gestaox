const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

// Rota para receber mensagens do WhatsApp
app.post('/webhook', (req, res) => {
    // Aqui você pode adicionar lógica para manipular as mensagens recebidas do bot do WhatsApp
    console.log('Mensagem recebida do WhatsApp:', req.body);
    res.status(200).end();
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor HTTP iniciado na porta ${port}`);
});
