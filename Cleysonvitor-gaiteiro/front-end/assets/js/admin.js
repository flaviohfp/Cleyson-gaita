// --- CONFIGURAÇÃO DO FIREBASE (ADMIN) ---
// Cole suas chaves aqui novamente
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_ID_DO_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 1. LÓGICA DE LOGIN ---
function fazerLoginAdmin() {
    const senha = document.getElementById('senhaAdminInput').value;
    
    // DEFINA A SENHA AQUI
    if(senha === "1234") { 
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('painelCadastro').classList.remove('hidden');
    } else {
        alert("Senha incorreta, tchê!");
    }
}

function sairAdmin() {
    location.reload(); // Recarrega a página para bloquear de novo
}

// --- 2. LÓGICA DE CADASTRO ---
function cadastrarDivida() {
    const nome = document.getElementById('nomeChuleador').value;
    const cpf = document.getElementById('cpfCadastro').value;
    const categoria = document.getElementById('categoriaChuleador').value;
    const telefone = document.getElementById('telefoneChuleador').value;
    const email = document.getElementById('emailChuleador').value;
    const rodeio = document.getElementById('nomeRodeio').value;
    const valor = document.getElementById('valorCobrar').value;

    // Limpa CPF
    const cpfLimpo = cpf.replace(/\D/g, '');

    if(!nome || !cpfLimpo || !valor || !categoria) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    const btn = document.querySelector('button[type="submit"]');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = "Salvando...";
    btn.disabled = true;

    db.collection("cobrancas").add({
        nome: nome,
        cpf: cpfLimpo,
        categoria: categoria,
        telefone: telefone,
        email: email,
        rodeio: rodeio,
        valor: parseFloat(valor),
        data_cadastro: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pendente"
    })
    .then(() => {
        alert("✅ Cadastro realizado com sucesso!");
        
        // Limpar formulário (exceto rodeio, pra facilitar)
        document.getElementById('nomeChuleador').value = "";
        document.getElementById('cpfCadastro').value = "";
        document.getElementById('telefoneChuleador').value = "";
        document.getElementById('emailChuleador').value = "";
        document.getElementById('valorCobrar').value = "";
        
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    })
    .catch((error) => {
        alert("Erro: " + error);
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    });
}