// ════════════════════════════════════════════════════════════════════════
// ColectTap GAS — Google Apps Script Dedicado
// Sistema de Levantamento NR-13 · Engetap Engenharia Ltda
// Versão: v1.17 — Maio/2026
// ════════════════════════════════════════════════════════════════════════

// ── CONFIGURAÇÃO ──────────────────────────────────────────────────────────
const SPREADSHEET_ID = '1WIcWnMvIKo03Qp1d---0E_zo68wNf7Byf5KNzjX9B-I';
const APP_VERSION    = 'ColectTap-GAS-v1.17';
const DRIVE_LINK_PUBLICO = true;

// ── CONSTANTES DE ABAS ────────────────────────────────────────────────────
const ABA_INSPETORES     = 'INSPETORES';
const ABA_OS             = 'OS_COLECT';
const ABA_EQUIP          = 'EQUIPAMENTOS_NR13';
const ABA_TECNICOS       = 'TECNICOS';
const ABA_CLIENTES_LEADS = 'CLIENTES_LEADS';
const ABA_OS_COLECT      = 'OS_COLECT';       // alias
const ABA_CONSULTA       = 'CONSULTA_CLIENTE';
const ABA_LOG            = 'LOG';
const ABA_CONFIG         = 'CONFIG';

// ── CORS / ENTRY POINT ────────────────────────────────────────────────────
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    let action, params;

    if (e.postData && e.postData.contents) {
      let body;
      try {
        // Tenta JSON direto (Field)
        body = JSON.parse(e.postData.contents);
      } catch (_) {
        // URLSearchParams (Manager — evita preflight CORS)
        const raw = decodeURIComponent(e.postData.contents.replace(/^payload=/, ''));
        body = JSON.parse(raw);
      }
      action = body.action || (e.parameter && e.parameter.action) || '';
      params = body;
    } else {
      // GET ou form-encoded sem body
      if (e.parameter && e.parameter.payload) {
        const body = JSON.parse(e.parameter.payload);
        action = body.action || '';
        params = body;
      } else {
        action = (e.parameter && e.parameter.action) || '';
        params = e.parameter || {};
      }
    }

    let result;
    switch (action) {
      case 'healthCheck':              result = healthCheck();                        break;
      case 'validarPIN':               result = validarPIN(params);                  break;
      case 'getOSColect':              result = getOSColect(params);                  break;
      case 'salvarLevantamentoNR13':   result = salvarLevantamentoNR13(params);       break;
      case 'getEquipamentos':          result = getEquipamentos(params);              break;
      case 'gerarConsultaCliente':     result = gerarConsultaCliente();               break;
      case 'getTecnicos':              result = getTecnicos();                        break;
      case 'salvarTecnico':            result = salvarTecnico(params);               break;
      case 'getInspetores':            result = getInspetores();                     break;
      case 'salvarInspetor':           result = salvarInspetor(params);              break;
      case 'atualizarInspetor':        result = atualizarInspetor(params);           break;
      case 'excluirInspetor':          result = excluirInspetor(params);             break;
      case 'getClientesLeads':         result = getClientesLeads();                  break;
      case 'salvarClienteLead':        result = salvarClienteLead(params);           break;
      case 'atualizarClienteLead':     result = atualizarClienteLead(params);        break;
      case 'excluirClienteLead':       result = excluirClienteLead(params);          break;
      case 'salvarOSColect':           result = salvarOSColect(params);              break;
      case 'atualizarOSColect':        result = atualizarOSColect(params);           break;
      case 'excluirOSColect':          result = excluirOSColect(params);             break;
      case 'atualizarEquipamentoRevisao': result = atualizarEquipamentoRevisao(params); break;
      case 'getFotoBase64':               result = getFotoBase64(params);               break;
      case 'getConsultaCliente':       result = gerarConsultaCliente();               break;
      default:
        result = { status:'erro', mensagem:'Ação desconhecida: ' + action };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    logErro('handleRequest', err.message, JSON.stringify(e.parameter || {}));
    output.setContent(JSON.stringify({ status:'erro', mensagem: err.message }));
  }

  return output;
}

// ════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════
function healthCheck() {
  garantirAbas();
  migrarEstrutura();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = ss.getSheets().map(s => s.getName());
  return {
    status: 'ok',
    version: APP_VERSION,
    ts: new Date().toISOString(),
    sheets: sheetNames
  };
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS DE NORMALIZAÇÃO (P5 — leitura por cabeçalho, não posição fixa)
// ════════════════════════════════════════════════════════════════════════
function norm(v) {
  return String(v == null ? '' : v).trim();
}

function normPin(v) {
  return norm(v).replace(/\D/g, '').slice(0, 4);
}

function rowObj(header, row) {
  const obj = {};
  header.forEach((h, i) => { obj[norm(h)] = row[i]; });
  return obj;
}

function buscarPinEmAba(nomeAba, pin, opts) {
  const aba = getOuCriarAba(nomeAba);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return null;

  const header = dados[0].map(norm);

  for (let i = 1; i < dados.length; i++) {
    const o = rowObj(header, dados[i]);
    const pinSalvo = normPin(o.pin);
    const ativo = norm(o.ativo).toLowerCase();

    const inativo = ativo === 'false' || ativo === 'não' || ativo === 'nao' || ativo === '0' || ativo === 'inativo';

    if (pinSalvo === pin && !inativo) {
      return {
        status: 'ok',
        valido: true,
        usuario: {
          id: norm(o[opts.idCol]),
          nome: norm(o.nome),
          perfil: opts.perfil
        }
      };
    }
  }
  return null;
}

function buscarManagerPinConfig(pin) {
  try {
    const cfg = getOuCriarAba(ABA_CONFIG);
    const cfgDados = cfg.getDataRange().getValues();
    for (let i = 1; i < cfgDados.length; i++) {
      if (norm(cfgDados[i][0]) === 'MANAGER_PIN' && normPin(cfgDados[i][1]) === pin) {
        return { status: 'ok', valido: true, usuario: { id: 'admin', nome: 'Administrador', perfil: 'manager' } };
      }
    }
  } catch(_) {}
  return null;
}

// ════════════════════════════════════════════════════════════════════════
// VALIDAR PIN
// app='field'  → busca em INSPETORES (retorna id_inspetor/nome para fluxo de OS)
// app='manager'→ busca em TECNICOS   (retorna id_tecnico/nome para acesso admin)
// Se app não informado → tenta INSPETORES (compatibilidade Field legado)
// ════════════════════════════════════════════════════════════════════════
function validarPIN(params) {
  const pin = normPin(params.pin);
  if (!pin || pin.length !== 4) {
    return { status: 'erro', valido: false, mensagem: 'PIN inválido' };
  }

  const app = norm(params.app || params.origem || 'field').toLowerCase();

  if (app === 'manager') {
    const r = buscarPinEmAba(ABA_TECNICOS, pin, {
      idCol: 'id_tecnico',
      perfil: 'manager'
    });

    if (r) return r;

    const cfg = buscarManagerPinConfig(pin);
    if (cfg) return cfg;

    return { status: 'erro', valido: false, mensagem: 'PIN não encontrado' };
  }

  // Field → INSPETORES
  const r = buscarPinEmAba(ABA_INSPETORES, pin, {
    idCol: 'id_inspetor',
    perfil: 'field'
  });

  if (r) return {
    status: 'ok',
    valido: true,
    id_inspetor: r.usuario.id,
    nome: r.usuario.nome,
    usuario: r.usuario
  };

  return { status: 'erro', valido: false, mensagem: 'PIN não encontrado' };
}

// ════════════════════════════════════════════════════════════════════════
// LISTAR OS PARA COLECT
// ════════════════════════════════════════════════════════════════════════
function getOSColect(params) {
  const id_inspetor = norm(params.id_inspetor || '');
  // origem='manager' → retorna TODAS as OS (sem filtro por inspetor)
  // origem='field'   → filtra apenas ativas e do inspetor logado (comportamento legado)
  const origem = norm(params.origem || params.app || 'field').toLowerCase();
  const modoManager = (origem === 'manager');

  const aba = getOuCriarAba(ABA_OS);
  garantirColunas(aba, ['os_status']);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'ok', os:[] };

  const header = dados[0].map(norm);
  const get = (row, col) => {
    const idx = header.indexOf(col);
    return idx >= 0 ? String(row[idx] == null ? '' : row[idx]) : '';
  };

  const os = [];
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    const id_os = get(row, 'id_os');
    if (!id_os) continue;
    const status = get(row, 'status');
    // Manager vê todos os status; Field só vê 'ativa'
    if (!modoManager && status.toLowerCase() !== 'ativa') continue;
    const resp = get(row, 'id_inspetor_resp');
    // Field: filtra por inspetor apenas se um inspetor foi passado e a OS tem resp definido
    if (!modoManager && id_inspetor && resp && resp.trim() && resp.trim() !== id_inspetor) continue;
    os.push({
      id_os,
      numero_os:    get(row, 'numero_os'),
      id_cliente:   get(row, 'id_cliente'),
      cliente:      get(row, 'cliente'),
      descricao:    get(row, 'descricao'),
      data_abertura: formatarData(get(row, 'data_abertura')),
      status,
      id_inspetor_resp: resp,
    });
  }
  return { status:'ok', os };
}

// ════════════════════════════════════════════════════════════════════════
// SALVAR LEVANTAMENTO NR-13
// Um registro por equipamento coletado
// ════════════════════════════════════════════════════════════════════════
function salvarLevantamentoNR13(params) {
  const {
    id_os, numero_os, id_cliente, cliente,
    id_inspetor, inspetor, app_version, data_coleta,
    id_visita_colect,
    equipamentos,
    os_status_update   // ← v1.11: enviado pelo Field quando "Enviar OS Completa"
  } = params;

  if (!equipamentos || !equipamentos.length) {
    return { status:'erro', mensagem:'Nenhum equipamento enviado' };
  }

  const aba = getOuCriarAba(ABA_EQUIP);
  garantirColunas(aba, [
    'id_visita_colect','id_equipamento_colect','status_completude','sync_status','pendencias_json',
    'status_documentacao','documentos_presentes','documentos_ausentes','documentos_a_receber',
    'enquadra_nr13','enq_motivo','base_enquadramento','motivo_nao_enquadramento','acao_nao_enquadramento',
    'situacao_nr13','setor','descricao_equipamento','drive_folder_id','drive_folder_url',
    'primeira_foto_url','quantidade_fotos','fotos_json','upload_fotos_status','upload_fotos_erros','data_criacao','data_atualizacao',
    'modo_coleta_inicial','status_coleta_campo','status_coleta_documentos',
    'pendencias_campo','pendencias_documentais','origem_respostas_json','conflitos_json',
    'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo',
    'foto_capa_key',
  ]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (aba.getLastRow() === 0) {
      aba.appendRow(getCabecalhoEquip());
    }

    const resultados = [];

    equipamentos.forEach(eq => {
      const fotos = Array.isArray(eq.fotos) ? eq.fotos : [];
      const equipId = String(eq.id_equipamento_colect || ('EQ-' + Utilities.getUuid())).trim();
      const visitaId = String(eq.id_visita_colect || id_visita_colect || '').trim();

      const fotosInfo = salvarFotosDrive(visitaId, equipId, eq.tag || equipId, fotos);

      const contextoVisita = {
        id_os, numero_os, id_cliente, cliente,
        id_inspetor, inspetor, app_version, data_coleta,
        id_visita_colect: visitaId
      };

      const up = upsertEquipamentoNR13(
        Object.assign({}, eq, { id_equipamento_colect: equipId, id_visita_colect: visitaId }),
        contextoVisita,
        fotosInfo
      );
      resultados.push({
        ...up,
        drive_folder_id: fotosInfo.drive_folder_id || '',
        drive_folder_url: fotosInfo.drive_folder_url || '',
        primeira_foto_url: fotosInfo.primeira_foto_url || '',
        quantidade_fotos: fotosInfo.quantidade_fotos || 0,
        fotos_json: fotosInfo.fotos_salvas ? JSON.stringify(fotosInfo.fotos_salvas) : '',
        fotos_com_erro: fotosInfo.fotos_com_erro || []
      });
    });

    const id_lev = 'LNR-' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd-HHmmss');

    // ── v1.11: gravar os_status na OS quando o Field sinaliza OS completa ──
    if (os_status_update && id_os) {
      try {
        atualizarOSColect({ id_os: id_os, os_status: os_status_update });
      } catch(e) {
        logErro('salvarLevantamentoNR13.os_status_update', e.message, id_os);
      }
    }

    return { status:'ok', id: id_lev, registros: resultados.length, resultados: resultados };

  } finally {
    lock.releaseLock();
  }
}

// === INSERIR APÓS função salvarLevantamentoNR13 ===
function upsertEquipamentoNR13(eq, contextoVisita, fotosInfo) {
  const aba = getOuCriarAba(ABA_EQUIP);

  // Garantir que a aba tem ao menos o cabeçalho antes de qualquer leitura
  if (aba.getLastRow() === 0) {
    aba.appendRow(getCabecalhoEquip());
  }

  // v1.12: leitura ÚNICA após inicialização da aba — header e dados com índices consistentes
  // (garantirColunas chamado pelo pai pode ter adicionado colunas; reler aqui evita mismatch)
  const todosOsDados = aba.getDataRange().getValues();
  const header = todosOsDados[0] || [];
  const idxByName = {};
  header.forEach((h, i) => { idxByName[String(h)] = i; });

  const idEquip = String(eq.id_equipamento_colect || '').trim();
  if (!idEquip) throw new Error('id_equipamento_colect é obrigatório');

  const nowIso = new Date().toISOString();
  let rowIndex = -1;
  if (idxByName.id_equipamento_colect >= 0) {
    for (let i = 1; i < todosOsDados.length; i++) {
      if (String(todosOsDados[i][idxByName.id_equipamento_colect] || '').trim() === idEquip) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowData = new Array(header.length).fill('');
  if (rowIndex > 0) {
    const existente = aba.getRange(rowIndex, 1, 1, header.length).getValues()[0];
    for (let i = 0; i < header.length; i++) rowData[i] = existente[i];
  }

  const campos = {
    id_os: contextoVisita.id_os || '', numero_os: contextoVisita.numero_os || '',
    id_cliente: contextoVisita.id_cliente || '', cliente: contextoVisita.cliente || '',
    id_inspetor: contextoVisita.id_inspetor || '', inspetor: contextoVisita.inspetor || '',
    data_coleta: contextoVisita.data_coleta || '', data_registro: nowIso,
    app_version: contextoVisita.app_version || '',

    tag: eq.tag || '', tipo: eq.tipo || '', fabricante: eq.fabricante || '', numero_equip: eq.numero_equip || '',
    ano_fabricacao: eq.ano_fabricacao || '', categoria: eq.categoria || '', codigo_projeto: eq.codigo_projeto || '',
    ano_edicao_codigo_projeto: eq.ano_edicao_codigo_projeto || '',
    localizacao: eq.localizacao || '', placa_indelevel: eq.placa_indelevel || '', necessita_tag: eq.necessita_tag || '',
    obs_ident: eq.obs_ident || '',

    pmta: eq.pmta || '', pressao_trabalho: eq.pressao_trabalho || '', pressao_teste: eq.pressao_teste || '',
    temperatura: eq.temperatura || '',
    fluido: eq.fluido === 'Outro' ? (eq.fluido_outro || '') : (eq.fluido || ''),
    classe_fluido: eq.classe_fluido || '', ja_inspecionado: eq.ja_inspecionado || '',
    ano_ultima_inspecao: eq.ano_ultima_inspecao || '', tipo_ultima_inspecao: eq.tipo_ultima_inspecao || '',

    diametro: eq.diametro || eq.diametro_externo_mm || eq.diametro_externo_calculado_mm || '',
    motivo_nao_calibracao_man: eq.motivo_nao_calibracao_man || '',
    motivo_nao_calibracao_psv: eq.motivo_nao_calibracao_psv || '',
    obs_manometro: eq.obs_manometro || '',
    obs_valvula: eq.obs_valvula || '',
    valvula_adequada: eq.valvula_adequada || '',
    motivo_valvula_inadequada: eq.motivo_valvula_inadequada || '',
    motivo_nao_avaliacao_valvula: eq.motivo_nao_avaliacao_valvula || '',
    comprimento: eq.comprimento || eq.comprimento_m || '', altura: eq.altura || '',
    volume: eq.volume || '', espessura_parede: eq.espessura_parede || '', material: eq.material || eq.material_casco || '',
    bitola: eq.bitola === 'Outro' ? (eq.bitola_outro || '') : (eq.bitola || ''),
    classe_pressao: eq.classe_pressao || '', isolamento: eq.isolamento || '',
    possui_isolamento: eq.possui_isolamento || '',
    capacidade_vapor: eq.capacidade_vapor || '', area_aquecimento: eq.area_aquecimento || '',
    combustivel: eq.combustivel || '', pressao_projeto: eq.pressao_projeto || '',
    teto: eq.teto || '', revestimento: eq.revestimento || '',

    possui_manometro: eq.possui_manometro || '', manometro_calibrado: eq.manometro_calibrado || '',
    cert_manometro: eq.cert_manometro || '', venc_manometro: eq.venc_manometro || '',
    possui_valvula: eq.possui_valvula || '', valvula_calibrada: eq.valvula_calibrada || '',
    cert_valvula: eq.cert_valvula || '', venc_valvula: eq.venc_valvula || '', pa_valvula: eq.pa_valvula || '',
    possui_purgador: eq.possui_purgador || '', possui_dcbi: eq.possui_dcbi || '',
    possui_valvula_retencao: eq.possui_valvula_retencao || '',
    possui_indicador_nivel: eq.possui_indicador_nivel || '', possui_pressostato: eq.possui_pressostato || '',

    documentos_presentes: serializarChecks(eq._checks || {}, 'doc', eq._checkLabels || {}),
    trabalho_altura: eq.trabalho_altura || '', necessita_th: eq.necessita_th || '',
    espaco_confinado: eq.espaco_confinado || '', necessita_scaffold: eq.necessita_scaffold || '',
    ensaios_nd_necessarios: serializarChecks(eq._checks || {}, 'end', eq._checkLabels || {}), processo: eq.processo || '',
    risco_observado: eq.risco_observado || '', obs_gerais: eq.obs_gerais || '', obs_inspetor: eq.obs_inspetor || '',

    id_visita_colect: eq.id_visita_colect || contextoVisita.id_visita_colect || '',
    id_equipamento_colect: idEquip,
    status_completude: eq.status_completude || '', sync_status: eq.sync_status || '',
    pendencias_json: eq.pendencias_json ? JSON.stringify(eq.pendencias_json) : '',
    status_documentacao: eq.status_documentacao || '',
    documentos_ausentes: eq.documentos_ausentes || '', documentos_a_receber: eq.documentos_a_receber || '',
    enquadra_nr13: eq.enquadra_nr13 || '', base_enquadramento: eq.base_enquadramento || '',
    enq_motivo: Array.isArray(eq.enq_motivo) ? eq.enq_motivo.join(' | ') : (eq.enq_motivo || ''),
    motivo_nao_enquadramento: eq.motivo_nao_enquadramento || '', acao_nao_enquadramento: eq.acao_nao_enquadramento || '',
    situacao_nr13: eq.situacao_nr13 || '', setor: eq.setor || '', descricao_equipamento: eq.descricao_equipamento || '',
    drive_folder_id: (fotosInfo && fotosInfo.drive_folder_id) || '', drive_folder_url: (fotosInfo && fotosInfo.drive_folder_url) || '',
    primeira_foto_url: (fotosInfo && fotosInfo.fotos_salvas && fotosInfo.fotos_salvas[0] && fotosInfo.fotos_salvas[0].file_url) || '',
    quantidade_fotos: (fotosInfo && fotosInfo.fotos_salvas && fotosInfo.fotos_salvas.length) || 0,
    fotos_json: (fotosInfo && fotosInfo.fotos_salvas) ? JSON.stringify(fotosInfo.fotos_salvas) : '',

    modo_coleta_inicial: eq.modo_coleta_inicial || '',
    status_coleta_campo: eq.status_coleta_campo || '',
    status_coleta_documentos: eq.status_coleta_documentos || '',
    pendencias_campo: eq.pendencias_campo || '',
    pendencias_documentais: eq.pendencias_documentais || '',
    origem_respostas_json: toJsonCell(eq.origem_respostas_json),
    conflitos_json: toJsonCell(eq.conflitos_json),
    data_primeira_coleta_campo: eq.data_primeira_coleta_campo || '',
    data_primeira_coleta_documentos: eq.data_primeira_coleta_documentos || '',
    data_ultima_alternancia_fluxo: eq.data_ultima_alternancia_fluxo || '',
    data_atualizacao: nowIso,
    foto_capa_key: eq.foto_capa_key || '',
  };

  if (rowIndex < 0) campos.data_criacao = nowIso;

  Object.keys(campos).forEach(k => {
    if (idxByName[k] >= 0) rowData[idxByName[k]] = campos[k];
  });

  if (rowIndex > 0) {
    if (idxByName.data_criacao >= 0 && !rowData[idxByName.data_criacao]) rowData[idxByName.data_criacao] = nowIso;
    const rngUpd = aba.getRange(rowIndex, 1, 1, header.length);
    rngUpd.setNumberFormat('@');
    rngUpd.setValues([rowData]);
    return { acao:'updated', id_equipamento_colect:idEquip, linha:rowIndex };
  }

  const lastRow = aba.getLastRow() + 1;
  aba.getRange(lastRow, 1, 1, rowData.length).setNumberFormat('@');
  aba.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
  return { acao:'inserted', id_equipamento_colect:idEquip, linha:aba.getLastRow() };
}
// ════════════════════════════════════════════════════════════════════════
// GET EQUIPAMENTOS (para consulta futura)
// ════════════════════════════════════════════════════════════════════════
function getEquipamentos(params) {
  const id_os = norm(params.id_os || '');
  const aba = getOuCriarAba(ABA_EQUIP);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'ok', equipamentos:[] };

  // v1.11: usar norm() no header para tolerar espaços/case no cabeçalho
  const header = dados[0].map(h => String(h));
  const headerNorm = header.map(norm);
  const idxOS = headerNorm.indexOf('id_os');
  if (idxOS < 0) return { status:'ok', equipamentos:[] };

  const equips = dados.slice(1)
    .filter(row => !id_os || norm(String(row[idxOS] == null ? '' : row[idxOS])) === id_os)
    .map(row => {
      const obj = {};
      header.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });

  return { status:'ok', equipamentos: equips };
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
// === INSERIR APÓS função getEquipamentos ===
function garantirColunas(aba, colunasNecessarias) {
  const ultimaColuna = Math.max(1, aba.getLastColumn());
  const headerRange = aba.getRange(1, 1, 1, ultimaColuna);
  const header = headerRange.getValues()[0].map(h => String(h).trim());
  const existentes = {};
  header.forEach(h => { if (h) existentes[h] = true; });

  const novas = [];
  (colunasNecessarias || []).forEach(c => {
    if (!existentes[c]) {
      novas.push(c);
      existentes[c] = true;
    }
  });

  if (novas.length) {
    aba.getRange(1, header.length + 1, 1, novas.length).setValues([novas]);
  }
}

// ── HELPERS DRIVE ───────────────────────────────────────────────────────
function sanitizeFileName(name) {
  return String(name || 'arquivo').replace(/[\/:*?"<>|\\]/g, '-').replace(/\s+/g, '_').substring(0, 120);
}

function getOrCreateFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getOrCreateDrivePath(pathParts) {
  let folder = DriveApp.getRootFolder();
  for (const part of pathParts) {
    folder = getOrCreateFolder(folder, part);
  }
  return folder;
}

function dataUrlToBlob(dataUrl, nomeArquivo) {
  const b64 = dataUrl.split(',').pop();
  const bytes = Utilities.base64Decode(b64);
  return Utilities.newBlob(bytes, 'image/jpeg', sanitizeFileName(nomeArquivo) + '.jpg');
}

// === SUBSTITUIÇÃO DE salvarFotosDrive ===
function salvarFotosDrive(idVisita, idEquip, tag, fotos) {
  const resp = {
    drive_folder_id:    '',
    drive_folder_url:   '',
    primeira_foto_url:  '',
    quantidade_fotos:   0,
    fotos_salvas:       [],
    fotos_com_erro:     [],
  };
  if (!Array.isArray(fotos) || !fotos.length) return resp;

  const ym = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM');
  const safeTag = sanitizeFileName(tag || idEquip || 'SEM_TAG');
  const safeVisita = sanitizeFileName(idVisita || 'SEM_VISITA');

  const folder = getOrCreateDrivePath(['ColectTap_Fotos', ym, '[' + safeVisita + ']', '[' + sanitizeFileName(idEquip || safeTag) + ']']);

  if (DRIVE_LINK_PUBLICO) {
    try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
  }

  resp.drive_folder_id  = folder.getId();
  resp.drive_folder_url = folder.getUrl();

  fotos.forEach(f => {
    try {
      const key    = String(f.key    || 'foto');
      const secao  = String(f.secao  || 'geral');
      const dataUrl = String(f.dataUrl || '');
      if (!dataUrl || !dataUrl.startsWith('data:')) throw new Error('dataUrl inválida ou ausente');

      const nome = `${safeTag}_${secao}_${key}_${sanitizeFileName(idEquip || 'SEM_EQUIP')}`;
      const existing = folder.getFilesByName(nome + '.jpg');
      let arq;
      if (existing.hasNext()) { arq = existing.next(); }
      else { const blob = dataUrlToBlob(dataUrl, nome); arq = folder.createFile(blob); }

      if (DRIVE_LINK_PUBLICO) {
        try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
      }

      // Metadados apenas — NUNCA salvar base64 no Sheets
      resp.fotos_salvas.push({
        key:        key,
        label:      f.label || key,
        secao:      secao,
        campo_ref:  f.campo_ref || key,
        origem:     f.origem || '',
        created_at: f.created_at || new Date().toISOString(),
        id_equipamento_colect: f.id_equipamento_colect || idEquip || '',
        file_id:    arq.getId(),
        file_url:   arq.getUrl(),
        w: f.w || 0,
        h: f.h || 0,
      });
    } catch (err) {
      resp.fotos_com_erro.push({ key: f && f.key, erro: err.message });
      logErro('salvarFotosDrive', err.message, JSON.stringify({ idVisita, idEquip, key: f && f.key }));
    }
  });

  resp.quantidade_fotos = resp.fotos_salvas.length;
  if (resp.fotos_salvas.length) resp.primeira_foto_url = resp.fotos_salvas[0].file_url;
  return resp;
}

// === INSERIR APÓS função salvarFotosDrive ===
function gerarConsultaCliente() {
  const origem = getOuCriarAba(ABA_EQUIP);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let destino = ss.getSheetByName('CONSULTA_CLIENTE');
  if (!destino) destino = ss.insertSheet('CONSULTA_CLIENTE');

  const headers = [
    'Cliente','OS','TAG','Tipo','Fabricante','Ano Fabricação','Local','Setor',
    'Enquadra NR13','Situação NR13','Categoria','Fluido','Classe Fluido','Volume',
    'PMTA','Última Inspeção','Próxima Insp. Externa','Próxima Insp. Interna',
    'Vencimento Manômetro','Vencimento PSV','Situação Documental',
    'Documentos Pendentes','Pendências de Campo','Observações','Link Fotos',
    'Fluxo Coleta','Status Campo','Status Docs','Pendências Campo','Pendências Documentais'
  ];

  const values = origem.getDataRange().getValues();
  const srcH = values.length ? values[0].map(h => String(h)) : [];
  const idx = n => srcH.indexOf(n);
  const get = (r, n) => (idx(n) >= 0 ? r[idx(n)] : '');

  const linhas = values.slice(1).map(r => [
    get(r,'cliente'), get(r,'numero_os'), get(r,'tag'), get(r,'tipo'), get(r,'fabricante'),
    get(r,'ano_fabricacao'), get(r,'localizacao'), get(r,'setor'), get(r,'enquadra_nr13'),
    get(r,'situacao_nr13'), get(r,'categoria'), get(r,'fluido'), get(r,'classe_fluido'),
    get(r,'volume'), get(r,'pmta'), get(r,'ano_ultima_inspecao'), get(r,'proxima_insp_externa'),
    get(r,'proxima_insp_interna'), get(r,'venc_manometro'), get(r,'venc_valvula'),
    get(r,'status_documentacao'), get(r,'documentos_ausentes'), get(r,'pendencias_json'),
    [get(r,'obs_gerais'), get(r,'obs_inspetor')].filter(Boolean).join(' | '), get(r,'drive_folder_url'),
    get(r,'modo_coleta_inicial'), get(r,'status_coleta_campo'), get(r,'status_coleta_documentos'),
    get(r,'pendencias_campo'), get(r,'pendencias_documentais')
  ]);

  destino.clearContents();
  destino.getRange(1,1,1,headers.length).setValues([headers]);
  if (linhas.length) destino.getRange(2,1,linhas.length,headers.length).setValues(linhas);

  const cab = destino.getRange(1,1,1,headers.length);
  cab.setBackground('#1a3a6b').setFontColor('#ffffff').setFontWeight('bold');
  destino.setFrozenRows(1);
  if (destino.getFilter()) destino.getFilter().remove();
  destino.getRange(1,1,Math.max(1,linhas.length+1),headers.length).createFilter();

  return { status:'ok', registros:linhas.length, aba:'CONSULTA_CLIENTE' };
}

function serializarChecks(checks, prefixo, checkLabels) {
  return Object.entries(checks)
    .filter(([k, v]) => v && k.startsWith(prefixo))
    .map(([k]) => {
      if (checkLabels && checkLabels[k]) return checkLabels[k];
      return k.replace(prefixo+'_','').replace(/_/g,' ');
    })
    .join(' | ');
}

function toJsonCell(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch(e) { return ''; }
}

function formatarData(d) {
  if (!d) return '';
  if (d instanceof Date) return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy');
  return String(d);
}

function getCabecalhoEquip() {
  return [
    // OS
    'id_os','numero_os','id_cliente','cliente','id_inspetor','inspetor',
    'data_coleta','data_registro','app_version',
    // A
    'tag','tipo','fabricante','numero_equip','ano_fabricacao','categoria',
    'codigo_projeto','ano_edicao_codigo_projeto','localizacao','placa_indelevel','necessita_tag','obs_ident',
    // B
    'pmta','pressao_trabalho','pressao_teste','temperatura','fluido',
    'classe_fluido','ja_inspecionado','ano_ultima_inspecao','tipo_ultima_inspecao',
    // C
    'diametro','comprimento','altura','volume','espessura_parede','material',
    'bitola','classe_pressao','isolamento','possui_isolamento',
    'capacidade_vapor','area_aquecimento','combustivel','pressao_projeto',
    'teto','revestimento',
    // D
    'possui_manometro','manometro_calibrado','cert_manometro','venc_manometro','motivo_nao_calibracao_man',
    'possui_valvula','valvula_calibrada','cert_valvula','venc_valvula','pa_valvula','motivo_nao_calibracao_psv',
    'possui_purgador','possui_dcbi','possui_valvula_retencao',
    'possui_indicador_nivel','possui_pressostato',
    // E
    'documentos_presentes',
    // F
    'trabalho_altura','necessita_th','espaco_confinado','necessita_scaffold',
    'ensaios_nd_necessarios','processo','risco_observado',
    // G
    'obs_gerais','obs_inspetor',
    // v1.8 fluxo campo/documento
    'modo_coleta_inicial','status_coleta_campo','status_coleta_documentos',
    'pendencias_campo','pendencias_documentais','origem_respostas_json','conflitos_json',
    'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo',
  ];
}

// ════════════════════════════════════════════════════════════════════════
// ESTRUTURA DAS ABAS — CRIAÇÃO AUTOMÁTICA
// ════════════════════════════════════════════════════════════════════════
function garantirAbas() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // INSPETORES
  let aba = ss.getSheetByName(ABA_INSPETORES);
  if (!aba) {
    aba = ss.insertSheet(ABA_INSPETORES);
    aba.appendRow(['id_inspetor','nome','pin','ativo','email','cargo']);
    aba.appendRow(['INS-001','Inspetor Demo','1234','true','demo@engetap.com.br','Inspetor NR-13']);
    aba.appendRow(['INS-002','Fernando Guimarães','6789','true','fernando@engetap.com.br','Eng. Inspeção']);
    formatarCabecalho(aba);
  }

  // TECNICOS
  aba = ss.getSheetByName(ABA_TECNICOS);
  if (!aba) {
    aba = ss.insertSheet(ABA_TECNICOS);
    aba.appendRow(['id_tecnico','nome','pin','ativo','email','cargo','criado_em']);
    aba.appendRow(['TEC-001','Técnico Demo','9999','true','tecnico@engetap.com.br','Técnico NR-13', new Date().toISOString()]);
    formatarCabecalho(aba);
  }

  // CLIENTES_LEADS
  aba = ss.getSheetByName(ABA_CLIENTES_LEADS);
  if (!aba) {
    aba = ss.insertSheet(ABA_CLIENTES_LEADS);
    aba.appendRow(['id_cliente','nome','cnpj','contato','email','telefone','status_lead','criado_em']);
    aba.appendRow(['CLI-ING','Inglesa — Mineração','00.000.000/0001-00','João Silva','joao@inglesa.com.br','31 99999-0001','cliente', new Date().toISOString()]);
    aba.appendRow(['CLI-FAR','Farmax Farmacêutica','11.111.111/0001-11','Maria Souza','maria@farmax.com.br','31 99999-0002','lead', new Date().toISOString()]);
    formatarCabecalho(aba);
  }

  // OS_COLECT
  aba = ss.getSheetByName(ABA_OS);
  if (!aba) {
    aba = ss.insertSheet(ABA_OS);
    aba.appendRow(['id_os','numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','criado_em','os_status']);
    aba.appendRow(['LNR-2026-001','LNR-001','CLI-ING','Inglesa — Mineração','Levantamento NR-13 completo','2026-05-13','ativa','', new Date().toISOString()]);
    aba.appendRow(['LNR-2026-002','LNR-002','CLI-FAR','Farmax Farmacêutica','Inspeção inicial NR-13','2026-05-10','ativa','', new Date().toISOString()]);
    formatarCabecalho(aba);
  }

  // EQUIPAMENTOS_NR13
  aba = ss.getSheetByName(ABA_EQUIP);
  if (!aba) {
    aba = ss.insertSheet(ABA_EQUIP);
    aba.appendRow(getCabecalhoEquip());
    formatarCabecalho(aba);
  }

  // CONSULTA_CLIENTE
  aba = ss.getSheetByName(ABA_CONSULTA);
  if (!aba) {
    aba = ss.insertSheet(ABA_CONSULTA);
    aba.appendRow(['Cliente','OS','TAG','Tipo','Enquadra NR13','Situação NR13','Documentação','Drive Link']);
    formatarCabecalho(aba);
  }

  // LOG
  aba = ss.getSheetByName(ABA_LOG);
  if (!aba) {
    aba = ss.insertSheet(ABA_LOG);
    aba.appendRow(['timestamp','funcao','erro','contexto']);
    formatarCabecalho(aba);
  }

  // CONFIG
  aba = ss.getSheetByName(ABA_CONFIG);
  if (!aba) {
    aba = ss.insertSheet(ABA_CONFIG);
    aba.appendRow(['chave','valor','descricao']);
    aba.appendRow(['DRIVE_LINK_PUBLICO','true','Se true, arquivos do Drive são públicos (leitura)']);
    aba.appendRow(['APP_VERSION', APP_VERSION, 'Versão atual do GAS']);
    formatarCabecalho(aba);
  }
}

function formatarCabecalho(aba) {
  try {
    const cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn());
    cabecalho.setBackground('#1a3a6b');
    cabecalho.setFontColor('#ffffff');
    cabecalho.setFontWeight('bold');
    cabecalho.setFontSize(9);
    aba.setFrozenRows(1);
  } catch(e) { /* ignora se falhar */ }
}

function getOuCriarAba(nome) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    garantirAbas();
    aba = ss.getSheetByName(nome);
  }
  return aba;
}

// ════════════════════════════════════════════════════════════════════════
// LOG DE ERROS
// ════════════════════════════════════════════════════════════════════════
function logErro(funcao, erro, contexto) {
  try {
    const aba = getOuCriarAba(ABA_LOG);
    aba.appendRow([new Date().toISOString(), funcao, erro, contexto || '']);
  } catch(e) { /* silencia erro no log */ }
}

// ════════════════════════════════════════════════════════════════════════
// FUNÇÃO UTILITÁRIA — executar manualmente para inicializar a planilha
// Vá em: Executar → Executar função → inicializarPlanilha
// ════════════════════════════════════════════════════════════════════════
function inicializarPlanilha() {
  garantirAbas();
  SpreadsheetApp.getUi().alert('✅ Planilha ColectTap inicializada com sucesso!\n\nAbas criadas:\n• INSPETORES\n• OS_COLECT\n• EQUIPAMENTOS_NR13\n• LOG\n\nEdite as abas para adicionar seus inspetores e OS reais.');
}

// ════════════════════════════════════════════════════════════════════════
// INSPETORES (usuários do Field) — CRUD completo
// getTecnicos é alias para getInspetores (compatibilidade Manager)
// salvarTecnico é alias para salvarInspetor (compatibilidade Manager)
// ════════════════════════════════════════════════════════════════════════
function getInspetores() {
  const aba = getOuCriarAba(ABA_INSPETORES);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'ok', tecnicos:[], inspetores:[] };
  const header = dados[0];
  const inspetores = dados.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    header.forEach((h, i) => { obj[norm(h)] = String(r[i] == null ? '' : r[i]); });
    return obj;
  });
  return { status:'ok', inspetores, tecnicos: inspetores }; // tecnicos alias para compat
}

function getTecnicos() {
  return getInspetores(); // retorna INSPETORES por compatibilidade
}

function salvarInspetor(params) {
  const pin = norm(params.pin).replace(/\D/g,'').slice(0,4);
  if (!pin || pin.length !== 4) return { status:'erro', mensagem:'PIN deve ter 4 dígitos' };
  if (!norm(params.nome)) return { status:'erro', mensagem:'Nome obrigatório' };

  const aba = getOuCriarAba(ABA_INSPETORES);
  const dados = aba.getDataRange().getValues();
  if (dados.length === 0 || norm(dados[0][0]) === '') {
    aba.appendRow(['id_inspetor','nome','pin','ativo','email','cargo']);
    formatarCabecalho(aba);
  }

  // Verificar PIN duplicado
  const header = aba.getDataRange().getValues()[0].map(norm);
  const pinIdx = header.indexOf('pin');
  const ativoIdx = header.indexOf('ativo');
  const idIdx = header.indexOf('id_inspetor');
  const existentes = aba.getDataRange().getValues().slice(1);
  for (const row of existentes) {
    if (!row[idIdx]) continue;
    const pinExist = normPin(row[pinIdx]);
    const ativo = norm(row[ativoIdx]).toLowerCase();
    const inativo = ativo === 'false' || ativo === 'inativo' || ativo === '0';
    if (pinExist === pin && !inativo && norm(row[idIdx]) !== norm(params.id_inspetor || '')) {
      return { status:'erro', mensagem:'PIN já cadastrado para outro inspetor ativo' };
    }
  }

  const id = norm(params.id_inspetor) || ('INS-' + Utilities.getUuid().substring(0,8).toUpperCase());
  const now = new Date().toISOString();
  const row = [id, norm(params.nome), pin, 'true', norm(params.email || ''), norm(params.cargo || 'Inspetor NR-13')];
  const next = aba.getLastRow() + 1;
  aba.getRange(next, 1, 1, row.length).setNumberFormat('@');
  aba.getRange(next, 1, 1, row.length).setValues([row]);
  return { status:'ok', id_inspetor: id };
}

function salvarTecnico(params) {
  // Redireciona para salvarInspetor (técnicos de campo = inspetores)
  return salvarInspetor({ ...params, id_inspetor: params.id_inspetor || params.id_tecnico });
}

function atualizarInspetor(params) {
  const id = norm(params.id_inspetor || params.id_tecnico);
  if (!id) return { status:'erro', mensagem:'id_inspetor obrigatório' };

  const aba = getOuCriarAba(ABA_INSPETORES);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'Inspetor não encontrado' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_inspetor');
  if (idIdx < 0) return { status:'erro', mensagem:'Estrutura da aba INSPETORES inválida' };

  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'Inspetor não encontrado: ' + id };

  // Verificar PIN duplicado se foi alterado
  if (params.pin) {
    const pin = normPin(params.pin);
    if (pin.length !== 4) return { status:'erro', mensagem:'PIN deve ter 4 dígitos' };
    const pinIdx = header.indexOf('pin');
    const ativoIdx = header.indexOf('ativo');
    for (let i = 1; i < dados.length; i++) {
      const rowId = norm(dados[i][idIdx]);
      if (rowId === id) continue;
      const pinExist = normPin(dados[i][pinIdx]);
      const ativo = norm(dados[i][ativoIdx]).toLowerCase();
      const inativo = ativo === 'false' || ativo === 'inativo' || ativo === '0';
      if (pinExist === pin && !inativo) return { status:'erro', mensagem:'PIN já cadastrado para outro inspetor ativo' };
    }
  }

  const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];
  const updFields = { nome:'nome', pin:'pin', ativo:'ativo', email:'email', cargo:'cargo' };
  Object.entries(updFields).forEach(([k, col]) => {
    const idx = header.indexOf(col);
    if (params[k] !== undefined && idx >= 0) {
      rowData[idx] = k === 'pin' ? normPin(params[k]) : norm(params[k]);
    }
  });
  aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  return { status:'ok', id_inspetor: id };
}

function excluirInspetor(params) {
  const id = norm(params.id_inspetor || params.id_tecnico);
  if (!id) return { status:'erro', mensagem:'id_inspetor obrigatório' };

  const aba = getOuCriarAba(ABA_INSPETORES);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'Inspetor não encontrado' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_inspetor');
  if (idIdx < 0) return { status:'erro', mensagem:'Estrutura inválida' };

  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'Inspetor não encontrado: ' + id };

  aba.deleteRow(rowIndex);
  return { status:'ok', id_inspetor: id, deletado: true };
}

// ════════════════════════════════════════════════════════════════════════
// CLIENTES LEADS — CRUD completo
// ════════════════════════════════════════════════════════════════════════
function atualizarClienteLead(params) {
  const id = norm(params.id_cliente);
  if (!id) return { status:'erro', mensagem:'id_cliente obrigatório' };

  const aba = getOuCriarAba(ABA_CLIENTES_LEADS);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'Cliente não encontrado' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_cliente');
  if (idIdx < 0) return { status:'erro', mensagem:'Estrutura inválida' };

  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'Cliente não encontrado: ' + id };

  const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];
  const updFields = ['nome','cnpj','contato','email','telefone','status_lead'];
  updFields.forEach(k => {
    const idx = header.indexOf(k);
    if (params[k] !== undefined && idx >= 0) rowData[idx] = norm(params[k]);
  });
  aba.getRange(rowIndex, 1, 1, rowData.length).setNumberFormat('@');
  aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  return { status:'ok', id_cliente: id };
}

function excluirClienteLead(params) {
  const id = norm(params.id_cliente);
  if (!id) return { status:'erro', mensagem:'id_cliente obrigatório' };

  // Verificar OS vinculada
  const abaOS = getOuCriarAba(ABA_OS);
  const dadosOS = abaOS.getDataRange().getValues();
  if (dadosOS.length > 1) {
    const hOS = dadosOS[0].map(norm);
    const idCliOS = hOS.indexOf('id_cliente');
    if (idCliOS >= 0) {
      for (let i = 1; i < dadosOS.length; i++) {
        if (norm(dadosOS[i][idCliOS]) === id) {
          return { status:'erro', mensagem:'Cliente possui OS vinculada. Exclua ou reatribua as OS antes.' };
        }
      }
    }
  }

  const aba = getOuCriarAba(ABA_CLIENTES_LEADS);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'Cliente não encontrado' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_cliente');
  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'Cliente não encontrado: ' + id };
  aba.deleteRow(rowIndex);
  return { status:'ok', id_cliente: id, deletado: true };
}

// ════════════════════════════════════════════════════════════════════════
// OS COLECT — CRUD completo
// ════════════════════════════════════════════════════════════════════════
function atualizarOSColect(params) {
  const id = norm(params.id_os);
  if (!id) return { status:'erro', mensagem:'id_os obrigatório' };

  const aba = getOuCriarAba(ABA_OS);
  garantirColunas(aba, ['os_status']);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'OS não encontrada' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_os');
  if (idIdx < 0) return { status:'erro', mensagem:'Estrutura inválida' };

  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'OS não encontrada: ' + id };

  const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];
  const updFields = ['numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','os_status'];
  updFields.forEach(k => {
    const idx = header.indexOf(k);
    if (params[k] !== undefined && idx >= 0) rowData[idx] = norm(params[k]);
  });
  aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  return { status:'ok', id_os: id };
}

function excluirOSColect(params) {
  const id = norm(params.id_os);
  if (!id) return { status:'erro', mensagem:'id_os obrigatório' };

  const aba = getOuCriarAba(ABA_OS);
  garantirColunas(aba, ['os_status']);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'OS não encontrada' };

  const header = dados[0].map(norm);
  const idIdx = header.indexOf('id_os');
  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (norm(dados[i][idIdx]) === id) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { status:'erro', mensagem:'OS não encontrada: ' + id };
  aba.deleteRow(rowIndex);
  return { status:'ok', id_os: id, deletado: true };
}

// ════════════════════════════════════════════════════════════════════════
// MIGRAÇÃO DE ESTRUTURA
// ════════════════════════════════════════════════════════════════════════
function migrarEstrutura() {
  // Garantir colunas em INSPETORES
  const abaInsp = getOuCriarAba(ABA_INSPETORES);
  garantirColunas(abaInsp, ['id_inspetor','nome','pin','ativo','email','cargo']);

  // Garantir colunas em EQUIPAMENTOS_NR13 para não enquadrado
  const abaEquip = getOuCriarAba(ABA_EQUIP);
  garantirColunas(abaEquip, [
    'id_visita_colect','id_equipamento_colect','status_completude','sync_status',
    'enquadra_nr13','motivo_nao_enquadramento','descricao_nao_enquadramento',
    'acao_nao_enquadramento','fotos_json','drive_folder_url','drive_folder_id',
    'primeira_foto_url','quantidade_fotos','data_criacao','data_atualizacao',
    'status_revisao','obs_revisao','revisor','data_revisao',
    'modo_coleta_inicial','status_coleta_campo','status_coleta_documentos',
    'pendencias_campo','pendencias_documentais','origem_respostas_json','conflitos_json',
    'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo',
    'foto_capa_key',
  ]);

  // Atualizar CONFIG APP_VERSION
  try {
    const cfg = getOuCriarAba(ABA_CONFIG);
    const cfgDados = cfg.getDataRange().getValues();
    let versionRowIdx = -1;
    for (let i = 1; i < cfgDados.length; i++) {
      if (norm(cfgDados[i][0]) === 'APP_VERSION') { versionRowIdx = i + 1; break; }
    }
    if (versionRowIdx > 0) {
      cfg.getRange(versionRowIdx, 2).setValue(APP_VERSION);
    }
  } catch(e) {}
}

function getClientesLeads() {
  const aba = getOuCriarAba(ABA_CLIENTES_LEADS);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'ok', clientes:[] };
  const header = dados[0];
  const clientes = dados.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = String(r[i] == null ? '' : r[i]); });
    return obj;
  });
  return { status:'ok', clientes };
}

function salvarClienteLead(params) {
  const aba = getOuCriarAba(ABA_CLIENTES_LEADS);
  if (aba.getLastRow() === 0 || aba.getRange(1,1).getValue() === '') {
    aba.appendRow(['id_cliente','nome','cnpj','contato','email','telefone','status_lead','criado_em']);
    formatarCabecalho(aba);
  }
  const id = params.id_cliente || ('CLI-' + Utilities.getUuid().substring(0,8).toUpperCase());
  const now = new Date().toISOString();
  const row = [
    norm(id),
    norm(params.nome),
    norm(params.cnpj),
    norm(params.contato),
    norm(params.email),
    norm(params.telefone),
    norm(params.status_lead || 'lead'),
    now
  ];
  const next = aba.getLastRow() + 1;
  aba.getRange(next, 1, 1, row.length).setNumberFormat('@');
  aba.getRange(next, 1, 1, row.length).setValues([row]);
  return { status:'ok', id_cliente: id };
}

function salvarOSColect(params) {
  const aba = getOuCriarAba(ABA_OS);
  if (aba.getLastRow() === 0 || aba.getRange(1,1).getValue() === '') {
    aba.appendRow(['id_os','numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','criado_em','os_status']);
    formatarCabecalho(aba);
  }
  const id = params.id_os || ('OS-' + Utilities.getUuid().substring(0,8).toUpperCase());
  const now = new Date().toISOString();
  aba.appendRow([id, params.numero_os||'', params.id_cliente||'', params.cliente||'', params.descricao||'', params.data_abertura||now.substring(0,10), params.status||'ativa', params.id_inspetor_resp||'', now]);
  return { status:'ok', id_os: id };
}

function atualizarEquipamentoRevisao(params) {
  // Nunca usa salvarLevantamentoNR13 — só atualiza campos de revisão
  const id_equip = String(params.id_equipamento_colect || '').trim();
  if (!id_equip) return { status:'erro', mensagem:'id_equipamento_colect obrigatório' };

  const aba = getOuCriarAba(ABA_EQUIP);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return { status:'erro', mensagem:'Equipamento não encontrado' };

  const header = dados[0];
  const idxByName = {};
  header.forEach((h, i) => { idxByName[String(h)] = i; });

  let rowIndex = -1;
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][idxByName.id_equipamento_colect || 0] || '').trim() === id_equip) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex < 0) return { status:'erro', mensagem:'Equipamento não encontrado: ' + id_equip };

  const camposRevisao = ['revisao_engenharia','obs_revisao','status_revisao','revisor','data_revisao'];
  const nowIso = new Date().toISOString();

  // Garantir que as colunas existem
  garantirColunas(aba, [...camposRevisao, 'data_atualizacao']);

  // Re-ler header após garantirColunas
  const headerAtual = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const idxAtual = {};
  headerAtual.forEach((h, i) => { idxAtual[String(h)] = i; });

  const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];

  camposRevisao.forEach(k => {
    if (params[k] !== undefined && idxAtual[k] >= 0) rowData[idxAtual[k]] = params[k];
  });
  if (idxAtual.data_atualizacao >= 0) rowData[idxAtual.data_atualizacao] = nowIso;
  if (idxAtual.data_revisao >= 0 && !rowData[idxAtual.data_revisao]) rowData[idxAtual.data_revisao] = nowIso;

  aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  return { status:'ok', id_equipamento_colect: id_equip, linha: rowIndex };
}


// ════════════════════════════════════════════════════════════════════════
// GET FOTO BASE64 — retorna uma foto do Drive como base64 para o Manager
// ════════════════════════════════════════════════════════════════════════
function getFotoBase64(params) {
  const fileId = norm(params.file_id);
  if (!fileId) return { status: 'erro', mensagem: 'file_id obrigatório' };
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    const mimeType = blob.getContentType() || 'image/jpeg';
    return { status: 'ok', base64: base64, mimeType: mimeType };
  } catch (e) {
    logErro('getFotoBase64', e.message, JSON.stringify({ file_id: fileId }));
    return { status: 'erro', mensagem: 'Erro ao buscar foto: ' + e.message };
  }
}
