// ==UserScript==
// @name         AUDESP - Baixar balancetes
// @namespace    tcesp.audesp.balancetes
// @version      2.1.0
// @description  Extrai balancetes do AUDESP em lote: vários municípios, entidades, exercícios, meses e tipos de consulta, em um único ZIP.
// @match        https://audesp.tce.sp.gov.br/audesp/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const form = document.forms.consultarCodigosContabeisForm;
  if (!form || !form.municipio) return; // só atua na tela Consultar Balancetes

  /* ---------- Dados fixos e leitura da tela ---------- */

  const UR02 = [1, 6, 8, 35, 40, 42, 50, 52, 54, 59, 60, 68, 83, 85, 86, 91, 95, 130, 158, 162, 174, 221, 223, 231,
    254, 265, 289, 305, 313, 318, 324, 338, 384, 414, 416, 438, 443, 463, 464, 479, 563, 613, 624].map(String);

  // Entidades da UR-02, na mesma ordem de UR02. O script confere esta lista em segundo plano.
  const CATALOGO_TXT = `
CÂMARA MUNICIPAL DE ADAMANTINA
CENTRO UNIVERSITÁRIO DE ADAMANTINA
CONSORCIO INTERM.MULTIFINALITARIO DOS MUNICIPIOS DA AMNAP
PREFEITURA MUNICIPAL DE ADAMANTINA

CÂMARA MUNICIPAL DE ÁGUAS DE SANTA BÁRBARA
PREFEITURA MUNICIPAL DE ÁGUAS DE SANTA BÁRBARA

CÂMARA MUNICIPAL DE AGUDOS
PREFEITURA MUNICIPAL DE AGUDOS

CÂMARA MUNICIPAL DE ARANDU
CAPSMAR-CAIXA DE APOSENTADORIA E PREVIDENCIA DOS
PREFEITURA MUNICIPAL DE ARANDU

CÂMARA MUNICIPAL DE AREALVA
PREFEITURA MUNICIPAL DE AREALVA

CÂMARA MUNICIPAL DE AREIÓPOLIS
PREFEITURA MUNICIPAL DE AREIÓPOLIS

CÂMARA MUNICIPAL DE AVAÍ
PREFEITURA MUNICIPAL DE AVAI

CÂMARA MUNICIPAL DE AVARÉ
FUNDAÇÃO REGIONAL EDUCACIONAL DE AVARE
INSTITUTO DE PREV.DOS SERV.PUBL.MUNIC.DE AVARÉ
PREFEITURA MUNICIPAL DE AVARÉ
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA DR PAULO LUCIANO DE CAMPOS AVARE
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA NELSON MARCONDES DO AMARAL - AVARE
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DEFESA AGROPECUARIA DE AVARE
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DESENVOLVIMENTO RURAL DE AVARE
SECRETARIA DA EDUCACAO / UNIDADE REGIONAL DE ENSINO DE AVARE
SECRETARIA DA SEGURANCA PUBLICA / DELEGACIA SECCIONAL DE POLICIA DE AVARE
SECRETARIA DE DESENVOLVIMENTO SOCIAL / DIVISAO REG. ASSIST. DESENV. SOCIAL AVARE

CÂMARA MUNICIPAL DE BALBINOS
PREFEITURA MUNICIPAL DE BALBINOS
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / COMPLEXO PENAL DE BALBINOS
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA II DE BALBINOS

CÂMARA MUNICIPAL DE BARIRI
PREFEITURA MUNICIPAL DE BARIRI
SAEMBA-SERVIÇO DE ÁGUA E ESGOTO O MUNICIPIO DE BARIRI

CÂMARA MUNICIPAL DE BARRA BONITA
PREFEITURA MUNICIPAL DE BARRA BONITA
SERVIÇO AUTONOMO DE AGUA E ESGOTO

CÂMARA MUNICIPAL DE BAURU
COMPANHIA HABITACIONAL DE BAURU
DEPARTAMENTO DE ÁGUA E ESGOTO (DAE)
DEPARTAMENTO DE ESTRADAS DE RODAGEM-CAPITAL / DER (DR-03) DIVISAO REGIONAL DE BAURU
EMPRESA MUN. DESENV. URBANO E RURAL (EMDURB)
FUND. PREV. SERV. PÚBL. MUN. EFET. DE BAURU (FUNPREV)
FUNDACAO BAURUENSE DE ESTUDOS ODONTOLOGICOS
FUNDACAO DE PESQUISA E ENSINO EM CIENCIAS DA SAUDE DE BAURU
FUNDACAO ESTATAL REGIONAL DE SAUDE - REGIAO DE BAURU
FUNDACAO PARA O DESENVOLVIMENTO DE BAURU
PREFEITURA MUNICIPAL DE BAURU
PROCURADORIA GERAL DO ESTADO / PROCURADORIA REGIONAL DE BAURU
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / CENTRO DE DETENCAO PROVISORIA ASP FRANCISCO CARLOS CANESCHI
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / CENTRO DE PROGRESSAO PENITENCIARIA"DR.EDUARDO DE OLIV.VIANNA
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / CENTRO DE PROGRESSAO PENITENCIARIA"PROF.NOE DE AZEVEDO"BAURU
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / COMPLEXO PENAL DE BAURU
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / FED-CENTRO PROGR.PENIT.PROF.NOE DE AZEVEDO
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DEFESA AGROPECUARIA DE BAURU
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DESENVOLVIMENTO RURAL DE BAURU
SECRETARIA DA EDUCACAO / UNIDADE REGIONAL DE ENSINO DE BAURU
SECRETARIA DA FAZENDA E PLANEJAMENTO / DELEGACIA REGIONAL TRIBUTARIA DE BAURU
SECRETARIA DA FAZENDA E PLANEJAMENTO / DELEGACIA TRIBUTARIA DE JULGAMENTO 3 - BAURU
SECRETARIA DA FAZENDA E PLANEJAMENTO / DEPARTAMENTO DE ADMINISTRACAO DA REGIAO IV - DAR IV
SECRETARIA DA FAZENDA E PLANEJAMENTO / REPRESENTACAO FISCAL DE BAURU
SECRETARIA DA SAUDE / DEPARTAMENTO REGIONAL DE SAÚDE DE BAURU
SECRETARIA DA SAUDE / HOSPITAL MANOEL DE ABREU EM BAURU
SECRETARIA DA SAUDE / INSTITUTO LAURO DE SOUZA LIMA EM BAURU
SECRETARIA DA SEGURANCA PUBLICA / 12 GRUPAMENTO DE BOMBEIROS - BAURU
SECRETARIA DA SEGURANCA PUBLICA / 2º BATALHAO DE POL.RODOVIARIA"TENENTE CEL.PM LEVY LENOTTI"
SECRETARIA DA SEGURANCA PUBLICA / COMANDO DE BOMBEIROS DO INTERIOR-II
SECRETARIA DA SEGURANCA PUBLICA / COMANDO DE POLICIAMENTO DO INTERIOR 4 - BAURU
SECRETARIA DA SEGURANCA PUBLICA / DELEGACIA SECCIONAL DE POLICIA DE BAURU
SECRETARIA DA SEGURANCA PUBLICA / DEPART. DE POLICIA JUDICIARIA S.P. INTERIOR - BAURU
SECRETARIA DE DESENVOLVIMENTO SOCIAL / DIVISAO REG. ASSIST. DESENV. SOCIAL BAURU
UNIVERSIDADE DE SAO PAULO / USP DA FACULDADE DE ODONTOLOGIA DE BAURU
UNIVERSIDADE DE SAO PAULO / USP DO HOSPITAL REAB.ANOMALIAS CRANIO-FACIAIS BAURU
UNIVERSIDADE DE SAO PAULO / USP PREFEITURA DO CAMPUS USP DE BAURU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / ADMINISTRACAO GERAL -UNESP-CAMPUS DE BAURU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FAC.DE ARQUIT.ARTES E COMUNICACAO-UNESP-CAMPUS DE BAURU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FACULDADE DE CIENCIAS-UNESP CAMPUS DE BAURU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FACULDADE DE ENGENHARIA-UNESP CAMPUS DE BAURU

CÂMARA MUNICIPAL DE BORACÉIA
PREFEITURA MUNICIPAL DE BORACÉIA

CÂMARA MUNICIPAL DE BOREBI
PREFEITURA MUNICIPAL DE BOREBI

CÂMARA MUNICIPAL DE BOTUCATU
FUNDACAO DE APOIO AOS HOSP VETERINARIOS DA UNESP
FUNDACAO DESENVOLVIMENTO MEDICO HOSPITALAR BOTUCATU
FUNDACAO EST. PESQUISAS AGRICOLAS FLORESTAIS
FUNDACAO UNI
INSTITUTO DE PREVIDENCIA SOCIAL DOS SERVIDORES DE BOTUCATU
POLO REGIONAL DE DESENVOLVIMENTO TURISTICO - POLO CUESTA
PREFEITURA MUNICIPAL DE BOTUCATU
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DEFESA AGROPECUARIA DE BOTUCATU
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DESENVOLVIMENTO RURAL DE BOTUCATU
SECRETARIA DA EDUCACAO / UNIDADE REGIONAL DE ENSINO DE BOTUCATU
SECRETARIA DA SAUDE / CENTRO ATENCAO INTEGRAL SAUDE"PROF.CANTIDIO DE MOURA CAMPOS
SECRETARIA DA SAUDE / HOSPITAL DAS CLINICAS DA FACULDADE DE MEDICINA DE BOTUCATU
SECRETARIA DA SEGURANCA PUBLICA / DELEGACIA SECCIONAL DE POLICIA DE BOTUCATU
SECRETARIA DE DESENVOLVIMENTO ECONOMICO / FUNDACAO DO INSTITUTO DE BIOCIENCIAS DE BOTUCATU
SECRETARIA DE DESENVOLVIMENTO SOCIAL / DIVISAO REG. ASSIST. DESENV. SOCIAL BOTUCATU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / ADMINISTRACAO GERAL -UNESP-CAMPUS DE BOTUCATU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FAC.DE CIENCIAS AGRONOMICAS-UNESP-CAMPUS DE BOTUCATU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FAC.DE MED.VETERINARIA E ZOOTECNIA-UNESP-CAMPUS DE BOTUCATU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / FACULDADE DE MEDICINA- UNESP-CAMPUS DE BOTUCATU
UNIVERSIDADE ESTADUAL PAULISTA"JULIO DE MESQUITA FILHO" / INSTITUTO DE BIOCIENCIAS-UNESP-CAMPUS DE BOTUCATU

CÂMARA MUNICIPAL DE BROTAS
EMPRESA MUNICIPAL DE DESENVOLVIMENTO DE BROTAS
PREFEITURA MUNICIPAL DE BROTAS
SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTO DE BROTAS

CÂMARA MUNICIPAL DE CABRALIA PAULISTA
PREFEITURA MUNICIPAL DE CABRALIA PAULISTA

CÂMARA MUNICIPAL DE CERQUEIRA CÉSAR
PREFEITURA MUNICIPAL DE CERQUEIRA CÉSAR
REGIME PRÓPRIO DE PREVIDÊNCIA SOCIAL
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / CENTRO DE DETENCAO PROVISORIA DE CERQUEIRA CESAR
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / COMPLEXO PENAL DE CERQUEIRA CESAR

CÂMARA MUNICIPAL DE DOIS CÓRREGOS
FUNDO DE PREVIDENCIA SOCIAL DO MUNICIPIO DE DOIS CORREGOS
PREFEITURA MUNICIPAL DE DOIS CÓRREGOS
SAAEDOCO-SERV.AUTONOMO AGUA E ESGOTO

CÂMARA MUNICIPAL DE DUARTINA
PREFEITURA MUNICIPAL DE DUARTINA

CÂMARA MUNICIPAL DE ESPÍRITO SANTO DO TURVO
PREFEITURA MUNICIPAL DE ESPÍRITO SANTO DO TURVO

CÂMARA MUNICIPAL DE IACANGA
PREFEITURA MUNICIPAL DE IACANGA

CÂMARA MUNICIPAL DE IARAS
FUNDACAO CENTRO DE ATEND.SOCIO-EDUCATIVO AO ADOLESCENTE / FUNDACAO C.A.S.A.-DIVISAO REGIONAL SUDOESTE-DRS IARAS
PREFEITURA MUNICIPAL DE IARAS
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA ORLANDO BRANDO FILINTO - IARAS

CÂMARA MUNICIPAL DE IGARAÇU DO TIETÊ
FUNDO MUNICIPAL DE PREVIDÊNCIA SOCIAL
PREFEITURA MUNICIPAL DE IGARAÇU DO TIETÊ
SERVIÇO AUTONOMO DE AGUA E ESGOTO

CÂMARA MUNICIPAL DE ITAJU
PREFEITURA MUNICIPAL DE ITAJU

CÂMARA MUNICIPAL DE ITAPUÍ
PREFEITURA MUNICIPAL DE ITAPUÍ

CÂMARA MUNICIPAL DE JAÚ
CONSORCIO INTERMUNICIPAL VALE TIETE PARANA - CITP - JAU
FUNDACAO EDUCACIONAL DR.RAUL BAUAB - JAHU
PREFEITURA MUNICIPAL DE JAÚ
SAEMJA-AGENCIA REG.DO SERV.DE AGUA,ESG.E SANEAM.DO MUN.JAHU
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DEFESA AGROPECUARIA DE JAU
SECRETARIA DA AGRICULTURA E ABASTECIMENTO / ESCRITORIO DE DESENVOLVIMENTO RURAL DE JAU
SECRETARIA DA EDUCACAO / UNIDADE REGIONAL DE ENSINO DE JAU
SECRETARIA DA SEGURANCA PUBLICA / DELEGACIA SECCIONAL DE POLICIA DE JAU
SERVICO DE AGUA E ESGOTO DO MUNICIPIO DE JAU

CÂMARA MUNICIPAL DE LENÇÓIS PAULISTA
CENTRO MUNICIPAL DE FORMAÇÃO PROFISSIONAL-CMFP
INSTITUTO PREVIDÊNCIA MUNICIPAL DE LENÇÓIS PTA.-IPREM
PREFEITURA MUNICIPAL DE LENÇÓIS PAULISTA
SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTOS-SAAE

CÂMARA MUNICIPAL DE LUCIANÓPOLIS
PREFEITURA MUNICIPAL DE LUCIANÓPOLIS

CÂMARA MUNICIPAL DE MACATUBA
INSTITUTO DE PREVIDENCIA MUNICIPAL DE MACATUBA
PREFEITURA MUNICIPAL DE MACATUBA

CÂMARA MUNICIPAL DE MANDURI
PREFEITURA MUNICIPAL DE MANDURI
SAEMAN

CÂMARA MUNICIPAL DE MINEIROS DO TIETÊ
PREFEITURA MUNICIPAL DE MINEIROS DO TIETÊ

CÂMARA MUNICIPAL DE ÓLEO
PREFEITURA MUNICIPAL DE ÓLEO

CÂMARA MUNICIPAL DE PAULISTÂNIA
PREFEITURA MUNICIPAL DE PAULISTÂNIA

CÂMARA MUNICIPAL DE PEDERNEIRAS
PREFEITURA MUNICIPAL DE PEDERNEIRAS

CÂMARA MUNICIPAL DE PIRAJUÍ
FUNDAÇÃO EDUCACIONAL 29 DE MARÇO DE PIRAJUÍ
PREFEITURA MUNICIPAL DE PIRAJUÍ
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / COMPLEXO PENAL DE PIRAJUI
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / DIVISAO DE ADM.DA COORD.DE EXEC.PENAL DA REG.NOROESTE ESTADO
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / FED- PENITENCIARIA DR.WALTER FARIA PEREIRA DE QUEIROZ
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA FEMININA"SANDRA AP.LARIO VIANNA DE PIRAJUI
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA LUIZ GONZAGA VIEIRA - PIRAJUI
SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTO - SAAE

CÂMARA MUNICIPAL DE PIRATININGA
INSTITUTO DE PREVIDÊNCIA DO MUNICÍPIO DE PIRATININGA
PREFEITURA MUNICIPAL DE PIRATININGA

CÂMARA MUNICIPAL DE PRATÂNIA
PREFEITURA MUNICIPAL DE PRATÂNIA

CÂMARA MUNICIPAL DE PRESIDENTE ALVES
PREFEITURA MUNICIPAL DE PRESIDENTE ALVES

CÂMARA MUNICIPAL DE REGINOPOLIS
PREFEITURA MUNICIPAL DE REGINOPOLIS
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / COMPLEXO PENAL DE REGINOPOLIS
SECRETARIA DA ADMINISTRACAO PENITENCIARIA / PENITENCIARIA"SARGENTO PM ANTONIO LUIZ SOUZA"DE REGINOPOLIS

CÂMARA MUNICIPAL DE SÃO MANUEL
INSTITUTO DE PREVIDÊNCIA MUNICIPAL
INSTITUTO MUNICIPAL DE ENSINO SUPERIOR
PREFEITURA MUNICIPAL DE SÃO MANUEL

CÂMARA MUNICIPAL DE TORRINHA
PREFEITURA MUNICIPAL DE TORRINHA

CÂMARA MUNICIPAL DE UBIRAJARA
PREFEITURA MUNICIPAL DE UBIRAJARA
`;
  const CATALOGO = {};
  CATALOGO_TXT.trim().split('\n\n').forEach((g, i) => { CATALOGO[UR02[i]] = g.split('\n'); });
  const ANO_CATALOGO = 2025; // anos anteriores podem ter entidades que não constam da lista

  const opts = (sel) => [...sel.options].filter((o) => o.value !== '').map((o) => ({ v: o.value, t: o.text.trim() }));
  const MUNS = opts(form.municipio);
  const MUN_NOME = Object.fromEntries(MUNS.map((m) => [m.v, m.t]));
  const ANOS = opts(form.anoExercicio);
  const MESES = opts(form.mesFinal);
  const NIV_MIN = opts(form.nivelMinimo);
  const NIV_MAX = opts(form.nivelMaximo);
  const CONSULTAS = opts(form.tipoConsulta);
  const TIPOS = [{ v: '1', t: 'Isolado' }, { v: '3', t: 'Consolidado' }];
  const BASE = new URL('./', location.href).href;
  const ENT_VALIDADE = 24 * 3600 * 1000; // conferência em segundo plano, no máximo uma vez por dia

  /* ---------- Estado persistido ---------- */

  const S = Object.assign({
    mun: [], anos: [], tipos: ['1'], meses: [], consultas: ['A'], ent: [],
    min: '1', max: NIV_MAX[NIV_MAX.length - 1].v, filtro: 'ur02', delay: 800, consTodas: false,
  }, GM_getValue('estado', {}));
  // Descarta seleções salvas que não existem no acesso atual
  S.mun = S.mun.filter((v) => MUN_NOME[v]);
  S.anos = S.anos.filter((v) => ANOS.some((a) => a.v === v));
  let cats = GM_getValue('categorias', null) || [{ id: 'ur02', name: 'UR-02', mun: UR02 }];
  let entCache = GM_getValue('entidades', {});
  let entNovas = GM_getValue('entNovas', []);
  const limpaNome = (n) => n.replace(/\s+/g, ' ').trim();
  const entKey = (m, n) => m + '|' + limpaNome(n);
  // Seleção agora é por município + nome; converte os códigos salvos pela versão anterior
  S.ent = S.ent.flatMap((v) => {
    if (v.includes('|')) return [v];
    for (const k of Object.keys(entCache)) {
      const e = entCache[k].list.find((x) => x.id === v);
      if (e) return [entKey(k.split('|')[0], e.nome)];
    }
    return [];
  });
  let catAtual = cats[0] ? cats[0].id : null;
  const saveS = () => GM_setValue('estado', S);
  const saveCats = () => GM_setValue('categorias', cats);
  const saveEnt = () => GM_setValue('entidades', entCache);

  /* ---------- Rede ---------- */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let run = null; // { stop: bool, ctrl: AbortController }

  async function post(path, params) {
    const esperas = [2000, 5000, 10000];
    for (let i = 0; ; i++) {
      if (run && run.stop) throw new DOMException('Parado', 'AbortError');
      try {
        const r = await fetch(BASE + path, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(params).toString(),
          signal: run ? run.ctrl.signal : undefined,
        });
        if (r.ok) return new Uint8Array(await r.arrayBuffer());
        if (i >= esperas.length) throw new Error('O servidor respondeu ' + r.status);
      } catch (e) {
        if (e.name === 'AbortError' || i >= esperas.length) throw e;
      }
      await sleep(esperas[i]);
    }
  }

  const toDoc = (bytes) => new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(bytes), 'text/html');
  class SessaoError extends Error {}

  async function lerEntidades(mun, ano, enviar) {
    const doc = toDoc(await enviar('iniciarTelaConsultaCodigosContabeis.do', { municipio: mun, anoExercicio: ano }));
    const sel = doc.querySelector('#entidades');
    if (!sel) throw new SessaoError('Sessão expirada. Entre novamente no AUDESP.');
    return opts(sel).map((o) => ({ id: o.v, nome: o.t }));
  }

  // Guarda a lista do servidor e registra o que não era conhecido
  function aplicarLista(mun, ano, list) {
    const k = mun + '|' + ano;
    const cat = CATALOGO[mun] || [];
    const antes = entCache[k] ? entCache[k].list.map((e) => limpaNome(e.nome)) : cat.map(limpaNome);
    const conhecidas = new Set(cat.map(limpaNome));
    let temBase = cat.length > 0;
    for (const c of Object.keys(entCache)) {
      if (c.split('|')[0] !== mun) continue;
      temBase = true;
      entCache[c].list.forEach((e) => conhecidas.add(limpaNome(e.nome)));
    }
    const agora = list.map((e) => limpaNome(e.nome));
    const mudou = agora.length !== antes.length || agora.some((n) => !antes.includes(n));
    entCache[k] = { t: Date.now(), list };
    if (temBase && Number(ano) >= ANO_CATALOGO) {
      const novas = agora.filter((n) => !conhecidas.has(n) && !entNovas.includes(entKey(mun, n)));
      if (novas.length) {
        entNovas = [...entNovas, ...novas.map((n) => entKey(mun, n))];
        GM_setValue('entNovas', entNovas);
      }
    }
    return mudou;
  }

  async function loadEntidades(mun, ano) {
    aplicarLista(mun, ano, await lerEntidades(mun, ano, post));
  }

  // Sem catálogo, a lista precisa vir do servidor para aparecer. Com catálogo, os códigos
  // das entidades só são indispensáveis na hora de baixar.
  const faltantes = (paraBaixar) => {
    const out = [];
    for (const m of S.mun) for (const a of S.anos) {
      if (entCache[m + '|' + a]) continue;
      if (!CATALOGO[m] || (paraBaixar && S.ent.some((k) => k.startsWith(m + '|')))) out.push([m, a]);
    }
    return out;
  };

  let carregando = null; // promessa da carga em andamento
  function ensureEntidades(paraBaixar) {
    if (carregando) return carregando;
    if (!faltantes(paraBaixar).length) return Promise.resolve(true);
    carregando = (async () => {
      await null;
      $('#entErro').textContent = '';
      renderEnt();
      try {
        // Reavalia a cada volta: a seleção pode mudar enquanto carrega
        for (let f = faltantes(paraBaixar); f.length; f = faltantes(paraBaixar)) {
          $('#entStatus').textContent = `Carregando entidades… faltam ${f.length} (${MUN_NOME[f[0][0]]}, ${f[0][1]})`;
          await loadEntidades(f[0][0], f[0][1]);
          renderEnt();
          await sleep(200);
        }
        saveEnt();
        return true;
      } catch (e) {
        saveEnt();
        $('#entErro').textContent = e.message || 'Falha ao carregar entidades.';
        return false;
      } finally {
        carregando = null;
        $('#entStatus').textContent = '';
        renderEnt();
        renderResumo();
      }
    })();
    return carregando;
  }

  let autoTimer = null;
  function agendarEntidades() {
    clearTimeout(autoTimer);
    if (S.tipos.length) autoTimer = setTimeout(() => ensureEntidades(), 500);
  }

  /* ---------- Conferência das entidades em segundo plano ---------- */

  let bgAndando = false;
  let bgEmCurso = null;
  let bgTexto = '';
  async function postSimples(path, params) {
    const r = await fetch(BASE + path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    if (!r.ok) throw new Error('O servidor respondeu ' + r.status);
    return new Uint8Array(await r.arrayBuffer());
  }
  function proximaConferencia() {
    const validos = (k) => entCache[k] && Date.now() - entCache[k].t < ENT_VALIDADE;
    const muns = [...S.mun, ...UR02.filter((m) => MUN_NOME[m] && !S.mun.includes(m))];
    const anos = [...S.anos, ...ANOS.map((a) => a.v).filter((a) => !S.anos.includes(a))];
    let restantes = 0;
    let prox = null;
    for (const m of muns) for (const a of anos) {
      if (validos(m + '|' + a)) continue;
      restantes++;
      if (!prox) prox = [m, a];
    }
    return { prox, restantes };
  }
  function statusBg(texto) {
    bgTexto = texto;
    $('#entBg').textContent = texto;
    $('#cacheInfo').textContent = texto;
  }
  // Só roda com o painel aberto e nunca durante um download: o servidor guarda um arquivo
  // por sessão, e estas consultas usam a mesma sessão.
  async function conferirEntidades() {
    if (bgAndando) return;
    bgAndando = true;
    try {
      for (;;) {
        while (run || carregando) await sleep(500);
        if ($('#panel').hidden) { statusBg(''); return; }
        const { prox, restantes } = proximaConferencia();
        if (!prox) break;
        statusBg(`Conferindo entidades em segundo plano: faltam ${restantes}.`);
        bgEmCurso = lerEntidades(prox[0], prox[1], postSimples);
        const list = await bgEmCurso;
        bgEmCurso = null;
        const mudou = aplicarLista(prox[0], prox[1], list);
        if (restantes % 10 === 0) saveEnt();
        if (mudou && S.mun.includes(prox[0]) && S.anos.includes(prox[1])) { renderEnt(); renderResumo(); }
        renderNovas();
        await sleep(150);
      }
      saveEnt();
      GM_setValue('entConferidas', Date.now());
      statusBg('');
      renderCfg();
    } catch (e) {
      bgEmCurso = null;
      saveEnt();
      statusBg('Não foi possível conferir as entidades agora. O script tenta de novo ao abrir o painel.');
    } finally {
      bgAndando = false;
    }
  }

  /* ---------- Entidades ---------- */

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const isCamara = (n) => /^CAMARA\b/.test(norm(n));
  const isPrefeitura = (n) => /^PREFEITURA\b/.test(norm(n));

  // Índice das entidades conhecidas para os municípios e exercícios marcados
  function entIndex() {
    const idx = new Map();
    for (const m of S.mun) for (const a of S.anos) {
      const c = entCache[m + '|' + a];
      const list = c ? c.list : (CATALOGO[m] || []).map((nome) => ({ nome }));
      for (const e of list) {
        const key = entKey(m, e.nome);
        if (!idx.has(key)) idx.set(key, { key, nome: e.nome, mun: m, anos: [] });
        idx.get(key).anos.push(a);
      }
    }
    return idx;
  }

  /* ---------- Plano de extração ---------- */

  function montarJobs() {
    const jobs = [];
    const sel = new Set(S.ent);
    for (const m of S.mun) for (const a of S.anos) for (const mes of S.meses) for (const q of S.consultas) {
      const c = entCache[m + '|' + a];
      const list = c ? c.list : (CATALOGO[m] || []).map((nome) => ({ id: null, nome }));
      for (const tipo of S.tipos) {
        if (tipo === '3' && S.consTodas) jobs.push({ m, a, mes, q, tipo, ent: '', entNome: 'TODAS AS ENTIDADES' });
        for (const e of list) if (sel.has(entKey(m, e.nome))) jobs.push({ m, a, mes, q, tipo, ent: e.id, entNome: e.nome });
      }
    }
    return jobs;
  }

  const limpa = (s) => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
  const rot = (lista, v) => (lista.find((x) => x.v === v) || { t: v }).t;

  /* ---------- ZIP sem compressão (xlsx já é comprimido) ---------- */

  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u) {
    let c = 0xffffffff;
    for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [];
    const central = [];
    let off = 0;
    for (const f of files) {
      const name = new TextEncoder().encode(f.path);
      const crc = crc32(f.data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, name.length, true);
      parts.push(h.buffer, name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
      c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, name.length, true);
      c.setUint32(42, off, true);
      central.push(c.buffer, name);
      off += 30 + name.length + f.data.length;
    }
    const cSize = central.reduce((s, p) => s + p.byteLength, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cSize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, e.buffer], { type: 'application/zip' });
  }

  // A planilha do AUDESP tem 11 linhas de cabeçalho; sem nada além disso, a consulta veio vazia.
  const LINHAS_CABECALHO = 11;
  async function planilhaVazia(u) {
    try {
      const v = new DataView(u.buffer, u.byteOffset, u.length);
      let e = u.length - 22;
      while (v.getUint32(e, true) !== 0x06054b50) e--;
      let c = v.getUint32(e + 16, true);
      for (let i = v.getUint16(e + 10, true); i > 0; i--) {
        const nl = v.getUint16(c + 28, true);
        const nome = new TextDecoder().decode(u.subarray(c + 46, c + 46 + nl));
        if (/worksheets\/sheet1\.xml$/.test(nome)) {
          const off = v.getUint32(c + 42, true);
          const ini = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true);
          const raw = u.subarray(ini, ini + v.getUint32(c + 20, true));
          const xml = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
          return (xml.match(/<row[ >]/g) || []).length <= LINHAS_CABECALHO;
        }
        c += 46 + nl + v.getUint16(c + 30, true) + v.getUint16(c + 32, true);
      }
    } catch (e) { /* formato inesperado: mantém o arquivo */ }
    return false;
  }

  /* ---------- Execução ---------- */

  let ultimoZip = null;
  function baixar() {
    if (!ultimoZip) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(ultimoZip.blob);
    a.download = ultimoZip.nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }

  async function extrair() {
    $('#erroRun').textContent = '';
    if (!(await ensureEntidades()) || !(await ensureEntidades(true))) return;
    const jobs = montarJobs().filter((j) => j.ent !== null);
    if (!jobs.length) return;

    run = { stop: false, ctrl: new AbortController() };
    if (bgEmCurso) await bgEmCurso.catch(() => {});
    ultimoZip = null;
    setRodando(true);
    $('#log').innerHTML = '';
    const files = [];
    const usados = new Set();
    const rel = [['Município', 'Exercício', 'Tipo', 'Entidade', 'Mês', 'Consulta', 'Nível mín.', 'Nível máx.', 'Situação', 'Mensagem', 'Arquivo']];
    let falhas = 0;
    let vazios = 0;
    let fim = 'Concluído';

    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      const desc = `${MUN_NOME[j.m]} · ${j.a} · ${rot(TIPOS, j.tipo)} · ${j.entNome} · ${rot(MESES, j.mes)} · ${rot(CONSULTAS, j.q)}`;
      $('#pBar').style.width = (i / jobs.length) * 100 + '%';
      $('#pText').textContent = `${i} de ${jobs.length}${falhas ? ` · ${falhas} sem arquivo` : ''}${vazios ? ` · ${vazios} sem contas` : ''}`;
      $('#pAtual').textContent = desc;

      const params = {
        qtdLinhasPlanilha: '0', listCods: '', municipio: j.m, entidade: j.ent, anoExercicio: j.a, formaEnvio: j.tipo,
        mesFinal: j.mes, nivelMinimo: S.min, nivelMaximo: S.max, tipoConsulta: j.q, codigo: '',
      };
      let situacao = 'OK';
      let msg = '';
      let aviso = '';
      let arquivo = '';
      try {
        // 1ª etapa: o servidor valida e prepara; 2ª etapa: devolve o arquivo
        const doc = toDoc(await post('gerarXLS_PesquisarCodigosContabeis.do', params));
        const el = doc.querySelector('.mensagens_error');
        if (!el) throw new SessaoError('Sessão expirada. Entre novamente no AUDESP.');
        msg = el.textContent.replace(/\s+/g, ' ').trim();
        if (!msg) {
          await sleep(S.delay);
          const bytes = await post('downloadCodigosContabeisXLS.do', params);
          if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
            msg = 'O servidor não devolveu o arquivo.';
          } else {
            const dir = `${limpa(MUN_NOME[j.m])}/${j.a}`;
            const base = `${limpa(j.entNome)}_${rot(TIPOS, j.tipo)}_${j.mes.padStart(2, '0')}-${limpa(rot(MESES, j.mes))}_${j.q === 'A' ? 'Acumulado' : 'Mes'}`;
            arquivo = `${dir}/${base}.xlsx`;
            if (usados.has(arquivo)) arquivo = `${dir}/${base}_${j.ent}.xlsx`;
            usados.add(arquivo);
            files.push({ path: arquivo, data: bytes });
            if (await planilhaVazia(bytes)) {
              situacao = 'Sem contas';
              aviso = 'A planilha veio só com o cabeçalho, sem contas.';
              vazios++;
            }
          }
        }
        if (msg) { situacao = 'Sem arquivo'; falhas++; }
      } catch (e) {
        if (e.name === 'AbortError') { fim = 'Interrompido'; break; }
        if (e instanceof SessaoError) { fim = e.message; break; }
        situacao = 'Erro'; msg = e.message; falhas++;
      }
      if (situacao !== 'OK') {
        const li = document.createElement('li');
        li.textContent = `${desc}: ${msg || aviso}`;
        $('#log').appendChild(li);
      }
      rel.push([MUN_NOME[j.m], j.a, rot(TIPOS, j.tipo), j.entNome, rot(MESES, j.mes), rot(CONSULTAS, j.q), S.min, S.max, situacao, msg || aviso, arquivo]);
      if (run.stop) { fim = 'Interrompido'; break; }
      await sleep(S.delay);
    }

    const ok = files.length;
    $('#pBar').style.width = '100%';
    $('#pAtual').textContent = '';
    $('#pText').textContent = `${fim}: ${ok} arquivo(s) gerado(s)${vazios ? `, ${vazios} deles sem contas` : ''}${falhas ? `, ${falhas} sem arquivo` : ''}.${falhas || vazios ? ' Veja a lista abaixo e o relatório.' : ''}`;
    if (ok) {
      const csv = '﻿' + rel.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
      files.push({ path: 'relatorio.csv', data: new TextEncoder().encode(csv) });
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      ultimoZip = { blob: zip(files), nome: `balancetes_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.zip` };
      baixar();
    }
    run = null;
    setRodando(false);
    $('#btnZip').hidden = !ok;
  }

  /* ---------- Interface ---------- */

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  const $ = (q) => root.querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  root.innerHTML = `
<style>
  :host {
    all: initial;
    --bg: oklch(0.985 0.003 250);
    --card: oklch(0.998 0.0015 250);
    --ink: oklch(0.22 0.02 258);
    --ink-2: oklch(0.45 0.018 258);
    --line: oklch(0.912 0.006 250);
    --field: oklch(0.64 0.014 255);
    --hover: oklch(0.955 0.005 250);
    --accent: #b80c09;
    --accent-hover: #950a07;
    --accent-ink: #ffffff;
    --accent-soft: oklch(0.96 0.02 27);
    --focus: oklch(0.47 0.13 256);
    --warn-soft: oklch(0.966 0.05 85);
    --warn-ink: oklch(0.42 0.10 62);
    --r-s: 6px;
    --r-m: 8px;
    --t-s: 12px;
    --t-m: 13px;
    --t-l: 16px;
    --t-xl: 20px;
    --h: 32px;
    --veil: rgba(15,20,30,.35);
  }
  * { box-sizing: border-box; font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif; }
  [hidden] { display: none !important; }
  button, select, input { font-size: var(--t-m); color: inherit; }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }

  .fab { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; height: 40px; padding: 0 16px; border: 0;
    border-radius: var(--r-s); background: var(--accent); color: var(--accent-ink); font-size: var(--t-m); font-weight: 600;
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
  .fab:hover { background: var(--accent-hover); }
  .veil { position: fixed; inset: 0; z-index: 2147483000; background: var(--veil); }
  .panel { position: fixed; top: 0; right: 0; bottom: 0; width: min(940px, 100vw); z-index: 2147483001; display: flex;
    flex-direction: column; background: var(--bg); color: var(--ink); font-size: var(--t-m); line-height: 1.4;
    border-top: 4px solid var(--accent); box-shadow: -4px 0 18px rgba(0,0,0,.2); }

  header { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 16px; background: var(--card); border-bottom: 1px solid var(--line); }
  h1 { margin: 0 auto 0 0; font-size: var(--t-l); font-weight: 600; }
  h2 { margin: 0; font-size: var(--t-l); font-weight: 600; }
  h3 { margin: 0 0 8px; font-size: var(--t-m); font-weight: 600; }

  .btn { min-height: var(--h); padding: 0 12px; background: var(--card); border: 1px solid var(--field); border-radius: var(--r-s); cursor: pointer; }
  .btn:hover:not(:disabled) { background: var(--hover); }
  .btn:disabled { opacity: .5; cursor: default; }
  .btn.ghost { border-color: transparent; background: transparent; }
  .btn.ghost:hover:not(:disabled) { background: var(--hover); }
  .btn.pri { min-height: 40px; padding: 0 20px; background: var(--accent); border-color: var(--accent); color: var(--accent-ink); font-weight: 600; }
  .btn.pri:hover:not(:disabled) { background: var(--accent-hover); }
  .x { width: var(--h); padding: 0; font-size: var(--t-l); }
  select, input[type=search], input[type=text], input[type=number] { min-height: var(--h); padding: 0 8px; background: var(--card); border: 1px solid var(--field); border-radius: var(--r-s); }
  input[type=search], input[type=text] { flex: 1; min-width: 140px; }
  input[type=checkbox] { width: 16px; height: 16px; margin: 0; flex: none; accent-color: var(--accent); cursor: pointer; }

  .view { flex: 1; min-height: 0; display: flex; }
  .steps { width: 240px; flex: none; padding: 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; border-right: 1px solid var(--line); background: var(--card); }
  .step { display: block; width: 100%; padding: 10px 12px; text-align: left; background: none; border: 0; border-left: 3px solid transparent; border-radius: 0 var(--r-s) var(--r-s) 0; cursor: pointer; }
  .step:hover { background: var(--hover); }
  .step[aria-current="true"] { background: var(--accent-soft); border-left-color: var(--accent); }
  .step b { display: block; font-weight: 600; }
  .step span { display: block; margin-top: 2px; font-size: var(--t-s); color: var(--ink-2); overflow-wrap: anywhere; }
  .step span.falta { color: var(--warn-ink); font-weight: 600; }

  .pane { flex: 1; min-width: 0; min-height: 0; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
  .pane > .fill { flex: 1; min-height: 140px; overflow-y: auto; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .count { color: var(--ink-2); font-size: var(--t-s); margin-left: 8px; font-weight: 400; }
  .box { background: var(--card); border: 1px solid var(--line); border-radius: var(--r-m); padding: 4px 12px 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); column-gap: 12px; align-content: start; }
  label.c { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; cursor: pointer; }
  label.c input { margin-top: 1px; }
  .muted { color: var(--ink-2); font-size: var(--t-s); }
  .vazio { display: block; padding: 12px 0; color: var(--ink-2); }
  .aviso { color: var(--warn-ink); font-size: var(--t-s); font-weight: 600; }
  .aviso:empty, .muted:empty { display: none; }
  .nova { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--warn-soft); color: var(--warn-ink); border-radius: var(--r-s); font-weight: 600; }
  .grp-h { position: sticky; top: -4px; display: flex; gap: 8px; align-items: center; margin: 8px -12px 2px; padding: 6px 12px; background: var(--hover); font-weight: 600; cursor: pointer; }
  .grp:first-child .grp-h { margin-top: -4px; }

  .opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 8px; }
  .opts label.c { padding: 6px 10px; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: var(--r-s); }
  .opts label.c:hover { background: var(--hover); }
  .opts label.c:has(input:checked) { background: var(--accent-soft); border-color: var(--accent); }
  section { display: flex; flex-direction: column; }
  .head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
  .head h3 { margin: 0 auto 0 0; }

  footer { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--card); border-top: 1px solid var(--line); }
  #resumo { flex: 1; min-width: 0; }
  #resumo b { font-size: var(--t-l); font-weight: 600; }
  #erroRun:empty { display: none; }
  #erroRun { padding: 8px 16px; background: var(--warn-soft); color: var(--warn-ink); font-weight: 600; }

  #vRun, #vCfg { flex-direction: column; }
  #pText { font-size: var(--t-xl); font-weight: 600; }
  .track { height: 8px; background: var(--line); border-radius: 4px; overflow: hidden; }
  #pBar { height: 100%; width: 0; background: var(--accent); transition: width .2s; }
  #pAtual { min-height: 18px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #logWrap:has(#log:empty) { display: none; }
  #log { margin: 0; padding: 0; list-style: none; }
  #log li { padding: 6px 0; border-bottom: 1px solid var(--line); }
  #log li:last-child { border-bottom: 0; }

  @media (max-width: 700px) {
    .view#vForm { flex-direction: column; }
    .steps { width: auto; flex-direction: row; flex-wrap: wrap; border-right: 0; border-bottom: 1px solid var(--line); }
    .step { flex: 1 1 45%; padding: 6px 10px; }
    .pane { padding: 12px; }
    footer { flex-wrap: wrap; }
    footer .btn.pri { flex: 1; }
  }
  @media (prefers-reduced-motion: reduce) { #pBar { transition: none; } }
</style>
<button class="fab" id="fab">Baixar balancetes</button>
<div class="veil" id="veil" hidden></div>
<div class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="titulo" hidden>
  <header>
    <h1 id="titulo">Baixar balancetes</h1>
    <button class="btn ghost" id="btnCfg">Configuração</button>
    <button class="btn ghost x" id="fechar" aria-label="Fechar">×</button>
  </header>

  <div class="view" id="vForm">
    <nav class="steps" aria-label="Filtros">
      <button class="step" data-go="mun"><b>Municípios</b><span id="sMun"></span></button>
      <button class="step" data-go="per"><b>Período</b><span id="sPer"></span></button>
      <button class="step" data-go="ent"><b>Entidades</b><span id="sEnt"></span></button>
      <button class="step" data-go="bal"><b>Balancete</b><span id="sBal"></span></button>
    </nav>

    <div class="pane" id="pMun">
      <h2>Municípios<span class="count" id="munCount"></span></h2>
      <div class="bar">
        <select id="filtro" aria-label="Categoria de municípios"></select>
        <input type="search" id="munBusca" placeholder="Buscar município" aria-label="Buscar município">
      </div>
      <div class="bar">
        <button class="btn" id="munTodos"></button>
        <button class="btn" id="munLimpar">Limpar</button>
      </div>
      <div class="box grid fill" id="munLista"></div>
    </div>

    <div class="pane" id="pPer" hidden>
      <h2>Período</h2>
      <section>
        <h3>Ano de exercício</h3>
        <div class="opts" id="anos"></div>
      </section>
      <section>
        <div class="head">
          <h3>Mês<span class="count" id="mesCount"></span></h3>
          <button class="btn" id="mesTodos">Selecionar todos</button>
          <button class="btn" id="mesLimpar">Limpar</button>
        </div>
        <div class="opts" id="meses"></div>
      </section>
    </div>

    <div class="pane" id="pEnt" hidden>
      <h2>Entidades<span class="count" id="entCount"></span></h2>
      <div class="muted" id="entSoCons">Marque Isolado ou Consolidado em Balancete para escolher as entidades.</div>
      <div id="entCorpo" style="display:contents">
        <div class="bar">
          <button class="btn" data-pick="todas">Todas</button>
          <button class="btn" data-pick="camaras">Câmaras</button>
          <button class="btn" data-pick="prefeituras">Prefeituras</button>
          <button class="btn" data-pick="outras">Demais</button>
          <button class="btn ghost" id="entLimpar">Limpar</button>
        </div>
        <div class="bar">
          <input type="search" id="entBusca" placeholder="Buscar entidade" aria-label="Buscar entidade">
          <button class="btn" id="entMarcarBusca" hidden></button>
          <button class="btn" id="entDesmarcarBusca" hidden>Desmarcar listados</button>
          <button class="btn" id="entCarregar" hidden>Carregar de novo</button>
        </div>
        <label class="c" id="consTodasLbl"><input type="checkbox" id="consTodas"><span>Consolidado de "Todas as entidades", um arquivo por município</span></label>
        <div class="nova" id="entNovas" hidden></div>
        <div class="muted" id="entBg" role="status"></div>
        <div class="muted" id="entStatus" role="status"></div>
        <div class="aviso" id="entErro" role="alert"></div>
        <div class="box fill" id="entLista"></div>
      </div>
    </div>

    <div class="pane" id="pBal" hidden>
      <h2>Balancete</h2>
      <section>
        <h3>Tipo de balancete</h3>
        <div class="opts" id="tipos"></div>
      </section>
      <section>
        <h3>Tipo de consulta</h3>
        <div class="opts" id="consultas" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))"></div>
      </section>
      <section>
        <h3>Nível</h3>
        <div class="bar">
          <label>Mínimo <select id="min"></select></label>
          <label>Máximo <select id="max"></select></label>
        </div>
        <div class="aviso" id="nivErro" style="margin-top:8px"></div>
      </section>
    </div>
  </div>

  <div class="view pane" id="vRun" hidden>
    <div id="pText" role="status"></div>
    <div class="track"><div id="pBar"></div></div>
    <div id="pAtual"></div>
    <div class="muted" id="runDica">Não use a consulta de balancetes em outra aba durante o download: o servidor guarda um arquivo por sessão e eles podem vir trocados.</div>
    <div class="bar">
      <button class="btn" id="btnParar">Parar e salvar o que já veio</button>
      <button class="btn" id="btnZip" hidden>Baixar ZIP novamente</button>
      <button class="btn" id="btnNova" hidden>Alterar filtros</button>
    </div>
    <div class="box fill" id="logWrap">
      <h3 style="margin-top:8px">Avisos</h3>
      <ul id="log"></ul>
    </div>
  </div>

  <div class="view pane" id="vCfg" hidden>
    <h2>Configuração</h2>
    <section style="flex:1;min-height:260px">
      <h3>Categorias de municípios</h3>
      <div class="bar" style="margin-bottom:8px">
        <select id="catSel" aria-label="Categoria"></select>
        <input type="text" id="catNome" aria-label="Nome da categoria" placeholder="Nome da categoria">
        <button class="btn" id="catNova">Nova categoria</button>
        <button class="btn ghost" id="catDel">Excluir</button>
      </div>
      <div class="bar" style="margin-bottom:8px">
        <button class="btn" id="catTodos">Incluir todos</button>
        <button class="btn" id="catLimpar">Remover todos</button>
        <span class="muted" id="catInfo"></span>
      </div>
      <div class="box grid" id="catLista" style="flex:1;min-height:120px;overflow-y:auto"></div>
    </section>
    <section>
      <h3>Ritmo e dados salvos</h3>
      <div class="bar">
        <label>Intervalo entre requisições <input type="number" id="delay" min="0" step="50" style="width:80px"> ms</label>
        <button class="btn" id="cacheLimpar">Conferir entidades agora</button>
        <span class="muted" id="cacheInfo"></span>
      </div>
      <div class="muted" style="margin-top:8px">Intervalo menor é mais rápido, com mais risco de erro do servidor. As entidades da UR-02 já vêm no script e são conferidas em segundo plano, no máximo uma vez por dia, com o painel aberto.</div>
    </section>
  </div>

  <div id="erroRun" role="alert"></div>
  <footer id="foot">
    <div id="resumo" role="status"></div>
    <button class="btn pri" id="btnExtrair">Baixar balancetes</button>
  </footer>
</div>`;

  const chk = (k, v, t, on) => `<label class="c"><input type="checkbox" data-k="${k}" value="${esc(v)}"${on ? ' checked' : ''}><span>${esc(t)}</span></label>`;
  const chips = (id, k, items) => { $(id).innerHTML = items.map((i) => chk(k, i.v, i.t, S[k].includes(i.v))).join(''); };
  const catById = (id) => cats.find((c) => c.id === id);

  /* Navegação entre os filtros */
  const PANES = { mun: '#pMun', per: '#pPer', ent: '#pEnt', bal: '#pBal' };
  let paneAtual = 'mun';
  function irPara(nome) {
    paneAtual = nome;
    for (const [k, q] of Object.entries(PANES)) $(q).hidden = k !== nome;
    root.querySelectorAll('.step').forEach((b) => b.setAttribute('aria-current', String(b.dataset.go === nome)));
  }
  function verView(v) {
    $('#vForm').hidden = v !== 'form';
    $('#vRun').hidden = v !== 'run';
    $('#vCfg').hidden = v !== 'cfg';
    $('#foot').hidden = v !== 'form';
    $('#btnCfg').textContent = v === 'cfg' ? 'Voltar aos filtros' : 'Configuração';
  }

  /* Resumo de cada filtro na coluna da esquerda */
  function resumoLinha(id, texto, falta) {
    const el = $(id);
    el.textContent = falta ? 'Falta escolher' : texto;
    el.classList.toggle('falta', !!falta);
  }
  function renderLinhas() {
    const cat = cats.find((c) => {
      const noAcesso = c.mun.filter((v) => MUN_NOME[v]);
      return noAcesso.length && noAcesso.length === S.mun.length && noAcesso.every((v) => S.mun.includes(v));
    });
    resumoLinha('#sMun', cat ? `${cat.name} · ${S.mun.length}` : S.mun.length === 1 ? MUN_NOME[S.mun[0]] : `${S.mun.length} selecionados`, !S.mun.length);

    const anos = [...S.anos].sort((a, b) => b - a).join(', ');
    const meses = S.meses.length === MESES.length ? 'todos os meses' : S.meses.length === 1 ? rot(MESES, S.meses[0]) : `${S.meses.length} meses`;
    resumoLinha('#sPer', `${anos} · ${meses}`, !S.anos.length || !S.meses.length);

    const idx = entIndex();
    const validas = S.ent.filter((id) => idx.has(id)).length;
    const cons = S.tipos.includes('3') && S.consTodas;
    const sel = validas ? `${validas} de ${idx.size}` : cons ? 'Todas as entidades' : '';
    const carregandoTxt = carregando ? 'Carregando…' : '';
    resumoLinha('#sEnt', carregandoTxt || sel + (validas && cons ? ' e Todas' : ''), !carregandoTxt && !sel);

    const tipos = S.tipos.map((v) => rot(TIPOS, v)).join(' e ');
    const cons2 = S.consultas.map((v) => (v === 'A' ? 'acumulado' : 'do mês')).join(' e ');
    resumoLinha('#sBal', `${tipos} · ${cons2} · ${rot(NIV_MIN, S.min)} a ${rot(NIV_MAX, S.max)}`, !S.tipos.length || !S.consultas.length);
  }

  /* Municípios */
  function munsFiltrados() {
    const cat = catById(S.filtro);
    const q = norm($('#munBusca').value.trim());
    return MUNS.filter((m) => (!cat || cat.mun.includes(m.v)) && (!q || norm(m.t).includes(q)));
  }
  function renderFiltro() {
    if (S.filtro !== 'todos' && !catById(S.filtro)) S.filtro = 'todos';
    $('#filtro').innerHTML = `<option value="todos">Todos os municípios (${MUNS.length})</option>` + cats.map((c) => {
      const n = c.mun.filter((v) => MUN_NOME[v]).length;
      return `<option value="${esc(c.id)}">${esc(c.name)} (${n})</option>`;
    }).join('');
    $('#filtro').value = S.filtro;
  }
  function renderMun() {
    const list = munsFiltrados();
    $('#munLista').innerHTML = list.map((m) => chk('mun', m.v, m.t, S.mun.includes(m.v))).join('') || '<span class="vazio">Nenhum município encontrado.</span>';
    const cat = catById(S.filtro);
    const busca = $('#munBusca').value.trim();
    $('#munTodos').textContent = busca ? `Marcar os ${list.length} listados` : cat ? `Selecionar todos da ${cat.name} (${list.length})` : `Selecionar todos (${list.length})`;
    $('#munTodos').disabled = !list.length;
    $('#munCount').textContent = `${S.mun.length} selecionado(s)`;
  }

  /* Entidades */
  function entsListadas(idx = entIndex()) {
    const q = norm($('#entBusca').value.trim());
    return [...idx.values()].filter((e) => !q || norm(e.nome).includes(q));
  }
  function atualizarContagemEnt() {
    const idx = entIndex();
    const validas = S.ent.filter((id) => idx.has(id)).length;
    $('#entCount').textContent = idx.size ? `${validas} de ${idx.size} selecionada(s)` : '';
    root.querySelectorAll('#entLista .grp').forEach((g) => {
      const filhos = [...g.querySelectorAll('input[data-k="ent"]')];
      const marcados = filhos.filter((i) => i.checked).length;
      const h = g.querySelector('input[data-munall]');
      h.checked = marcados === filhos.length;
      h.indeterminate = marcados > 0 && marcados < filhos.length;
    });
  }
  function renderEnt() {
    const semTipo = !S.tipos.length;
    $('#entCorpo').hidden = semTipo;
    $('#entSoCons').hidden = !semTipo;
    renderLinhas();
    if (semTipo) { $('#entCount').textContent = ''; return; }
    $('#consTodasLbl').hidden = !S.tipos.includes('3');
    $('#consTodas').checked = S.consTodas;
    const idx = entIndex();
    const semBase = !S.mun.length || !S.anos.length;
    $('#entCarregar').hidden = !!carregando || !faltantes().length || !$('#entErro').textContent;
    root.querySelectorAll('[data-pick]').forEach((b) => { b.disabled = semBase; });
    const q = norm($('#entBusca').value.trim());
    const listadas = entsListadas(idx);
    $('#entMarcarBusca').hidden = $('#entDesmarcarBusca').hidden = !q || !listadas.length;
    $('#entMarcarBusca').textContent = `Marcar os ${listadas.length} listados`;
    let html = '';
    for (const m of S.mun) {
      const ents = listadas.filter((e) => e.mun === m).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      if (!ents.length) continue;
      html += `<div class="grp"><label class="grp-h"><input type="checkbox" data-munall="${esc(m)}" aria-label="Marcar entidades de ${esc(MUN_NOME[m])}"><span>${esc(MUN_NOME[m])}</span></label>`;
      for (const e of ents) {
        const parcial = e.anos.length < S.anos.length ? ` (só ${e.anos.join(', ')})` : '';
        const nova = entNovas.includes(e.key) ? ' · nova' : '';
        html += chk('ent', e.key, e.nome + parcial + nova, S.ent.includes(e.key));
      }
      html += '</div>';
    }
    const vazio = semBase ? 'Escolha município e exercício para listar as entidades.'
      : carregando ? 'Carregando entidades…'
      : q ? 'Nenhuma entidade encontrada.' : 'Nenhuma entidade disponível para os filtros marcados.';
    $('#entLista').innerHTML = html || `<span class="vazio">${vazio}</span>`;
    atualizarContagemEnt();
  }

  function renderNovas() {
    const box = $('#entNovas');
    box.hidden = !entNovas.length;
    if (!entNovas.length) return;
    const nomes = entNovas.map((k) => {
      const [m, ...r] = k.split('|');
      return `${r.join('|')} (${MUN_NOME[m] || m})`;
    });
    box.innerHTML = `<span>${entNovas.length === 1 ? 'Nova entidade' : `${entNovas.length} novas entidades`}: ${esc(nomes.join('; '))}.</span><button class="btn" id="novasOk">Entendi</button>`;
  }

  /* Rodapé */
  function renderResumo() {
    renderLinhas();
    const nivelErrado = Number(S.min) > Number(S.max);
    $('#nivErro').textContent = nivelErrado ? 'O nível mínimo não pode ser maior que o máximo.' : '';
    const falta = [];
    if (!S.mun.length) falta.push('município');
    if (!S.anos.length) falta.push('exercício');
    if (!S.meses.length) falta.push('mês');
    if (!S.tipos.length) falta.push('tipo de balancete');
    if (!S.consultas.length) falta.push('tipo de consulta');
    if (S.tipos.length && !S.ent.length && !(S.tipos.includes('3') && S.consTodas)) falta.push('entidade');
    const b = $('#btnExtrair');
    if (falta.length || nivelErrado) {
      $('#resumo').textContent = falta.length ? `Falta escolher: ${falta.join(', ')}.` : 'Corrija o nível em Balancete.';
      b.disabled = true;
      return;
    }
    const n = montarJobs().length;
    b.disabled = !n;
    if (!n) { $('#resumo').textContent = 'Nenhuma combinação disponível para os filtros marcados.'; return; }
    $('#resumo').innerHTML = `<b>${n} arquivo${n > 1 ? 's' : ''}</b> em um único ZIP`;
  }

  /* Configuração */
  function renderCfg() {
    const cat = catById(catAtual) || cats[0];
    catAtual = cat ? cat.id : null;
    $('#catSel').innerHTML = cats.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    $('#catSel').value = catAtual || '';
    ['catSel', 'catNome', 'catDel', 'catTodos', 'catLimpar'].forEach((id) => { $('#' + id).disabled = !cat; });
    $('#catNome').value = cat ? cat.name : '';
    $('#catLista').innerHTML = cat ? MUNS.map((m) => chk('cat', m.v, m.t, cat.mun.includes(m.v))).join('') : '<span class="vazio">Crie uma categoria.</span>';
    $('#catInfo').textContent = cat ? `${cat.mun.length} município(s), ${cat.mun.filter((v) => MUN_NOME[v]).length} no seu acesso` : '';
    const ult = GM_getValue('entConferidas', 0);
    $('#cacheInfo').textContent = bgTexto || (ult ? `Última conferência: ${new Date(ult).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Ainda não conferidas');
    $('#delay').value = S.delay;
  }

  /* Download em andamento */
  function setRodando(on) {
    verView('run');
    $('#btnParar').hidden = !on;
    $('#runDica').hidden = !on;
    $('#btnNova').hidden = on;
    if (on) $('#btnZip').hidden = true;
    $('#btnCfg').disabled = on;
  }

  function renderMeses() {
    chips('#meses', 'meses', MESES);
    $('#mesCount').textContent = `${S.meses.length} selecionado(s)`;
  }

  function renderAll() {
    renderFiltro();
    renderMun();
    chips('#anos', 'anos', ANOS);
    renderMeses();
    chips('#tipos', 'tipos', TIPOS);
    chips('#consultas', 'consultas', CONSULTAS);
    $('#min').innerHTML = NIV_MIN.map((n) => `<option value="${esc(n.v)}">${esc(n.t)}</option>`).join('');
    $('#max').innerHTML = NIV_MAX.map((n) => `<option value="${esc(n.v)}">${esc(n.t)}</option>`).join('');
    $('#min').value = S.min;
    $('#max').value = S.max;
    renderEnt();
    renderNovas();
    renderResumo();
    renderCfg();
    irPara(paneAtual);
  }

  /* ---------- Eventos ---------- */

  root.addEventListener('change', (ev) => {
    const el = ev.target;
    const k = el.dataset && el.dataset.k;
    if (el.dataset && el.dataset.munall) {
      const ids = entsListadas().filter((e) => e.mun === el.dataset.munall).map((e) => e.key);
      S.ent = el.checked ? [...new Set([...S.ent, ...ids])] : S.ent.filter((id) => !ids.includes(id));
      el.closest('.grp').querySelectorAll('input[data-k="ent"]').forEach((i) => { i.checked = el.checked; });
      saveS();
      atualizarContagemEnt();
      renderResumo();
    } else if (k === 'cat') {
      const cat = catById(catAtual);
      cat.mun = el.checked ? [...new Set([...cat.mun, el.value])] : cat.mun.filter((v) => v !== el.value);
      saveCats();
      $('#catInfo').textContent = `${cat.mun.length} município(s), ${cat.mun.filter((v) => MUN_NOME[v]).length} no seu acesso`;
      renderFiltro();
      renderMun();
      renderResumo();
    } else if (k) {
      S[k] = el.checked ? [...new Set([...S[k], el.value])] : S[k].filter((v) => v !== el.value);
      saveS();
      if (k === 'mun') $('#munCount').textContent = `${S.mun.length} selecionado(s)`;
      if (k === 'mun' || k === 'anos' || k === 'tipos') { renderEnt(); agendarEntidades(); }
      if (k === 'meses') $('#mesCount').textContent = `${S.meses.length} selecionado(s)`;
      if (k === 'ent') atualizarContagemEnt();
      renderResumo();
    }
  });

  $('#entNovas').addEventListener('click', (e) => {
    if (e.target.id !== 'novasOk') return;
    entNovas = [];
    GM_setValue('entNovas', entNovas);
    renderNovas();
    renderEnt();
  });
  $('#consTodas').addEventListener('change', (e) => { S.consTodas = e.target.checked; saveS(); renderResumo(); });
  $('#filtro').addEventListener('change', (e) => { S.filtro = e.target.value; saveS(); renderMun(); });
  $('#munBusca').addEventListener('input', renderMun);
  $('#entBusca').addEventListener('input', renderEnt);
  $('#min').addEventListener('change', (e) => { S.min = e.target.value; saveS(); renderResumo(); });
  $('#max').addEventListener('change', (e) => { S.max = e.target.value; saveS(); renderResumo(); });

  function abrir() {
    $('#panel').hidden = false;
    $('#veil').hidden = false;
    $('#fab').hidden = true;
    root.querySelector('.step[aria-current="true"]').focus();
    agendarEntidades();
    conferirEntidades();
  }
  function fechar() {
    $('#panel').hidden = true;
    $('#veil').hidden = true;
    $('#fab').hidden = false;
    $('#fab').focus();
  }
  $('#fab').onclick = abrir;
  $('#fechar').onclick = fechar;
  $('#veil').onclick = fechar;
  $('#panel').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    const focaveis = [...$('#panel').querySelectorAll('button, input, select')].filter((x) => !x.disabled && x.offsetParent !== null);
    const atual = root.activeElement;
    if (e.shiftKey && atual === focaveis[0]) { e.preventDefault(); focaveis[focaveis.length - 1].focus(); }
    else if (!e.shiftKey && atual === focaveis[focaveis.length - 1]) { e.preventDefault(); focaveis[0].focus(); }
  });

  root.querySelectorAll('.step').forEach((b) => { b.onclick = () => irPara(b.dataset.go); });
  $('#btnCfg').onclick = () => {
    if ($('#vCfg').hidden) { renderCfg(); verView('cfg'); } else { verView('form'); }
  };
  $('#btnNova').onclick = () => verView('form');

  $('#munTodos').onclick = () => {
    S.mun = [...new Set([...S.mun, ...munsFiltrados().map((m) => m.v)])];
    saveS(); renderMun(); renderEnt(); renderResumo(); agendarEntidades();
  };
  $('#munLimpar').onclick = () => { S.mun = []; saveS(); renderMun(); renderEnt(); renderResumo(); };

  const PICK = {
    todas: () => true,
    camaras: (e) => isCamara(e.nome),
    prefeituras: (e) => isPrefeitura(e.nome),
    outras: (e) => !isCamara(e.nome) && !isPrefeitura(e.nome),
  };
  root.querySelectorAll('[data-pick]').forEach((b) => {
    b.onclick = async () => {
      if (!(await ensureEntidades())) return;
      const add = [...entIndex().values()].filter(PICK[b.dataset.pick]).map((e) => e.key);
      S.ent = [...new Set([...S.ent, ...add])];
      saveS(); renderEnt(); renderResumo();
    };
  });
  $('#entMarcarBusca').onclick = () => {
    S.ent = [...new Set([...S.ent, ...entsListadas().map((e) => e.key)])];
    saveS(); renderEnt(); renderResumo();
  };
  $('#entDesmarcarBusca').onclick = () => {
    const ids = new Set(entsListadas().map((e) => e.key));
    S.ent = S.ent.filter((id) => !ids.has(id));
    saveS(); renderEnt(); renderResumo();
  };
  $('#entLimpar').onclick = () => { S.ent = []; saveS(); renderEnt(); renderResumo(); };
  $('#entCarregar').onclick = () => { ensureEntidades(); };
  $('#mesTodos').onclick = () => { S.meses = MESES.map((m) => m.v); saveS(); renderMeses(); renderResumo(); };
  $('#mesLimpar').onclick = () => { S.meses = []; saveS(); renderMeses(); renderResumo(); };

  $('#btnExtrair').onclick = () => extrair().then(() => {
    if ($('#entErro').textContent && $('#vRun').hidden) irPara('ent');
  }).catch((e) => {
    $('#erroRun').textContent = e.message || 'Falha no download.';
    run = null;
    setRodando(false);
  });
  $('#btnParar').onclick = () => { if (run) { run.stop = true; run.ctrl.abort(); } };
  $('#btnZip').onclick = baixar;

  $('#catSel').addEventListener('change', (e) => { catAtual = e.target.value; renderCfg(); });
  $('#catNome').addEventListener('input', (e) => {
    const cat = catById(catAtual);
    cat.name = e.target.value;
    saveCats();
    $('#catSel').selectedOptions[0].textContent = cat.name;
    renderFiltro();
    renderMun();
    renderLinhas();
  });
  $('#catNova').onclick = () => {
    const c = { id: 'c' + Date.now(), name: 'Nova categoria', mun: [] };
    cats.push(c);
    catAtual = c.id;
    saveCats(); renderCfg(); renderFiltro();
    $('#catNome').focus();
    $('#catNome').select();
  };
  $('#catDel').onclick = () => {
    const cat = catById(catAtual);
    if (!cat || !confirm(`Excluir a categoria ${cat.name}?`)) return;
    cats = cats.filter((c) => c !== cat);
    catAtual = cats[0] ? cats[0].id : null;
    saveCats(); renderCfg(); renderFiltro(); renderMun(); renderLinhas();
  };
  $('#catTodos').onclick = () => {
    const cat = catById(catAtual);
    cat.mun = [...new Set([...cat.mun, ...MUNS.map((m) => m.v)])];
    saveCats(); renderCfg(); renderFiltro(); renderMun(); renderLinhas();
  };
  $('#catLimpar').onclick = () => {
    const cat = catById(catAtual);
    cat.mun = cat.mun.filter((v) => !MUN_NOME[v]);
    saveCats(); renderCfg(); renderFiltro(); renderMun(); renderLinhas();
  };
  $('#delay').addEventListener('change', (e) => {
    const v = Number(e.target.value);
    S.delay = Number.isFinite(v) && e.target.value !== '' ? Math.max(0, v) : 800;
    saveS(); renderCfg(); renderResumo();
  });
  $('#cacheLimpar').onclick = () => {
    Object.values(entCache).forEach((c) => { c.t = 0; });
    conferirEntidades();
  };

  renderAll();
})();
