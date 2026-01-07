// --- 1. CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDoTtpGZXCKSjMugmMekmKpmBZkwOOUcuM",
  authDomain: "cleyson-gaita.firebaseapp.com",
  projectId: "cleyson-gaita",
  storageBucket: "cleyson-gaita.firebasestorage.app",
  messagingSenderId: "227994892194",
  appId: "1:227994892194:web:127d95a5ae0ac77bdf24fb"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 2. VARIÁVEIS GLOBAIS ---
let listaCobrancas = [];
let idEdicao = null; // Se estiver null, é novo cadastro. Se tiver ID, é edição.

// --- 3. FUNÇÕES DE LOGIN ---
function verificarSenha() {
    const senha = document.getElementById('senhaAdmin').value;
    
    // Senha simples (Pode mudar aqui)
    if(senha === "gaita123" || senha === "admin") {
        document.getElementById('telaLogin').classList.add('hidden');
        document.getElementById('conteudoAdmin').classList.remove('hidden');
        carregarLista(); // Já carrega a lista ao entrar
    } else {
        alert("Senha errada, vivente!");
    }
}

// --- 4. FUNÇÕES DE NAVEGAÇÃO (Abas) ---
function mostrarFormulario() {
    document.getElementById('telaFormulario').classList.remove('hidden');
    document.getElementById('telaLista').classList.add('hidden');
    
    document.getElementById('tabNovo').classList.add('active');
    document.getElementById('tabLista').classList.remove('active');
    
    resetarFormulario();
}

function mostrarLista() {
    document.getElementById('telaFormulario').classList.add('hidden');
    document.getElementById('telaLista').classList.remove('hidden');
    
    document.getElementById('tabNovo').classList.remove('active');
    document.getElementById('tabLista').classList.add('active');
    
    carregarLista();
}

// --- 5. SALVAR (NOVO OU EDIÇÃO) ---
function salvarDivida() {
    const btn = document.getElementById('btnSalvar');
    
    // Pega os dados dos inputs
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value.replace(/\D/g, ''); // Limpa CPF
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const categoria = document.getElementById('categoria').value;
    const rodeio = document.getElementById('rodeio').value;
    const valor = parseFloat(document.getElementById('valor').value);
    
    // --- NOVO: Pega a observação ---
    const observacao = document.getElementById('observacao').value; 

    // Validação básica
    if (!nome || !cpf || !valor || !rodeio) {
        alert("Preencha pelo menos Nome, CPF, Rodeio e Valor!");
        return;
    }

    btn.innerHTML = "Salvando...";
    btn.disabled = true;

    const dados = {
        nome: nome,
        cpf: cpf,
        telefone: telefone,
        email: email,
        categoria: categoria,
        rodeio: rodeio,
        valor: valor,
        observacao: observacao, // --- SALVA NO BANCO ---
        dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (idEdicao) {
        // MODO EDIÇÃO
        db.collection("cobrancas").doc(idEdicao).update(dados)
        .then(() => {
            alert("Cadastro atualizado com sucesso!");
            finalizarSalvar();
        })
        .catch((error) => {
            console.error("Erro ao atualizar: ", error);
            alert("Erro ao atualizar.");
            btn.innerHTML = "SALVAR";
            btn.disabled = false;
        });
    } else {
        // MODO NOVO CADASTRO
        db.collection("cobrancas").add(dados)
        .then(() => {
            alert("Dívida cadastrada com sucesso!");
            finalizarSalvar();
        })
        .catch((error) => {
            console.error("Erro ao salvar: ", error);
            alert("Erro ao salvar.");
            btn.innerHTML = "SALVAR";
            btn.disabled = false;
        });
    }
}

function finalizarSalvar() {
    resetarFormulario();
    document.getElementById('btnSalvar').innerHTML = '<i class="fa-solid fa-save"></i> SALVAR';
    document.getElementById('btnSalvar').disabled = false;
    mostrarLista(); // Volta para a lista para ver o resultado
}

// --- 6. CARREGAR E LISTAR ---
function carregarLista() {
    const divLista = document.getElementById('listaChuleadores');
    divLista.innerHTML = '<div class="spinner"></div>';

    db.collection("cobrancas").orderBy("dataRegistro", "desc").get()
    .then((querySnapshot) => {
        listaCobrancas = [];
        divLista.innerHTML = "";

        if (querySnapshot.empty) {
            divLista.innerHTML = "<p style='text-align:center; color:#888'>Nenhum cadastro ainda.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id; // Guarda o ID do documento
            listaCobrancas.push(data);
            
            // Cria o HTML do item na lista
            const item = document.createElement('div');
            item.classList.add('item-lista-admin');
            // Estilo inline básico para lista do admin (pode mover pro CSS se quiser)
            item.style.borderBottom = "1px solid #333";
            item.style.padding = "10px";
            item.style.marginBottom = "10px";
            item.style.background = "#1a1a1a";
            item.style.borderRadius = "8px";

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color: #d4af37; font-size: 1.1rem;">${data.nome}</strong>
                        <div style="font-size: 0.9rem; color: #ccc;">${data.rodeio} - R$ ${parseFloat(data.valor).toFixed(2)}</div>
                        <div style="font-size: 0.8rem; color: #666;">CPF: ${data.cpf}</div>
                    </div>
                    <div>
                        <button onclick="editar('${data.id}')" style="width:auto; padding: 8px 12px; font-size:0.8rem; margin-right:5px; background:#444;">✏️</button>
                        <button onclick="excluir('${data.id}')" style="width:auto; padding: 8px 12px; font-size:0.8rem; background:#8b0000; color:white;">🗑️</button>
                    </div>
                </div>
            `;
            divLista.appendChild(item);
        });
    });
}

// --- 7. EDITAR E EXCLUIR ---
function editar(id) {
    const doc = listaCobrancas.find(x => x.id === id);
    if (!doc) return;

    idEdicao = id; // Marca que estamos editando

    // Preenche os campos
    document.getElementById('nome').value = doc.nome;
    document.getElementById('cpf').value = doc.cpf;
    document.getElementById('telefone').value = doc.telefone;
    document.getElementById('email').value = doc.email;
    document.getElementById('categoria').value = doc.categoria;
    document.getElementById('rodeio').value = doc.rodeio;
    document.getElementById('valor').value = doc.valor;
    
    // --- NOVO: Preenche a observação na edição ---
    document.getElementById('observacao').value = doc.observacao || ''; 

    // Muda visual dos botões
    document.getElementById('btnSalvar').innerHTML = "ATUALIZAR DADOS";
    document.getElementById('btnCancelar').classList.remove('hidden');
    
    mostrarFormulario();
}

function excluir(id) {
    if(confirm("Tem certeza que quer apagar essa dívida?")) {
        db.collection("cobrancas").doc(id).delete().then(() => {
            carregarLista();
        }).catch((error) => {
            console.error("Erro ao excluir: ", error);
        });
    }
}

// --- 8. FILTRO DE BUSCA NA LISTA ---
function filtrarLista() {
    const termo = document.getElementById('filtroNome').value.toLowerCase();
    const divLista = document.getElementById('listaChuleadores');
    divLista.innerHTML = "";

    const filtrados = listaCobrancas.filter(item => item.nome.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        divLista.innerHTML = "<p style='text-align:center'>Ninguém encontrado.</p>";
        return;
    }

    filtrados.forEach(data => {
        const item = document.createElement('div');
        item.style.borderBottom = "1px solid #333";
        item.style.padding = "10px";
        item.style.marginBottom = "10px";
        item.style.background = "#1a1a1a";
        item.style.borderRadius = "8px";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color: #d4af37;">${data.nome}</strong>
                    <div style="font-size: 0.9rem; color: #ccc;">${data.rodeio} - R$ ${parseFloat(data.valor).toFixed(2)}</div>
                </div>
                <div>
                    <button onclick="editar('${data.id}')" style="width:auto; padding: 5px 10px; font-size:0.8rem; background:#444;">✏️</button>
                    <button onclick="excluir('${data.id}')" style="width:auto; padding: 5px 10px; font-size:0.8rem; background:#8b0000; color:white;">🗑️</button>
                </div>
            </div>
        `;
        divLista.appendChild(item);
    });
}

// --- 9. RESET ---
function resetarFormulario() {
    idEdicao = null;
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('categoria').selectedIndex = 0;
    document.getElementById('rodeio').value = '';
    document.getElementById('valor').value = '';
    
    // --- NOVO: Limpa a observação ---
    document.getElementById('observacao').value = ''; 

    document.getElementById('btnSalvar').innerHTML = '<i class="fa-solid fa-save"></i> SALVAR';
    document.getElementById('btnCancelar').classList.add('hidden');
}