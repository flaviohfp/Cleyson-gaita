// --- 1. CONFIGURAÇÃO ---
const firebaseConfig = {
  apiKey: "AIzaSyDoTtpGZXCKSjMugmMekmKpmBZkwOOUcuM",
  authDomain: "cleyson-gaita.firebaseapp.com",
  projectId: "cleyson-gaita",
  storageBucket: "cleyson-gaita.firebasestorage.app",
  messagingSenderId: "227994892194",
  appId: "1:227994892194:web:127d95a5ae0ac77bdf24fb"
};

// Inicializa Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// INICIALIZA O EMAILJS (Você precisa criar conta gratuita no emailjs.com)
// Substitua "SUA_PUBLIC_KEY" pela chave que o EmailJS te der
(function(){
    emailjs.init("SUA_PUBLIC_KEY_AQUI"); 
})();

// --- 2. UTILITÁRIOS ---

const formatarMoeda = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// [NOVO] Algoritmo oficial de validação de CPF (Receita Federal)
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g,''); // Remove pontos e traços
    if(cpf == '') return false;
    
    // Elimina CPFs inválidos conhecidos (111.111.111-11, etc)
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida 1º dígito verificador
    let add = 0;
    for (let i=0; i < 9; i ++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    
    // Valida 2º dígito verificador
    add = 0;
    for (let i = 0; i < 10; i ++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// --- 3. CONTROLE DE TELA (LOGIN vs CADASTRO) ---
function toggleAuth(tipo) {
    const loginForm = document.getElementById('form-login');
    const cadForm = document.getElementById('form-cadastro');
    const btnLogin = document.getElementById('btnTabLogin');
    const btnCad = document.getElementById('btnTabCadastro');
    const msgErro = document.getElementById('msgErroAuth');

    msgErro.classList.add('hidden');

    if (tipo === 'login') {
        loginForm.classList.remove('hidden');
        cadForm.classList.add('hidden');
        btnLogin.classList.add('active');
        btnLogin.style.background = "linear-gradient(135deg, #b59021, var(--gold))";
        btnLogin.style.color = "black";
        btnCad.classList.remove('active');
        btnCad.style.background = "transparent";
        btnCad.style.color = "white";
    } else {
        loginForm.classList.add('hidden');
        cadForm.classList.remove('hidden');
        btnCad.classList.add('active');
        btnCad.style.background = "linear-gradient(135deg, #b59021, var(--gold))";
        btnCad.style.color = "black";
        btnLogin.classList.remove('active');
        btnLogin.style.background = "transparent";
        btnLogin.style.color = "white";
    }
}

// --- 4. SISTEMA DE LOGIN E CADASTRO ---

// Verificar se já está logado ao abrir
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        carregarDadosUsuario(user);
    } else {
        // Ninguém logado
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }
});

function fazerLogin() {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const msgErro = document.getElementById('msgErroAuth');

    if(!email || !senha) {
        msgErro.innerHTML = "Preencha e-mail e senha!";
        msgErro.classList.remove('hidden');
        return;
    }

    auth.signInWithEmailAndPassword(email, senha)
        .catch((error) => {
            msgErro.innerHTML = "Erro ao entrar: " + error.message;
            msgErro.classList.remove('hidden');
        });
}

// [NOVO] Função de Recuperar Senha
function recuperarSenha() {
    const email = document.getElementById('loginEmail').value;
    const msgErro = document.getElementById('msgErroAuth');

    if(!email) {
        msgErro.innerHTML = "Digite seu e-mail no campo acima e clique aqui novamente.";
        msgErro.classList.remove('hidden');
        // Foca no campo de e-mail para ajudar o usuário
        document.getElementById('loginEmail').focus();
        return;
    }

    if(confirm("Deseja receber um e-mail para redefinir sua senha em: " + email + "?")) {
        auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("E-mail enviado! Verifique sua caixa de entrada (e spam) para criar uma nova senha.");
            msgErro.classList.add('hidden');
        })
        .catch((error) => {
            console.error(error);
            if (error.code === 'auth/user-not-found') {
                msgErro.innerHTML = "E-mail não cadastrado.";
            } else {
                msgErro.innerHTML = "Erro ao enviar: " + error.message;
            }
            msgErro.classList.remove('hidden');
        });
    }
}

function fazerCadastro() {
    const nome = document.getElementById('cadNome').value;
    const cpfCru = document.getElementById('cadCpf').value;
    const cpf = cpfCru.replace(/\D/g, ''); // Limpa pontos e traços
    const telefone = document.getElementById('cadTelefone').value;
    const email = document.getElementById('cadEmail').value;
    const senha = document.getElementById('cadSenha').value;
    const msgErro = document.getElementById('msgErroAuth');

    if(!email || !senha || !cpf || !nome) {
        msgErro.innerHTML = "Preencha todos os campos!";
        msgErro.classList.remove('hidden');
        return;
    }

    // [NOVO] Validação de CPF antes de criar a conta
    if(!validarCPF(cpf)) {
        msgErro.innerHTML = "CPF Inválido! Confira os números.";
        msgErro.classList.remove('hidden');
        return;
    }

    // 1. Cria usuário no Auth
    auth.createUserWithEmailAndPassword(email, senha)
    .then((userCredential) => {
        // 2. Salva dados extras (CPF) no Firestore
        const user = userCredential.user;
        return db.collection('usuarios').doc(user.uid).set({
            nome: nome,
            email: email,
            cpf: cpf,
            telefone: telefone
        });
    })
    .then(() => {
        alert("Conta criada com sucesso! Bem-vindo.");
    })
    .catch((error) => {
        console.error(error);
        if(error.code === 'auth/email-already-in-use') {
            msgErro.innerHTML = "Este e-mail já está em uso.";
        } else if (error.code === 'auth/weak-password') {
            msgErro.innerHTML = "A senha deve ter pelo menos 6 caracteres.";
        } else {
            msgErro.innerHTML = "Erro ao cadastrar: " + error.message;
        }
        msgErro.classList.remove('hidden');
    });
}

function sair() {
    auth.signOut();
    location.reload();
}

// --- 5. LÓGICA DO DASHBOARD (CARREGAR DÍVIDAS) ---
function carregarDadosUsuario(user) {
    const spinner = document.getElementById('loading');
    spinner.classList.remove('hidden');

    // Busca o CPF do usuário logado na coleção 'usuarios'
    db.collection('usuarios').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            document.getElementById('userNameDisplay').innerText = userData.nome.split(' ')[0]; // Só o primeiro nome
            document.getElementById('userCpfDisplay').innerText = userData.cpf;
            
            buscarDividasPorCpf(userData.cpf, userData.email, userData.nome);
        } else {
            spinner.classList.add('hidden');
            document.getElementById('listaDividas').innerHTML = "<p>Erro: Perfil de usuário não encontrado.</p>";
        }
    });
}

function buscarDividasPorCpf(cpf, emailUser, nomeUser) {
    const divLista = document.getElementById('listaDividas');
    const spinner = document.getElementById('loading');
    
    // Busca cobranças pendentes
    db.collection("cobrancas")
      .where("cpf", "==", cpf)
      //.where("status", "!=", "pago") // Opcional: só mostrar o que não foi pago
      .get()
      .then((querySnapshot) => {
        spinner.classList.add('hidden');
        divLista.innerHTML = "";

        if (querySnapshot.empty) {
            divLista.innerHTML = "<div class='result-area'><p style='text-align:center; color:#888;'>Nenhuma pendência encontrada.<br><strong>Segue o baile! 🪗</strong></p></div>";
        } else {
            let html = "";
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const valor = parseFloat(data.valor);
                const idDoc = doc.id;
                const estaPago = data.status === 'pago';

                // Observação
                const obsHtml = data.observacao 
                    ? `<div class="detalhe-servico"><i class="fa-solid fa-circle-info"></i> ${data.observacao}</div>` 
                    : '';

                // Botão de Ação (Pagar ou Ver Recibo)
                let btnAcao = "";
                if(estaPago) {
                    btnAcao = `<button class="btn-outline" style="margin-top:10px; color:#4CAF50; border-color:#4CAF50; cursor:default;">
                                <i class="fa-solid fa-check"></i> PAGO
                               </button>`;
                } else {
                    // Botão Pagar chama a função de pagamento passando dados para o email
                    btnAcao = `<button onclick="realizarPagamento('${idDoc}', '${data.rodeio}', ${valor}, '${emailUser}', '${nomeUser}')" class="btn-gold">
                                <i class="fa-solid fa-dollar-sign"></i> PAGAR AGORA
                               </button>`;
                }

                html += `
                    <div class="result-area">
                        <div class="result-item" style="border:none;">
                            <div style="font-size: 0.8rem; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                                ${data.rodeio}
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size: 1.1rem; font-weight: bold;">
                                    ${data.nome} 
                                    <small style="color:#888; font-weight: normal;">(${data.categoria || '-'})</small>
                                </span>
                                <span class="total-value">${formatarMoeda(valor)}</span>
                            </div>

                            ${obsHtml}

                            ${btnAcao}
                        </div>
                    </div>
                `;
            });
            divLista.innerHTML = html;
        }
    });
}

// --- 6. PAGAMENTO E ENVIO DE E-MAIL ---
function realizarPagamento(idDoc, nomeRodeio, valor, emailUser, nomeUser) {
    if(!confirm(`Confirma o pagamento de ${formatarMoeda(valor)} referente ao ${nomeRodeio}? \n(Isso simulará o pagamento e enviará o recibo)`)) {
        return;
    }

    const btn = event.target;
    btn.innerHTML = "Processando...";
    btn.disabled = true;

    // 1. Atualiza no banco para "pago"
    db.collection("cobrancas").doc(idDoc).update({
        status: "pago",
        dataPagamento: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // 2. Envia o E-mail via EmailJS
        enviarEmailComprovante(emailUser, nomeUser, nomeRodeio, valor);
        
        alert("Pagamento confirmado! O comprovante foi enviado para seu e-mail.");
        location.reload(); // Recarrega para atualizar a lista
    })
    .catch((error) => {
        console.error("Erro no pagamento:", error);
        alert("Erro ao processar pagamento.");
        btn.innerHTML = "Tentar Novamente";
        btn.disabled = false;
    });
}

function enviarEmailComprovante(emailDestino, nome, rodeio, valor) {
    // Configuração do EmailJS
    // Você precisa criar um template no EmailJS com as variáveis: {{nome}}, {{rodeio}}, {{valor}}
    
    const templateParams = {
        to_email: emailDestino,
        to_name: nome,
        rodeio_nome: rodeio,
        valor_pago: formatarMoeda(valor),
        data_pagamento: new Date().toLocaleDateString('pt-BR')
    };

    // Substitua SERVICE_ID e TEMPLATE_ID pelos seus do EmailJS
    emailjs.send('SERVICE_ID', 'TEMPLATE_ID', templateParams)
        .then(function(response) {
           console.log('E-mail enviado com sucesso!', response.status, response.text);
        }, function(error) {
           console.log('FALHA ao enviar e-mail...', error);
        });
}