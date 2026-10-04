/* =====================================================
   MENU DOS TRÊS PONTOS
===================================================== */

function abrirMenu() {
    const menu = document.getElementById("menuDropdown");

    if (menu) {
        menu.classList.toggle("ativo");
    }
}


/* Fecha o menu quando clicar fora */
document.addEventListener("click", function (event) {
    const menu = document.getElementById("menuDropdown");
    const botao = document.querySelector(".menu-botao");

    if (!menu || !botao) {
        return;
    }

    if (!menu.contains(event.target) && !botao.contains(event.target)) {
        menu.classList.remove("ativo");
    }
});


/* =====================================================
   ARMAZENAMENTO (localStorage)
   O localStorage já guarda os dados depois que o navegador
   é fechado. Estas funções garantem que o dado foi mesmo
   gravado (e avisam quando o navegador bloqueia) e pedem ao
   navegador que não apague os dados do site sozinho.
===================================================== */

function gravarLocal(chave, texto) {
    try {
        localStorage.setItem(chave, texto);
        return localStorage.getItem(chave) === texto;
    } catch (erro) {
        return false;
    }
}

function pedirArmazenamentoPersistente() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist();
        }
    } catch (erro) {
        // Sem suporte: os dados continuam salvos normalmente.
    }
}

const AVISO_ARMAZENAMENTO =
    "Não foi possível salvar os dados neste navegador.\n\n" +
    "Verifique se a janela não é anônima e se o armazenamento " +
    "do site (cookies e dados) não está bloqueado.";


/* =====================================================
   CADASTRO
===================================================== */

function cadastrarUsuario(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const data = document.getElementById("data").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const papel = document.getElementById("papel").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (nome === "") {
        alert("Digite seu nome completo.");
        return;
    }

    if (cpf === "") {
        alert("Digite seu CPF.");
        return;
    }

    if (data === "") {
        alert("Digite sua data de nascimento.");
        return;
    }

    if (telefone === "") {
        alert("Digite seu telefone.");
        return;
    }

    if (email === "") {
        alert("Digite seu e-mail.");
        return;
    }

    if (papel === "") {
        alert("Selecione seu papel na instituição.");
        return;
    }

    if (senha === "") {
        alert("Digite uma senha.");
        return;
    }

    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não são iguais.");
        return;
    }

    const usuarioExistente = localStorage.getItem("usuarioProntVita");

    if (usuarioExistente) {
        try {
            const usuario = JSON.parse(usuarioExistente);

            if (
                usuario.email &&
                usuario.email.toLowerCase() === email.toLowerCase()
            ) {
                alert("Já existe uma conta cadastrada com esse e-mail.");
                return;
            }

            const substituir = confirm(
                "Já existe uma conta cadastrada (" +
                (usuario.email || usuario.nome || "sem nome") +
                ").\n\nCriar um novo cadastro vai substituí-la. Deseja continuar?"
            );

            if (!substituir) {
                return;
            }
        } catch (erro) {
            // Se houver dado corrompido, ele será substituído pelo novo cadastro.
            localStorage.removeItem("usuarioProntVita");
        }
    }

    const usuario = {
        nome: nome,
        cpf: cpf,
        data: data,
        telefone: telefone,
        email: email,
        papel: papel,
        senha: senha
    };

    if (!gravarLocal("usuarioProntVita", JSON.stringify(usuario))) {
        alert(AVISO_ARMAZENAMENTO);
        return;
    }

    try {
        localStorage.removeItem("usuarioLogado");
    } catch (erro) {}

    pedirArmazenamentoPersistente();

    alert("Cadastro realizado com sucesso!");

    window.location.href = "index.html";
}


/* =====================================================
   LOGIN
===================================================== */

function entrar(event) {
    event.preventDefault();

    const campoUsuario = document.getElementById("usuario");
    const campoSenha = document.getElementById("senha");

    if (!campoUsuario || !campoSenha) {
        return;
    }

    const usuarioDigitado = campoUsuario.value.trim();
    const senhaDigitada = campoSenha.value;

    if (usuarioDigitado === "" || senhaDigitada === "") {
        alert("Preencha o nome/e-mail e a senha.");
        return;
    }

    const dadosSalvos = localStorage.getItem("usuarioProntVita");

    if (!dadosSalvos) {
        alert("Nenhuma conta cadastrada. Faça seu cadastro primeiro.");
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(dadosSalvos);
    } catch (erro) {
        localStorage.removeItem("usuarioProntVita");
        alert("Os dados da conta estão corrompidos. Faça o cadastro novamente.");
        return;
    }

    const emailUsuario = String(usuario.email || "").toLowerCase();
    const nomeUsuario = String(usuario.nome || "").toLowerCase();
    const usuarioInformado = usuarioDigitado.toLowerCase();

    const usuarioCorreto =
        emailUsuario === usuarioInformado ||
        nomeUsuario === usuarioInformado;

    const senhaCorreta = usuario.senha === senhaDigitada;

    if (!usuarioCorreto || !senhaCorreta) {
        alert("Nome/e-mail ou senha incorretos.");
        return;
    }

    localStorage.setItem("usuarioLogado", "true");
    window.location.href = "principal.html";
}


/* =====================================================
   PROTEGER PRINCIPAL
===================================================== */

function verificarLogin() {
    const logado = localStorage.getItem("usuarioLogado");

    if (logado !== "true") {
        alert("Faça login para acessar o sistema.");
        window.location.href = "index.html";
        return false;
    }

    return true;
}


/* =====================================================
   MOSTRAR NOME
===================================================== */

function carregarUsuario() {
    const dadosSalvos = localStorage.getItem("usuarioProntVita");

    if (!dadosSalvos) {
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(dadosSalvos);
    } catch (erro) {
        return;
    }

    const elemento = document.querySelector(".nome-usuario");

    if (elemento && usuario.nome) {
        elemento.textContent = usuario.nome;
    }
}


/* =====================================================
   ESQUECI A SENHA
===================================================== */

function esqueciSenha(event) {
    event.preventDefault();

    const modal = document.getElementById("modalSenha");

    if (!modal) {
        return;
    }

    if (!localStorage.getItem("usuarioProntVita")) {
        alert("Nenhuma conta cadastrada. Faça seu cadastro primeiro.");
        return;
    }

    const form = document.getElementById("formSenha");

    if (form) {
        form.reset();
    }

    modal.classList.add("ativo");

    const primeiroCampo = document.getElementById("emailRecuperacao");

    if (primeiroCampo) {
        primeiroCampo.focus();
    }
}


function fecharModalSenha() {
    const modal = document.getElementById("modalSenha");

    if (modal) {
        modal.classList.remove("ativo");
    }
}


function redefinirSenha(event) {
    event.preventDefault();

    const email = document.getElementById("emailRecuperacao").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmar = document.getElementById("confirmarNovaSenha").value;

    let usuario;

    try {
        usuario = JSON.parse(localStorage.getItem("usuarioProntVita"));
    } catch (erro) {
        usuario = null;
    }

    if (!usuario) {
        alert("Não foi possível recuperar os dados da conta.");
        return;
    }

    if (
        email === "" ||
        String(usuario.email || "").toLowerCase() !== email.toLowerCase()
    ) {
        alert("Esse e-mail não corresponde à conta cadastrada.");
        return;
    }

    if (novaSenha.length < 6) {
        alert("A nova senha deve ter pelo menos 6 caracteres.");
        return;
    }

    if (novaSenha !== confirmar) {
        alert("As senhas não são iguais.");
        return;
    }

    if (novaSenha === usuario.senha) {
        alert("A nova senha deve ser diferente da senha atual.");
        return;
    }

    usuario.senha = novaSenha;

    if (!gravarLocal("usuarioProntVita", JSON.stringify(usuario))) {
        alert(AVISO_ARMAZENAMENTO);
        return;
    }

    fecharModalSenha();

    alert("Senha alterada com sucesso! Entre com a nova senha.");
}


/* Fecha a janela ao clicar fora dela ou apertar Esc */
document.addEventListener("click", function (event) {
    const modal = document.getElementById("modalSenha");

    if (modal && event.target === modal) {
        fecharModalSenha();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        fecharModalSenha();
    }
});


/* =====================================================
   SAIR
===================================================== */

function sairSistema() {
    const confirmar = confirm("Deseja realmente sair do sistema?");

    if (!confirmar) {
        return;
    }

    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
}


/* =====================================================
   CONTADORES
===================================================== */

function atualizarContadores() {

    function lerListaLocal(chave) {
        try {
            const dados = JSON.parse(localStorage.getItem(chave));
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            return [];
        }
    }

    /* só conta exames de pacientes que ainda estão no cadastro */
    const pacientes = lerListaLocal("pacientesProntVita");

    const idsPacientes = new Set(pacientes.map(p => String(p.id)));

    let solicitados = 0;
    let realizados = 0;

    lerListaLocal("examesProntVita").forEach(function (solicitacao) {

        if (!idsPacientes.has(String(solicitacao.pacienteId))) {
            return;
        }

        (Array.isArray(solicitacao.exames) ? solicitacao.exames : [])
            .forEach(function (exame) {

                solicitados++;

                if (exame.realizado === true) {
                    realizados++;
                }

            });

    });

    const pendentes = solicitados - realizados;

    const elementos = document.querySelectorAll(".resumo-card strong");

    if (elementos.length >= 4) {
        elementos[0].textContent = pacientes.length;
        elementos[1].textContent = solicitados;
        elementos[2].textContent = realizados;
        elementos[3].textContent = pendentes;
    }
}


/* =====================================================
   EXECUÇÃO AUTOMÁTICA
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    if (document.body.classList.contains("pagina-inicio")) {
        if (!verificarLogin()) {
            return;
        }

        carregarUsuario();
        atualizarContadores();
    }
});