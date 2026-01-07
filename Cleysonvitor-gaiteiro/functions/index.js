const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Importa o SDK
const { MercadoPagoConfig, Preference } = require("mercadopago");

admin.initializeApp();

// --- CONFIGURAÇÃO SEGURA ---
// Em vez de colar o token aqui, pegamos da configuração do Firebase
// Se der erro aqui, é porque você esqueceu de rodar o comando no terminal (veja abaixo)
const client = new MercadoPagoConfig({ 
    accessToken: functions.config().mercadopago.token 
});

// --- FUNÇÃO DE PAGAMENTO ---
exports.criarPagamento = functions.https.onCall(async (data, context) => {
    
    // 1. Verifica login (Se seu site não tiver login, comente essas 3 linhas abaixo)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Precisa estar logado!');
    }

    try {
        // Cria o objeto de preferência
        const preference = new Preference(client);

        const body = {
            items: [
                {
                    id: "cobranca-gaita",
                    title: data.descricao, 
                    quantity: 1,
                    unit_price: Number(data.valor) // Garante que é número
                }
            ],
            payer: {
                email: data.email || "email@teste.com", // Fallback caso venha vazio
                name: data.nome || "Cliente"
            },
            back_urls: {
                // IMPORTANTE: Troque isso pela URL do seu projeto Firebase
                success: "https://cleyson-gaita.web.app/sucesso", 
                failure: "https://cleyson-gaita.web.app/erro",
                pending: "https://cleyson-gaita.web.app/pendente"
            },
            auto_return: "approved",
        };

        // Cria o link
        const result = await preference.create({ body });

        return { url: result.init_point };

    } catch (error) {
        console.error("Erro MP:", error);
        // O throw garante que o erro chegue no seu front-end para você saber o que houve
        throw new functions.https.HttpsError('internal', 'Erro ao criar pagamento: ' + error.message);
    }
});