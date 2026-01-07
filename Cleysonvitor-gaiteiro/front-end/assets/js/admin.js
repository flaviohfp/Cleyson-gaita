// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDoTtpGZXCKSjMugmMekmKpmBZkwOOUcuM",
  authDomain: "cleyson-gaita.firebaseapp.com",
  projectId: "cleyson-gaita",
  storageBucket: "cleyson-gaita.firebasestorage.app",
  messagingSenderId: "227994892194",
  appId: "1:227994892194:web:127d95a5ae0ac77bdf24fb"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- VARIÁVEIS GLOBAIS ---
let listaCache = []; // Para guardar a lista e não gastar leitura do Firebase à toa no filtro

// --- 1. LOGIN ---
function verificarSenha() {
    const senha = document.getElementById('senhaAdmin').value;
    if (senha === "1234") {
        document.getElementById('telaLogin').classList.add('hidden');
        document.getElementById('conteudoAdmin').classList.remove('hidden');
        // Já carrega a lista pra ficar pronta
        carregarListaFirebase();
    } else {
        alert("Senha errada, vivente!");
    }
}

// --- 2. CONTROLE DE ABAS (Novo / Lista) ---
function mostrarFormulario() {
    document.getElementById('telaFormulario').classList.remove('hidden');
    document.getElementById('telaLista').classList.add('hidden');
    
    document.getElementById('tabNovo').classList.add('active');
    document.getElementById('tabLista').classList.remove('active');
}

function mostrarLista() {
    document.getElementById('telaFormulario').classList.add('hidden');
    document.getElementById('telaLista').classList.remove('hidden');
    
    document.getElementById('tabNovo').classList.remove('active');
    document.getElementById('tabLista').classList.add('active');
    
    carregarListaFirebase(); // Atualiza a lista
}

// --- 3. SALVAR OU ATUALIZAR ---
function salvarDivida() {
    const idDoc = document.getElementById('idDoc').value; // Se tiver ID, é edição
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const categoria = document.getElementById('categoria').value;
    const rodeio = document.getElementById('rodeio').value;
    const valor = document.getElementById('valor').value;

    if (!nome || !cpf || !valor || !categoria) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    const btn = document.getElementById('btnSalvar');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = "Processando...";
    btn.disabled = true;

    const dados = {
        nome, cpf, telefone, email, categoria, rodeio,
        valor: parseFloat(valor),
        status: "pendente"
    };

    let promessa;

    // DECISÃO: EDITAR ou CRIAR?
    if (idDoc) {
        // ATUALIZAR (Update)
        promessa = db.collection("cobrancas").doc(idDoc).update(dados);
    } else {
        // CRIAR NOVO (Add)
        dados.data_cadastro = firebase.firestore.FieldValue.serverTimestamp();
        promessa = db.collection("cobrancas").add(dados);
    }

    promessa.then(() => {
        alert(idDoc ? "✅ Atualizado com sucesso!" : "✅ Cadastrado com sucesso!");
        resetarFormulario();
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
        carregarListaFirebase(); // Atualiza a lista no fundo
    })
    .catch((erro) => {
        alert("Erro: " + erro.message);
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    });
}

// --- 4. CARREGAR LISTA ---
function carregarListaFirebase() {
    const container = document.getElementById('listaChuleadores');
    // container.innerHTML = '<div class="spinner"></div>'; // Loading

    db.collection("cobrancas").orderBy("data_cadastro", "desc").get()
    .then((querySnapshot) => {
        listaCache = [];
        let html = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Salva no cache com o ID
            listaCache.push({ id: doc.id, ...data });
        });

        renderizarLista(listaCache);
    });
}

function renderizarLista(lista) {
    const container = document.getElementById('listaChuleadores');
    
    if(lista.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Ninguém devendo? Duvido! 😂</p>";
        return;
    }

    let html = "";
    lista.forEach((item) => {
        html += `
            <div class="card-item">
                <div>
                    <span class="info-nome">${item.nome}</span>
                    <span class="info-sub">CPF: ${item.cpf} | ${item.rodeio}</span>
                    <span class="info-sub" style="color:var(--gold)">R$ ${parseFloat(item.valor).toFixed(2)}</span>
                </div>
                <div class="actions">
                    <button onclick="editarItem('${item.id}')" class="btn-icon edit-btn">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="excluirItem('${item.id}', '${item.nome}')" class="btn-icon delete-btn">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// --- 5. EDITAR E EXCLUIR ---
function editarItem(id) {
    // Acha o item na memória (cache)
    const item = listaCache.find(i => i.id === id);
    if(!item) return;

    // Preenche o formulário
    document.getElementById('idDoc').value = item.id;
    document.getElementById('nome').value = item.nome;
    document.getElementById('cpf').value = item.cpf;
    document.getElementById('telefone').value = item.telefone;
    document.getElementById('email').value = item.email;
    document.getElementById('categoria').value = item.categoria;
    document.getElementById('rodeio').value = item.rodeio;
    document.getElementById('valor').value = item.valor;

    // Muda o texto do botão
    document.getElementById('btnSalvar').innerHTML = "ATUALIZAR DADOS";
    document.getElementById('btnCancelar').classList.remove('hidden');

    // Volta pra aba de formulário
    mostrarFormulario();
}

function excluirItem(id, nome) {
    if(confirm(`Tem certeza que quer excluir o calote do ${nome}?`)) {
        db.collection("cobrancas").doc(id).delete()
        .then(() => {
            alert("Excluído com sucesso!");
            carregarListaFirebase();
        });
    }
}

// --- 6. UTILITÁRIOS ---
function resetarFormulario() {
    document.getElementById('idDoc').value = "";
    document.getElementById('nome').value = "";
    document.getElementById('cpf').value = "";
    document.getElementById('telefone').value = "";
    document.getElementById('email').value = "";
    document.getElementById('valor').value = "";
    
    document.getElementById('btnSalvar').innerHTML = "<i class='fa-solid fa-save'></i> SALVAR";
    document.getElementById('btnCancelar').classList.add('hidden');
}

function filtrarLista() {
    const termo = document.getElementById('filtroNome').value.toLowerCase();
    const filtrados = listaCache.filter(item => item.nome.toLowerCase().includes(termo));
    renderizarLista(filtrados);
}