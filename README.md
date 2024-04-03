# WhatsApp Bot para Abertura e Consulta de Chamados

Este é um bot para WhatsApp que permite aos usuários abrir e consultar chamados de um sistema de suporte técnico.

## Descrição

Este bot foi desenvolvido usando a biblioteca `whatsapp-web.js` para interagir com o WhatsApp Web. Ele se comunica com um sistema de suporte técnico por meio de uma API RESTful para abrir e consultar chamados.

## Arquivos e Diretórios

- `/src/api/chamados.js`: Este arquivo contém as funções para interagir com a API RESTful do sistema de suporte técnico. Inclui métodos para abrir chamados, obter informações do usuário e obter tickets de chamados.
- `/src/bot/index.js`: Este é o arquivo principal do bot. Ele configura o cliente do WhatsApp, define os eventos de recebimento de mensagens e implementa a lógica para abrir e consultar chamados.
- `.env`: Este arquivo contém as variáveis de ambiente necessárias para configurar o bot, como credenciais de autenticação do WhatsApp e URLs da API do sistema de suporte técnico.

## Configuração

Antes de executar o bot, você precisa configurar as seguintes variáveis de ambiente no arquivo `.env`:

`WPP_WEB_SESSION=`<caminho para o arquivo de sessão do WhatsApp Web>

`API_URL=`<URL da API do sistema de suporte técnico>

`API_TOKEN=`<token de autenticação da API>


Certifique-se de ter uma sessão válida do WhatsApp Web para autenticação e um token de autenticação válido para acessar a API do sistema de suporte técnico.

## Instalação e Uso

1. Clone o repositório:
git clone https://github.com/guilhermesferreira/bot-gestaox.git

2. Instale as dependências:
 `cd bot-gestaox` && `npm install`

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto e preenchendo-o conforme descrito na seção de configuração.
4. Inicie o bot:
`npm start`


5. Escaneie o código QR exibido no terminal usando o WhatsApp em seu dispositivo móvel para autenticar o bot.
6. Use o bot no WhatsApp para abrir e consultar chamados conforme necessário.

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue para relatar bugs ou solicitar novos recursos. Pull requests também são aceitos.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).