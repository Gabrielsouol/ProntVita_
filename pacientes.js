let pacienteEditando = null;

const CHAVE_PACIENTES = "pacientesProntVita";
/* A chave continua "historicoProntVita" para não perder os registros já salvos */
const CHAVE_AUDITORIA = "historicoProntVita";
const CHAVE_TIMELINE = "timelineProntVita";

/* Campos do cadastro (id do input no formulário, chave no objeto, rótulo) */
const CAMPOS_CADASTRO = [
    ["pacienteNome", "nome", "Nome"],
    ["pacienteTelefone", "telefone", "Telefone"],
    ["pacienteCpf", "cpf", "CPF"],
    ["pacienteNascimento", "nascimento", "Nascimento"],
    ["pacienteConvenio", "convenio", "Convênio"],
    ["pacienteUltimaConsulta", "ultimaConsulta", "Última consulta"]
];

/* Campos clínicos (só aparecem na edição) */
const CAMPOS_CLINICOS = [
    ["pacienteProcedimentos", "procedimentos", "Procedimentos", 3],
    ["pacienteHistoricoClinico", "historicoClinico", "Histórico Clínico", 4],
    ["pacienteAlergias", "alergias", "Alergias", 3],
    ["pacienteMedicamentos", "medicamentos", "Medicamentos", 3],
    ["pacienteSinaisVitais", "sinaisVitais", "Sinais Vitais", 3]
];

/* Acompanhamento do paciente: coluna ao lado dos campos clínicos (só na edição) */
const CAMPOS_ACOMPANHAMENTO = [
    ["pacienteEvolucoes", "evolucoes", "Evoluções/Anotações", 3],
    ["pacienteAvaliacoesEnfermagem", "avaliacoesEnfermagem", "Avaliações de Enfermagem", 3],
    ["pacienteDietaNutricao", "dietaNutricao", "Dieta e Nutrição", 3],
    ["pacienteDispositivos", "dispositivos", "Dispositivos", 3],
    ["pacientePlanosCuidado", "planosCuidado", "Planos de Cuidado", 3],
    ["pacienteIntercorrencias", "intercorrencias", "Intercorrências", 3]
];


/* =====================================================
   ARMAZENAMENTO
===================================================== */

function lerLista(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        return [];
    }
}

function obterPacientes() { return lerLista(CHAVE_PACIENTES); }
function obterAuditoria() { return lerLista(CHAVE_AUDITORIA); }
function obterLinhaDoTempo() { return lerLista(CHAVE_TIMELINE); }

/* Grava e confere se foi salvo de verdade; avisa se o navegador bloquear */
function gravarLista(chave, lista) {

    const texto = JSON.stringify(lista);

    try {
        localStorage.setItem(chave, texto);

        if (localStorage.getItem(chave) === texto) {

            if (typeof pedirArmazenamentoPersistente === "function") {
                pedirArmazenamentoPersistente();
            }

            return true;
        }
    } catch (erro) {}

    alert(
        typeof AVISO_ARMAZENAMENTO === "string"
            ? AVISO_ARMAZENAMENTO
            : "Não foi possível salvar os dados neste navegador."
    );

    return false;

}

function salvarPacientes(p) { return gravarLista(CHAVE_PACIENTES, p); }
function salvarAuditoria(h) { return gravarLista(CHAVE_AUDITORIA, h); }
function salvarLinhaDoTempo(t) { return gravarLista(CHAVE_TIMELINE, t); }

function buscarPacientePorId(id, pacientes = obterPacientes()) {
    return pacientes.find(p => String(p.id) === String(id)) || null;
}


/* =====================================================
   VÍNCULO COM O CADASTRO
   Histórico e linha do tempo guardam só o pacienteId
   (+ uma cópia dos dados, usada apenas se o paciente
   for excluído). Na exibição, os dados vêm SEMPRE do
   cadastro atual.
===================================================== */

function dadosPacienteDoEvento(evento, pacientes) {

    const atual = buscarPacientePorId(evento.pacienteId, pacientes);

    if (atual) {
        return {
            nome: atual.nome,
            telefone: atual.telefone,
            codigo: atual.codigo,
            cpf: atual.cpf,
            excluido: false
        };
    }

    return {
        nome: evento.nome,
        telefone: evento.telefone,
        codigo: evento.codigo,
        cpf: evento.cpf,
        excluido: true
    };

}

function correspondeBusca(dados, termo) {

    if (!termo) return true;

    return ["nome", "codigo", "telefone", "cpf"].some(
        campo => String(dados[campo] || "").toLowerCase().includes(termo)
    );

}


/* =====================================================
   REGISTRAR EVENTOS (auditoria + linha do tempo)
===================================================== */

/* Usuário que está usando o sistema (conta cadastrada neste navegador) */
const ROTULOS_PAPEL = {
    medico: "Médico",
    enfermeiro: "Enfermeiro",
    tecnico: "Técnico de Enfermagem",
    administrativo: "Administrativo",
    outro: "Outro"
};

function obterUsuarioAtual() {

    try {

        const usuario = JSON.parse(localStorage.getItem("usuarioProntVita"));

        if (usuario && usuario.nome) {
            return {
                nome: usuario.nome,
                papel: ROTULOS_PAPEL[usuario.papel] || ""
            };
        }

    } catch (erro) {}

    return { nome: "", papel: "" };

}

function criarEvento(paciente, rotulo, descricao, chaveRotulo, alteracoes) {

    return {
        id: gerarID(),
        pacienteId: paciente.id,

        /* quem fez a alteração */
        usuario: obterUsuarioAtual(),

        /* o que mudou: [{ chave, campo, antes, depois }] */
        alteracoes: Array.isArray(alteracoes) ? alteracoes : [],

        /* cópia de segurança (usada só se o paciente for excluído) */
        nome: paciente.nome,
        telefone: paciente.telefone,
        codigo: paciente.codigo,
        cpf: paciente.cpf,

        [chaveRotulo]: rotulo,
        descricao: descricao,
        data: new Date().toISOString()
    };

}

function registrarAuditoria(paciente, acao, descricao, alteracoes) {
    const historico = obterAuditoria();
    historico.unshift(criarEvento(paciente, acao, descricao, "acao", alteracoes));
    salvarAuditoria(historico);
}

function registrarLinhaDoTempo(paciente, tipo, descricao) {
    const timeline = obterLinhaDoTempo();
    timeline.unshift(criarEvento(paciente, tipo, descricao, "tipo"));
    salvarLinhaDoTempo(timeline);
}

/* alteracoes (opcional): [{ chave, campo, antes, depois }] - só vai para a Auditoria */
function registrarEvento(paciente, acao, descricao, alteracoes) {
    registrarAuditoria(paciente, acao, descricao, alteracoes);
    registrarLinhaDoTempo(paciente, acao, descricao);
}

/* Lista campo a campo o que mudou, com o valor de antes e o de depois */
function listarAlteracoes(antes, depois) {

    const lista = [];

    [...CAMPOS_CADASTRO, ...CAMPOS_CLINICOS, ...CAMPOS_ACOMPANHAMENTO]
        .forEach(function ([, chave, rotulo]) {

            const a = antes[chave] || "";
            const b = depois[chave] || "";

            if (a !== b) {
                lista.push({ chave: chave, campo: rotulo, antes: a, depois: b });
            }

        });

    return lista;

}

/* Descreve o que mudou entre o cadastro antigo e o novo */
function descreverAlteracoes(antes, depois) {

    const partes = [];

    CAMPOS_CADASTRO.forEach(function ([, chave, rotulo]) {

        const a = antes[chave] || "";
        const b = depois[chave] || "";

        if (a !== b) {
            partes.push(`${rotulo}: "${a || "—"}" → "${b || "—"}"`);
        }

    });

    [...CAMPOS_CLINICOS, ...CAMPOS_ACOMPANHAMENTO].forEach(function ([, chave, rotulo]) {

        if ((antes[chave] || "") !== (depois[chave] || "")) {
            partes.push(`${rotulo} atualizado`);
        }

    });

    return partes.length
        ? partes.join("; ") + "."
        : "Cadastro salvo sem alterações.";

}


/* =====================================================
   LISTA DE PACIENTES
===================================================== */

function renderizarPacientes(filtro = "") {

    const tabela = document.getElementById("listaPacientes");
    if (!tabela) return;

    const termo = filtro.trim().toLowerCase();

    const encontrados = obterPacientes().filter(
        p => correspondeBusca(p, termo)
    );

    tabela.innerHTML = "";

    if (encontrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="sem-pacientes">
                    Nenhum paciente encontrado.
                </td>
            </tr>
        `;
        return;
    }

    encontrados.forEach(function (paciente) {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td data-label="Nome">${escaparHTML(paciente.nome)}</td>
            <td data-label="Telefone">${escaparHTML(paciente.telefone)}</td>
            <td data-label="Código">${escaparHTML(paciente.codigo)}</td>
            <td data-label="Última consulta">${formatarData(paciente.ultimaConsulta)}</td>
            <td data-label="Nascimento">${formatarData(paciente.nascimento)}</td>
            <td data-label="Convênio">${escaparHTML(paciente.convenio)}</td>
            <td data-label="Ações">
                <div class="acoes-paciente">

                    <button type="button" class="botao-acao-paciente"
                        title="Visualizar ficha"
                        onclick="visualizarFichaPaciente('${escaparHTML(paciente.id)}')">
                        <span class="icone-visualizar">👁️</span>
                    </button>

                    <button type="button" class="botao-acao-paciente"
                        title="Editar"
                        onclick="editarPaciente('${escaparHTML(paciente.id)}')">
                        <span class="icone-editar"></span>
                    </button>

                    <button type="button" class="botao-acao-paciente"
                        title="Excluir"
                        onclick="excluirPaciente('${escaparHTML(paciente.id)}')">
                        <span class="icone-excluir"></span>
                    </button>

                </div>
            </td>
        `;

        tabela.appendChild(linha);

    });

}


/* =====================================================
   FICHA
===================================================== */

function visualizarFichaPaciente(id) {

    const paciente = buscarPacientePorId(id);

    if (!paciente) {
        alert("Paciente não encontrado.");
        return;
    }

    const modal = document.getElementById("modalFichaPaciente");

    if (!modal) {
        alert("Erro: o modal da ficha não existe no HTML.");
        return;
    }

    const vazio = "Nenhuma informação cadastrada.";

    const preencher = function (idCampo, valor) {
        const campo = document.getElementById(idCampo);
        if (campo) campo.value = valor;
    };

    preencher("fichaNome", paciente.nome || "—");
    preencher("fichaTelefone", paciente.telefone || "—");
    preencher("fichaCpf", paciente.cpf || "—");
    preencher("fichaCodigo", paciente.codigo || "—");
    preencher("fichaNascimento", formatarData(paciente.nascimento));
    preencher("fichaConvenio", paciente.convenio || "—");
    preencher("fichaUltimaConsulta", formatarData(paciente.ultimaConsulta));
    preencher("fichaProcedimentos", paciente.procedimentos || vazio);
    preencher("fichaHistoricoClinico", paciente.historicoClinico || vazio);
    preencher("fichaAlergias", paciente.alergias || vazio);
    preencher("fichaMedicamentos", paciente.medicamentos || vazio);
    preencher("fichaSinaisVitais", paciente.sinaisVitais || vazio);

    CAMPOS_ACOMPANHAMENTO.forEach(function ([idCampo, chave]) {
        preencher(idCampo.replace(/^paciente/, "ficha"), paciente[chave] || vazio);
    });

    modal.classList.add("ativo");

}

function fecharFichaPaciente() {
    const modal = document.getElementById("modalFichaPaciente");
    if (modal) modal.classList.remove("ativo");
}


/* =====================================================
   MODAL NOVO / EDITAR
   Na edição o formulário agora mostra TAMBÉM os dados
   do cadastro (nome, telefone, CPF...) + os campos
   clínicos, para que as alterações apareçam no
   histórico e na linha do tempo.
===================================================== */

function abrirModalPaciente(id = null) {

    const modal = document.getElementById("modalPaciente");
    const form = document.getElementById("formPaciente");
    const titulo = document.getElementById("tituloModalPaciente");

    if (!modal || !form || !titulo) return;

    /* guarda o formulário original uma única vez */
    if (!form.dataset.formularioOriginal) {
        form.dataset.formularioOriginal = form.innerHTML;
    }

    /* sempre parte do formulário original */
    form.innerHTML = form.dataset.formularioOriginal;
    form.reset();

    pacienteEditando = null;

    if (id) {

        const paciente = buscarPacientePorId(id);
        if (!paciente) return;

        pacienteEditando = id;
        titulo.textContent = "Editar Paciente";

        /* campos clínicos (coluna da esquerda) + acompanhamento (coluna ao lado) */
        const montarCampos = lista => lista.map(function ([idCampo, , rotulo, linhas]) {
            return `
                <div class="campo-clinico">
                    <label for="${idCampo}">${rotulo}</label>
                    <textarea id="${idCampo}" rows="${linhas}"
                        placeholder="Informe ${rotulo.toLowerCase()}..."></textarea>
                </div>
            `;
        }).join("");

        const blocoClinico = `
            <div class="clinico-colunas">
                <div class="clinico-coluna">${montarCampos(CAMPOS_CLINICOS)}</div>
                <div class="clinico-coluna">${montarCampos(CAMPOS_ACOMPANHAMENTO)}</div>
            </div>
        `;

        const acoes = form.querySelector(".acoes-modal-paciente");

        if (acoes) {
            acoes.insertAdjacentHTML("beforebegin", blocoClinico);
        } else {
            form.insertAdjacentHTML("beforeend", blocoClinico + `
                <div class="acoes-modal-paciente">
                    <button type="button" class="botao-cancelar-paciente"
                        onclick="fecharModalPaciente()">Cancelar</button>
                    <button type="submit">Salvar</button>
                </div>
            `);
        }

        /* preenche cadastro + clínico com os dados atuais */
        [...CAMPOS_CADASTRO, ...CAMPOS_CLINICOS, ...CAMPOS_ACOMPANHAMENTO].forEach(function ([idCampo, chave]) {
            const campo = document.getElementById(idCampo);
            if (campo) campo.value = paciente[chave] || "";
        });

    } else {

        titulo.textContent = "Novo Paciente";

    }

    const cartao = modal.querySelector(".card-modal-paciente");

    if (cartao) {
        cartao.classList.toggle("modal-paciente-largo", !!id);
    }

    modal.classList.add("ativo");

    const primeiroCampo = form.querySelector("input, textarea, select");
    if (primeiroCampo) primeiroCampo.focus();

}

function fecharModalPaciente() {
    const modal = document.getElementById("modalPaciente");
    if (modal) modal.classList.remove("ativo");
    pacienteEditando = null;
}

function lerCampo(idCampo) {
    const campo = document.getElementById(idCampo);
    return campo ? String(campo.value || "").trim() : "";
}


/* =====================================================
   SALVAR PACIENTE (novo ou edição)
===================================================== */

function salvarPaciente(event) {

    event.preventDefault();

    const pacientes = obterPacientes();

    /* ---------------- EDITAR ---------------- */

    if (pacienteEditando) {

        const indice = pacientes.findIndex(
            p => String(p.id) === String(pacienteEditando)
        );

        if (indice === -1) return;

        const anterior = pacientes[indice];
        const atualizado = { ...anterior };

        [...CAMPOS_CADASTRO, ...CAMPOS_CLINICOS, ...CAMPOS_ACOMPANHAMENTO].forEach(function ([idCampo, chave]) {
            if (document.getElementById(idCampo)) {
                atualizado[chave] = lerCampo(idCampo);
            }
        });

        if (!atualizado.convenio) atualizado.convenio = "Particular";

        if (
            !atualizado.nome ||
            !atualizado.telefone ||
            !atualizado.cpf ||
            !atualizado.nascimento
        ) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        pacientes[indice] = atualizado;
        salvarPacientes(pacientes);

        registrarEvento(
            atualizado,
            "Paciente atualizado",
            descreverAlteracoes(anterior, atualizado),
            listarAlteracoes(anterior, atualizado)
        );

        fecharModalPaciente();
        renderizarPacientes(lerCampoPesquisa());
        return;

    }

    /* ---------------- NOVO ---------------- */

    const nome = lerCampo("pacienteNome");
    const telefone = lerCampo("pacienteTelefone");
    const cpf = lerCampo("pacienteCpf");
    const nascimento = lerCampo("pacienteNascimento");
    const convenio = lerCampo("pacienteConvenio") || "Particular";
    const ultimaConsulta = lerCampo("pacienteUltimaConsulta");

    if (!nome || !telefone || !cpf || !nascimento) {
        alert("Preencha os campos obrigatórios.");
        return;
    }

    const novoPaciente = {
        id: gerarID(),
        nome,
        telefone,
        cpf,
        nascimento,
        convenio,
        ultimaConsulta,
        codigo: gerarCodigo(pacientes),
        procedimentos: "",
        historicoClinico: "",
        alergias: "",
        medicamentos: "",
        sinaisVitais: "",
        evolucoes: "",
        avaliacoesEnfermagem: "",
        dietaNutricao: "",
        dispositivos: "",
        planosCuidado: "",
        intercorrencias: ""
    };

    pacientes.push(novoPaciente);
    salvarPacientes(pacientes);

    registrarEvento(
        novoPaciente,
        "Paciente cadastrado",
        "O paciente foi cadastrado no sistema."
    );

    fecharModalPaciente();
    renderizarPacientes();

}

function lerCampoPesquisa() {
    const campo = document.getElementById("pesquisaPaciente");
    return campo ? campo.value : "";
}

function editarPaciente(id) {
    abrirModalPaciente(id);
}


/* =====================================================
   EXCLUIR
   O histórico e a linha do tempo são mantidos: os
   eventos continuam aparecendo, marcados como excluído.
===================================================== */

function excluirPaciente(id) {

    const pacientes = obterPacientes();
    const paciente = buscarPacientePorId(id, pacientes);

    if (!paciente) return;

    if (!confirm(`Deseja excluir o paciente "${paciente.nome}"?`)) return;

    /* registra antes da exclusão (guarda a cópia dos dados) */
    registrarEvento(
        paciente,
        "Paciente excluído",
        "O paciente foi removido do cadastro."
    );

    salvarPacientes(
        pacientes.filter(p => String(p.id) !== String(id))
    );

    renderizarPacientes(lerCampoPesquisa());

}


/* =====================================================
   AUDITORIA (usa o cadastro atual)
===================================================== */

function formatarDataHora(iso) {

    const data = new Date(iso);

    return {
        dia: data.toLocaleDateString("pt-BR"),
        hora: data.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        })
    };

}

function renderizarAuditoria(filtro = "") {

    const lista = document.querySelector(".lista-historico");
    if (!lista) return;

    const termo = filtro.trim().toLowerCase();
    const pacientes = obterPacientes();

    const itens = obterAuditoria()
        .map(item => ({ item, dados: dadosPacienteDoEvento(item, pacientes) }))
        .filter(({ dados }) => correspondeBusca(dados, termo));

    lista.innerHTML = "";

    if (itens.length === 0) {
        lista.innerHTML = `
            <div class="historico-vazio">
                Nenhum registro de auditoria encontrado.
            </div>
        `;
        return;
    }

    itens.forEach(function ({ item, dados }) {

        const { dia, hora } = formatarDataHora(item.data);

        /* quem modificou */
        const usuario = item.usuario && item.usuario.nome
            ? escaparHTML(item.usuario.nome) +
              (item.usuario.papel ? " (" + escaparHTML(item.usuario.papel) + ")" : "")
            : "<em>não registrado</em>";

        /* o que modificou: antes e depois */
        const alteracoes = Array.isArray(item.alteracoes) ? item.alteracoes : [];

        const formatarValor = function (alteracao, valor) {

            if (!valor) {
                return '<em class="valor-vazio">vazio</em>';
            }

            const texto = (alteracao.chave === "nascimento" || alteracao.chave === "ultimaConsulta")
                ? formatarData(valor)
                : valor;

            return escaparHTML(texto);

        };

        const alteracoesHTML = alteracoes.length === 0 ? "" : `
            <div class="historico-alteracoes">
                <div class="historico-rotulo">O que foi alterado</div>
                ${alteracoes.map(a => `
                    <div class="alteracao">
                        <div class="alteracao-campo">${escaparHTML(a.campo)}</div>
                        <div class="alteracao-linha alteracao-antes">
                            <span>Antes</span>
                            <div>${formatarValor(a, a.antes)}</div>
                        </div>
                        <div class="alteracao-linha alteracao-depois">
                            <span>Depois</span>
                            <div>${formatarValor(a, a.depois)}</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        const div = document.createElement("div");
        div.className = "item-historico";

        div.innerHTML = `
            <div class="historico-data">${dia} - ${hora}</div>

            <div class="historico-acao">${escaparHTML(item.acao)}</div>

            <div class="historico-linha">
                <span class="historico-rotulo">Paciente</span>
                <span class="historico-nome">
                    ${escaparHTML(dados.nome)}
                    ${dados.excluido ? "<small>(paciente excluído)</small>" : ""}
                </span>
            </div>

            <div class="historico-linha">
                <span class="historico-rotulo">Modificado por</span>
                <span>${usuario}</span>
            </div>

            ${alteracoes.length === 0
                ? `<div class="historico-descricao">${escaparHTML(item.descricao)}</div>`
                : ""}

            ${alteracoesHTML}

            <div class="historico-dados">
                Código: ${escaparHTML(dados.codigo)}
                &nbsp;|&nbsp;
                CPF: ${escaparHTML(dados.cpf)}
            </div>
        `;

        lista.appendChild(div);

    });

}


/* =====================================================
   LINHA DO TEMPO (usa o cadastro atual)
===================================================== */

function renderizarLinhaDoTempo(filtro = "") {

    const lista = document.querySelector(".lista-linha-tempo");
    if (!lista) return;

    const termo = filtro.trim().toLowerCase();
    const pacientes = obterPacientes();
    const timeline = obterLinhaDoTempo();

    /* pacientes do cadastro */
    const grupos = pacientes.map(p => ({
        id: p.id,
        dados: {
            nome: p.nome,
            telefone: p.telefone,
            codigo: p.codigo,
            cpf: p.cpf,
            excluido: false
        }
    }));

    /* pacientes excluídos que ainda têm eventos */
    const idsConhecidos = new Set(pacientes.map(p => String(p.id)));

    timeline.forEach(function (evento) {

        const idEvento = String(evento.pacienteId);

        if (!idsConhecidos.has(idEvento)) {
            idsConhecidos.add(idEvento);
            grupos.push({
                id: evento.pacienteId,
                dados: dadosPacienteDoEvento(evento, pacientes)
            });
        }

    });

    const encontrados = grupos.filter(g => correspondeBusca(g.dados, termo));

    /* mantém o cabeçalho da tabela; recria só o conteúdo */
    lista.querySelectorAll(
        ".linha-paciente-tempo, .linha-tempo-vazia"
    ).forEach(el => el.remove());

    if (!lista.querySelector(".cabecalho-tabela-tempo")) {
        lista.insertAdjacentHTML("afterbegin", `
            <div class="cabecalho-tabela-tempo">
                <span>Nome</span>
                <span>Telefone</span>
                <span>Código</span>
                <span>CPF</span>
                <span>Linha do Tempo</span>
            </div>
        `);
    }

    if (encontrados.length === 0) {
        lista.insertAdjacentHTML("beforeend", `
            <div class="linha-tempo-vazia">
                ${termo ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}
            </div>
        `);
        return;
    }

    encontrados.forEach(function (grupo) {

        const eventos = timeline.filter(
            e => String(e.pacienteId) === String(grupo.id)
        );

        let eventosHTML = "";

        if (eventos.length === 0) {
            eventosHTML = `
                <div class="evento-timeline">Nenhum evento registrado.</div>
            `;
        }

        eventos.forEach(function (evento) {

            const { dia, hora } = formatarDataHora(evento.data);

            eventosHTML += `
                <div class="evento-timeline">
                    <div class="evento-data">${dia} - ${hora}</div>
                    <div class="evento-titulo">${escaparHTML(evento.tipo)}</div>
                    <div class="evento-descricao">${escaparHTML(evento.descricao)}</div>
                </div>
            `;

        });

        const d = grupo.dados;

        const linha = document.createElement("div");
        linha.className = "linha-paciente-tempo";

        linha.innerHTML = `
            <span data-label="Nome">
                ${escaparHTML(d.nome)}
                ${d.excluido ? "<small>(excluído)</small>" : ""}
            </span>
            <span data-label="Telefone">${escaparHTML(d.telefone)}</span>
            <span data-label="Código">${escaparHTML(d.codigo)}</span>
            <span data-label="CPF">${escaparHTML(d.cpf)}</span>
            <span data-label="Linha do tempo">${eventosHTML}</span>
        `;

        lista.appendChild(linha);

    });

}


/* =====================================================
   UTILITÁRIOS
===================================================== */

function gerarID() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function gerarCodigo(pacientes) {

    let maior = 0;

    pacientes.forEach(function (paciente) {

        const numero = parseInt(
            String(paciente.codigo || "").replace(/\D/g, ""),
            10
        );

        if (!isNaN(numero) && numero > maior) maior = numero;

    });

    return String(maior + 1).padStart(6, "0");

}

function formatarData(data) {

    if (!data) return "—";

    const partes = String(data).split("-");

    if (partes.length !== 3) return data;

    return partes[2] + "/" + partes[1] + "/" + partes[0];

}

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   ATUALIZA AS TELAS QUANDO OUTRA ABA DO NAVEGADOR
   ALTERA OS DADOS
===================================================== */

function atualizarTelas() {

    renderizarPacientes(lerCampoPesquisa());

    const pesqAud = document.querySelector(".barra-pesquisa-historico input");
    renderizarAuditoria(pesqAud ? pesqAud.value : "");

    const pesqTempo = document.querySelector(".barra-pesquisa-linha-tempo input");
    renderizarLinhaDoTempo(pesqTempo ? pesqTempo.value : "");

    if (typeof renderizarDocumentos === "function") {
        renderizarDocumentos();
    }

    if (typeof atualizarContadores === "function") {
        atualizarContadores();
    }

}

window.addEventListener("storage", function (event) {

    if (
        event.key === CHAVE_PACIENTES ||
        event.key === CHAVE_AUDITORIA ||
        event.key === CHAVE_TIMELINE
    ) {
        atualizarTelas();
    }

});


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* ---------- PÁGINA DE PACIENTES ---------- */

    if (document.body.classList.contains("pagina-pacientes")) {

        if (typeof verificarLogin === "function" && !verificarLogin()) {
            return;
        }

        if (typeof carregarUsuario === "function") {
            carregarUsuario();
        }

        const pesquisa = document.getElementById("pesquisaPaciente");
        const formulario = document.getElementById("formPaciente");
        const modal = document.getElementById("modalPaciente");
        const modalFicha = document.getElementById("modalFichaPaciente");

        if (pesquisa) {
            pesquisa.addEventListener("input", function () {
                renderizarPacientes(this.value);
            });
        }

        if (formulario) {
            formulario.addEventListener("submit", salvarPaciente);
        }

        if (modal) {
            modal.addEventListener("click", function (event) {
                if (event.target === modal) fecharModalPaciente();
            });
        }

        if (modalFicha) {
            modalFicha.addEventListener("click", function (event) {
                if (event.target === modalFicha) fecharFichaPaciente();
            });
        }

        renderizarPacientes();

    }

    /* ---------- PÁGINA AUDITORIA ---------- */

    if (document.querySelector(".lista-historico")) {

        renderizarAuditoria();

        const pesquisaHistorico = document.querySelector(
            ".barra-pesquisa-historico input"
        );

        if (pesquisaHistorico) {
            pesquisaHistorico.addEventListener("input", function () {
                renderizarAuditoria(this.value);
            });
        }

    }

    /* ---------- PÁGINA LINHA DO TEMPO ---------- */

    if (document.querySelector(".lista-linha-tempo")) {

        renderizarLinhaDoTempo();

        const pesquisaTimeline = document.querySelector(
            ".barra-pesquisa-linha-tempo input"
        );

        if (pesquisaTimeline) {
            pesquisaTimeline.addEventListener("input", function () {
                renderizarLinhaDoTempo(this.value);
            });
        }

    }

});