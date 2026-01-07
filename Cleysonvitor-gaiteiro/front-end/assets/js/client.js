// --- 1. CONFIGURAÇÃO (Chaves do Cleyson) ---
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

// --- 2. UTILITÁRIOS ---
const formatarMoeda = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- 3. LÓGICA DE BUSCA ---
function buscarDivida() {
    const cpfInput = document.getElementById('cpfBusca');
    // Remove tudo que não for número
    const cpfLimpo = cpfInput.value.replace(/\D/g, ''); 

    const resDiv = document.getElementById('resultado');
    const errDiv = document.getElementById('erro');
    const loadDiv = document.getElementById('loading');
    
    // Reseta a tela
    resDiv.innerHTML = '';
    resDiv.classList.add('hidden');
    errDiv.classList.add('hidden');

    // Validação
    if(cpfLimpo.length < 1) {
        errDiv.innerHTML = "Digite o CPF primeiro, vivente.";
        errDiv.classList.remove('hidden');
        return;
    }

    loadDiv.classList.remove('hidden'); // Mostra spinner

    // Busca no Banco
    db.collection("cobrancas").where("cpf", "==", cpfLimpo).get()
    .then((querySnapshot) => {
        loadDiv.classList.add('hidden'); // Esconde spinner

        if (querySnapshot.empty) {
            resDiv.innerHTML = "<p style='text-align:center; color:#888;'>Nenhuma pendência encontrada. <br><strong>Segue o baile! 🪗</strong></p>";
            resDiv.classList.remove('hidden');
        } else {
            let html = "";
            let total = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                let valorNumerico = parseFloat(data.valor);
                total += valorNumerico;

                html += `
                    <div class="result-item">
                        <div style="font-size: 0.8rem; color: #d4af37;">${data.rodeio}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>${data.nome} <small style="color:#666">(${data.categoria || '-'})</small></span>
                            <span class="total-value">${formatarMoeda(valorNumerico)}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `<div style="margin-top:15px; padding-top:10px; border-top: 1px dashed #444; text-align:right;">
                        <small>TOTAL A PAGAR:</small><br>
                        <span style="color: white; font-size: 1.5rem;">${formatarMoeda(total)}</span>
                     </div>`;

            resDiv.innerHTML = html;
            resDiv.classList.remove('hidden');
        }
    })
    .catch((error) => {
        loadDiv.classList.add('hidden');
        console.error("Erro:", error);
        errDiv.innerHTML = "Erro de conexão.";
        errDiv.classList.remove('hidden');
    });
}