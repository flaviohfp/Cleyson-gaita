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

// --- 2. VARIÁVEIS GLOBAIS E UTILITÁRIOS ---
let listaCobrancas = [];
let idEdicao = null; 

// [NOVO] Função de Validar CPF (Mesma do cliente)
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g,'');
    if(cpf == '') return false;
    // Elimina CPFs invalidos conhecidos
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida 1o digito
    let add = 0;
    for (let i=0; i < 9; i ++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i ++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    return true;
}

// --- 3. LOGIN ---
function verificarSenha() {
    const senha = document.getElementById('senhaAdmin').value;
    if(senha === "gaita123" || senha === "admin") { 
        document.getElementById('telaLogin').classList.add('hidden');
        document.getElementById('conteudoAdmin').classList.remove('hidden');
        carregarLista(); 
    } else {
        alert("Senha errada, vivente!");
    }
}

// --- 4. NAVEGAÇÃO ---
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

// --- 5. SALVAR (ATUALIZADO COM VALIDAÇÃO) ---
function salvarDivida() {
    const btn = document.getElementById('btnSalvar');
    
    // Dados Essenciais
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value.replace(/\D/g, ''); 
    const categoria = document.getElementById('categoria').value;
    const rodeio = document.getElementById('rodeio').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const observacao = document.getElementById('observacao').value;

    if (!nome || !cpf || !valor || !rodeio) {
        alert("Preencha Nome, CPF, Rodeio e Valor!");
        return;
    }

    // [NOVO] Verifica CPF antes de salvar
    if (!validarCPF(cpf)) {
        alert("CPF Inválido! Verifique os números, senão o peão não consegue acessar.");
        document.getElementById('cpf').focus();
        return;
    }

    btn.innerHTML = "Salvando...";
    btn.disabled = true;

    // Objeto limpo
    const dados = {
        nome: nome,
        cpf: cpf,
        categoria: categoria,
        rodeio: rodeio,
        valor: valor,
        observacao: observacao,
        status: "pendente",
        dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (idEdicao) {
        // ATUALIZAR
        db.collection("cobrancas").doc(idEdicao).update(dados)
        .then(() => {
            alert("Atualizado com sucesso!");
            finalizarSalvar();
        })
        .catch((error) => {
            console.error(error);
            alert("Erro ao atualizar.");
            btn.disabled = false;
        });
    } else {
        // NOVO
        db.collection("cobrancas").add(dados)
        .then(() => {
            alert("Cadastrado com sucesso!");
            finalizarSalvar();
        })
        .catch((error) => {
            console.error(error);
            alert("Erro ao salvar.");
            btn.disabled = false;
        });
    }
}

function finalizarSalvar() {
    resetarFormulario();
    document.getElementById('btnSalvar').innerHTML = '<i class="fa-solid fa-save"></i> SALVAR';
    document.getElementById('btnSalvar').disabled = false;
    mostrarLista();
}

// --- 6. LISTAR ---
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
            data.id = doc.id;
            listaCobrancas.push(data);
            
            // Verifica status para pintar de verde se pago
            const corStatus = data.status === 'pago' ? '#4CAF50' : '#d4af37';
            const textoStatus = data.status === 'pago' ? '(PAGO)' : '';

            const item = document.createElement('div');
            item.classList.add('item-lista-admin');
            item.style.borderBottom = "1px solid #333";
            item.style.padding = "15px";
            item.style.marginBottom = "10px";
            item.style.background = "#1a1a1a";
            item.style.borderRadius = "8px";

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color: ${corStatus}; font-size: 1.1rem;">${data.nome} ${textoStatus}</strong>
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

    idEdicao = id;

    // Preenche campos
    document.getElementById('nome').value = doc.nome;
    document.getElementById('cpf').value = doc.cpf;
    document.getElementById('categoria').value = doc.categoria;
    document.getElementById('rodeio').value = doc.rodeio;
    document.getElementById('valor').value = doc.valor;
    document.getElementById('observacao').value = doc.observacao || '';

    document.getElementById('btnSalvar').innerHTML = "ATUALIZAR DADOS";
    document.getElementById('btnCancelar').classList.remove('hidden');
    mostrarFormulario();
}

function excluir(id) {
    if(confirm("Tem certeza que quer apagar?")) {
        db.collection("cobrancas").doc(id).delete().then(() => {
            carregarLista();
        });
    }
}

// --- 8. FILTRO ---
function filtrarLista() {
    const termo = document.getElementById('filtroNome').value.toLowerCase();
    const divLista = document.getElementById('listaChuleadores');
    divLista.innerHTML = "";

    const filtrados = listaCobrancas.filter(item => item.nome.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        divLista.innerHTML = "<p style='text-align:center; padding:20px;'>Ninguém encontrado.</p>";
        return;
    }

    filtrados.forEach(data => {
        const corStatus = data.status === 'pago' ? '#4CAF50' : '#d4af37';
        
        const item = document.createElement('div');
        item.style.borderBottom = "1px solid #333";
        item.style.padding = "15px";
        item.style.marginBottom = "10px";
        item.style.background = "#1a1a1a";
        item.style.borderRadius = "8px";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color: ${corStatus};">${data.nome}</strong>
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
    document.getElementById('categoria').selectedIndex = 0;
    document.getElementById('rodeio').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('observacao').value = '';
    
    document.getElementById('btnSalvar').innerHTML = '<i class="fa-solid fa-save"></i> SALVAR';
    document.getElementById('btnCancelar').classList.add('hidden');
}