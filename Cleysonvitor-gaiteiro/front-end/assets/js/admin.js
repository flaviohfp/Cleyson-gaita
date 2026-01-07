// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDoTtpGZXCKSjMugmMekmKpmBZkwOOUcuM",
  authDomain: "cleyson-gaita.firebaseapp.com",
  projectId: "cleyson-gaita",
  storageBucket: "cleyson-gaita.firebasestorage.app",
  messagingSenderId: "227994892194",
  appId: "1:227994892194:web:127d95a5ae0ac77bdf24fb"
};

// Inicializa Firebase apenas se não estiver iniciado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 1. FUNÇÃO DE LOGIN ---
function verificarSenha() {
    const senhaInput = document.getElementById('senhaAdmin');
    const senha = senhaInput.value;

    // SENHA DO GAITEIRO
    if (senha === "1234") {
        // Esconde login, mostra formulário
        document.getElementById('telaLogin').classList.add('hidden');
        document.getElementById('telaCadastro').classList.remove('hidden');
    } else {
        alert("Senha incorreta, tchê!");
        senhaInput.value = "";
    }
}

// --- 2. FUNÇÃO DE CADASTRO ---
function salvarDivida() {
    // Pega os valores dos inputs
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const categoria = document.getElementById('categoria').value;
    const rodeio = document.getElementById('rodeio').value;
    const valor = document.getElementById('valor').value;

    // Limpa o CPF para salvar só números
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Validação simples
    if (!nome || !cpfLimpo || !valor || !categoria) {
        alert("⚠️ Preencha Nome, CPF, Categoria e Valor!");
        return;
    }

    // Efeito de carregamento no botão
    const btn = document.getElementById('btnSalvar');
    const textoOriginal = btn.innerText;
    btn.innerText = "GRAVANDO...";
    btn.disabled = true;

    // Salva no Firestore
    db.collection("cobrancas").add({
        nome: nome,
        cpf: cpfLimpo,
        telefone: telefone,
        email: email,
        categoria: categoria,
        rodeio: rodeio,
        valor: parseFloat(valor), // Garante que é número
        data_cadastro: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pendente"
    })
    .then(() => {
        alert("✅ Cadastro realizado com sucesso!");
        
        // Limpa o formulário para o próximo
        document.getElementById('nome').value = "";
        document.getElementById('cpf').value = "";
        document.getElementById('telefone').value = "";
        document.getElementById('email').value = "";
        document.getElementById('valor').value = "";
        // O rodeio geralmente é o mesmo, então não limpei, mas se quiser limpar avise.

        btn.innerText = textoOriginal;
        btn.disabled = false;
    })
    .catch((error) => {
        console.error("Erro: ", error);
        alert("❌ Erro ao salvar: " + error.message);
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
}