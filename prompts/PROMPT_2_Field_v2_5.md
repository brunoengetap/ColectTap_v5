# Prompt Codex 2 de 3 — ColectTap Field v2.5
**Arquivo base:** `ColectTap_v2_4.html`
**Arquivo de saída:** `ColectTap_v2_5.html`
**Objetivo:** Modificar a tela de exportação (`scr-t-export`) e a função `enviarGAS` para suportar:
  1. Seleção de foto da capa por equipamento (radio button)
  2. Checkboxes de seleção de equipamentos para envio parcial
  3. Botão "Enviar OS Completa" como sinal ao Manager
  4. Bump de versão

**REGRA FUNDAMENTAL:** O engine de PDF (`gerarPDFEquips`, `gerarCapa`, `hdrPage`, `ftr`, `gerarPDFUnico`, `gerarPDFEquip`) **NÃO DEVE SER TOCADO**. Apenas as funções e HTML listados abaixo são modificados.

---

## CONTEXTO GLOBAL

- `SES.equipamentos` é o array de equipamentos da sessão
- Cada equipamento pode ter `eq._fotos` (objeto com fotos em memória) e `eq.fotos_json` (string JSON com metadados do Drive após sync)
- `eq._salvo === true` ou `eq.status_completude === 'nao_enquadrado'` indica equipamento finalizável
- `eq.sync_status` pode ser `'local'`, `'synced'` ou será `'liberado_relatorio'` (novo)
- `normalizarFotosParaEnvio(eq)` retorna array de fotos prontas para envio ao GAS
- `gasPost(action, payload)` e `api(action, params)` são as funções de comunicação com o GAS
- `showLoading(msg)` / `hideLoading()` controlam o spinner global
- `showToast(msg, tipo)` exibe notificações
- `saveOSDraft()` persiste o estado da sessão
- `autosaveDraft(reason, force)` autosalva
- `goTo(id)` navega entre telas
- `DEMO_MODE` é boolean — em modo demo não faz chamadas reais ao GAS
- `esc(str)` sanitiza strings para HTML
- `APP_VERSION` é a constante de versão

---

## MUDANÇA 1 — HTML da tela `scr-t-export`

**Localização:** Substituir o conteúdo interno do `<div class="body">` dentro de `<div class="screen hidden" id="scr-t-export">`.

**HTML atual a ser substituído** (do `<div class="body">` até seu fechamento, antes do `</div>` que fecha o `scr-t-export`):
```html
  <div class="body">
    <div class="info-box" id="exp-summary">Equipamentos coletados: —</div>
    <p class="sec-label">Relatórios PDF</p>
    <div class="export-grid">
      <div class="export-btn pdf-btn" onclick="gerarPDFEquip('individual')">
        <div class="eb-icon">📄</div>
        <div class="eb-label">PDF Individual</div>
        <div class="eb-sub">Um arquivo por equipamento</div>
      </div>
      <div class="export-btn pdf-btn" onclick="gerarPDFEquip('completo')">
        <div class="eb-icon">📋</div>
        <div class="eb-label">PDF Completo</div>
        <div class="eb-sub">Todos em um arquivo</div>
      </div>
    </div>
    <p class="sec-label">Planilha de Dados</p>
    <div class="export-grid">
      <div class="export-btn xls-btn" onclick="exportarCSV()">
        <div class="eb-icon">📊</div>
        <div class="eb-label">Exportar CSV</div>
        <div class="eb-sub">Abrir no Excel</div>
      </div>
      <div class="export-btn upload-btn" onclick="enviarGAS()">
        <div class="eb-icon">☁️</div>
        <div class="eb-label">Enviar ao GAS</div>
        <div class="eb-sub">Salvar no Google Sheets</div>
      </div>
    </div>
    <div class="warn-box">💡 Gere o PDF individual de cada equipamento para entrega ao cliente. Use o PDF Completo para revisar tudo de uma vez.</div>
    <p class="sec-label">Selecionar equipamento para PDF Individual</p>
    <div id="exp-equip-list"></div>
  </div>
```

**HTML novo:**
```html
  <div class="body">
    <div class="info-box" id="exp-summary">Equipamentos coletados: —</div>

    <p class="sec-label">Relatórios PDF (Campo)</p>
    <div class="export-grid">
      <div class="export-btn pdf-btn" onclick="gerarPDFEquip('individual')">
        <div class="eb-icon">📄</div>
        <div class="eb-label">PDF Individual</div>
        <div class="eb-sub">Um arquivo por equipamento</div>
      </div>
      <div class="export-btn pdf-btn" onclick="gerarPDFEquip('completo')">
        <div class="eb-icon">📋</div>
        <div class="eb-label">PDF Completo</div>
        <div class="eb-sub">Todos em um arquivo</div>
      </div>
    </div>

    <p class="sec-label">Planilha de Dados</p>
    <div class="export-grid">
      <div class="export-btn xls-btn" onclick="exportarCSV()">
        <div class="eb-icon">📊</div>
        <div class="eb-label">Exportar CSV</div>
        <div class="eb-sub">Abrir no Excel</div>
      </div>
    </div>

    <div style="height:1px;background:var(--border);margin:16px 0"></div>

    <p class="sec-label">Enviar para Relatório Oficial</p>
    <div class="warn-box" style="margin-bottom:12px">
      ☁️ Selecione os equipamentos finalizados e envie para o escritório gerar o relatório NR-13 oficial. Após o envio, o equipamento fica marcado como <strong>liberado</strong> e pode ser reenviado se necessário.
    </div>

    <div id="exp-envio-list"></div>

    <div class="export-grid" style="margin-top:12px">
      <div class="export-btn upload-btn" onclick="enviarSelecionados()">
        <div class="eb-icon">📤</div>
        <div class="eb-label">Enviar Selecionados</div>
        <div class="eb-sub">Equipamentos marcados</div>
      </div>
      <div class="export-btn" style="border-color:var(--ok);background:rgba(34,197,94,.08)" onclick="enviarOSCompleta()">
        <div class="eb-icon">✅</div>
        <div class="eb-label">OS Completa</div>
        <div class="eb-sub">Marcar tudo como pronto</div>
      </div>
    </div>

    <div style="height:1px;background:var(--border);margin:16px 0"></div>
    <p class="sec-label">Selecionar equipamento para PDF Individual</p>
    <div id="exp-equip-list"></div>
  </div>
```

---

## MUDANÇA 2 — Adicionar CSS inline para os novos elementos

**Localização:** Dentro do `<style>` existente (antes do fechamento `</style>`), adicionar:

```css
.envio-card{border:1px solid var(--border);border-radius:12px;background:var(--surf);margin-bottom:10px;overflow:hidden}
.envio-card-hdr{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer}
.envio-card-hdr input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent);flex-shrink:0}
.envio-card-info{flex:1;min-width:0}
.envio-card-tag{font-family:var(--head);font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.envio-card-status{font-size:11px;color:var(--text2);margin-top:2px}
.envio-card-fotos{padding:0 12px 12px 40px;display:none}
.envio-card-fotos.open{display:block}
.foto-radio-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.foto-radio-row:last-child{border-bottom:none}
.foto-radio-row input[type=radio]{accent-color:var(--accent);flex-shrink:0}
.foto-thumb-mini{width:48px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0}
.foto-radio-label{font-size:12px;color:var(--text2);flex:1}
.pill-liberado{background:rgba(34,197,94,.15);color:#16a34a;border:1px solid rgba(34,197,94,.3)}
.pill-synced{background:rgba(14,165,233,.12);color:var(--accent)}
```

---

## MUDANÇA 3 — Substituir a função `renderExport`

**Localização:** A função `renderExport` existente (começa com `function renderExport() {` e termina com o `}`).

**Substituir por:**

```javascript
function renderExport() {
  document.getElementById('exp-os-label').textContent = SES.os ? esc(SES.os.numero_os + ' · ' + SES.os.cliente) : '—';
  const total = SES.equipamentos.length;
  const feitos = SES.equipamentos.filter(e => e._salvo).length;
  document.getElementById('exp-summary').textContent = `${feitos} equipamento(s) preenchido(s) de ${total} nesta OS.`;

  // ── Lista PDF individual (inalterada) ──
  const list = document.getElementById('exp-equip-list');
  if (!total) {
    list.innerHTML = '<div class="empty-state"><div class="ei">📋</div><p>Nenhum equipamento salvo nesta OS.<br>Salve ao menos um equipamento para exportar.</p></div>';
  } else {
    list.innerHTML = SES.equipamentos.map((eq, idx) => {
      const tag = eq.tag || eq.numero_equip || ('EQ-' + (idx+1));
      const naoEnq = eq._nao_enquadrado || eq.status_completude === 'nao_enquadrado';
      return `<div class="equip-card" onclick="gerarPDFUnico(${idx})">
        <div class="ec-tag">${esc(tag)}</div>
        <div class="ec-tipo">${esc(labelTipo(eq.tipo))}${eq.fabricante?' · '+esc(eq.fabricante):''}</div>
        <div class="ec-status">
          <span class="pill pill-blue">📄 Gerar PDF ${naoEnq ? '(Não enquadrado)' : 'Individual'}</span>
        </div>
      </div>`;
    }).join('');
  }

  // ── Lista de envio para relatório ──
  renderEnvioList();
}

function renderEnvioList() {
  const container = document.getElementById('exp-envio-list');
  if (!container) return;
  const elegíveis = SES.equipamentos.filter(e => e._salvo || e._nao_enquadrado || e.status_completude === 'nao_enquadrado');
  if (!elegíveis.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text2);text-align:center;padding:8px 0">Nenhum equipamento finalizado para envio.</p>';
    return;
  }

  container.innerHTML = elegíveis.map((eq, relIdx) => {
    const idx = SES.equipamentos.indexOf(eq);
    const tag = esc(eq.tag || eq.numero_equip || ('EQ-' + (idx+1)));
    const liberado = eq.sync_status === 'liberado_relatorio';
    const synced   = eq.sync_status === 'synced';
    const statusLabel = liberado ? '<span class="pill pill-liberado">✅ Liberado</span>'
                       : synced  ? '<span class="pill pill-synced">☁ Synced</span>'
                       :           '<span class="pill" style="background:var(--surf2)">📱 Local</span>';

    // Fotos disponíveis: prioriza _fotos em memória, fallback para fotos_json
    const fotosArr = _fotosDisponiveis(eq);
    const temFotos = fotosArr.length > 0;

    const fotosHtml = temFotos ? fotosArr.map(f => {
      const radioId = `radio_capa_${idx}_${esc(f.key)}`;
      const isSelected = eq.foto_capa_key === f.key;
      const thumbHtml = f.dataUrl
        ? `<img class="foto-thumb-mini" src="${f.dataUrl}" alt="">`
        : `<span style="font-size:18px">🖼️</span>`;
      return `<div class="foto-radio-row">
        <input type="radio" id="${radioId}" name="radio_capa_${idx}" value="${esc(f.key)}" ${isSelected ? 'checked' : ''}
          onchange="selecionarFotoCapa(${idx}, '${esc(f.key)}')">
        ${thumbHtml}
        <label for="${radioId}" class="foto-radio-label">${esc(f.label || f.key)}</label>
      </div>`;
    }).join('') : '<p style="font-size:12px;color:var(--text2);padding:4px 0">Nenhuma foto capturada.</p>';

    const fotosBtnLabel = temFotos ? `📷 Foto da capa (${fotosArr.length})` : '📷 Sem fotos';
    const checked = liberado ? 'checked' : '';

    return `<div class="envio-card" id="envio-card-${idx}">
      <div class="envio-card-hdr">
        <input type="checkbox" id="chk_envio_${idx}" ${checked} ${!liberado && !eq._salvo && !eq._nao_enquadrado ? 'disabled' : ''}>
        <div class="envio-card-info">
          <div class="envio-card-tag">${tag}</div>
          <div class="envio-card-status">${esc(labelTipo(eq.tipo))} · ${statusLabel}</div>
        </div>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 8px" onclick="toggleFotosEnvio(${idx})">${fotosBtnLabel}</button>
      </div>
      <div class="envio-card-fotos" id="fotos-envio-${idx}">
        <p style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px">Selecione a foto da capa:</p>
        ${fotosHtml}
      </div>
    </div>`;
  }).join('');
}

function _fotosDisponiveis(eq) {
  // Retorna array { key, label, dataUrl? } das fotos disponíveis para seleção de capa
  const out = [];
  const src = eq._fotos || {};
  Object.entries(src).forEach(([k, v]) => {
    if (k.endsWith('_label') || !v) return;
    if (v.dataUrl || v._hasData) {
      out.push({ key: v.key || k, label: src[(v.key||k)+'_label'] || v.label || LEGENDAS_TECNICAS[v.key||k] || k, dataUrl: v.dataUrl || null });
    }
  });
  // Fallback: fotos_json (sem dataUrl mas com key/label)
  if (!out.length && eq.fotos_json) {
    try {
      const parsed = JSON.parse(eq.fotos_json);
      if (Array.isArray(parsed)) parsed.forEach(f => out.push({ key: f.key, label: f.label || f.key, dataUrl: null }));
    } catch(e) {}
  }
  return out;
}

function toggleFotosEnvio(idx) {
  const el = document.getElementById('fotos-envio-' + idx);
  if (el) el.classList.toggle('open');
}

function selecionarFotoCapa(idx, key) {
  if (SES.equipamentos[idx]) {
    SES.equipamentos[idx].foto_capa_key = key;
    saveOSDraft();
  }
}
```

---

## MUDANÇA 4 — Adicionar funções `enviarSelecionados` e `enviarOSCompleta`

**Localização:** Adicionar imediatamente após a função `enviarGAS` existente (que permanece inalterada).

```javascript
// ═══════════════════════════════════════════════════════════════
// ENVIO SELETIVO PARA RELATÓRIO OFICIAL
// ═══════════════════════════════════════════════════════════════
async function enviarSelecionados() {
  if (DEMO_MODE) { showToast('Modo demo — GAS não configurado', 'warn'); return; }

  // Coletar índices selecionados
  const indices = SES.equipamentos
    .map((eq, idx) => {
      const chk = document.getElementById('chk_envio_' + idx);
      return chk && chk.checked ? idx : -1;
    })
    .filter(i => i >= 0);

  if (!indices.length) { showToast('Selecione ao menos um equipamento', 'warn'); return; }

  await _enviarParaRelatorio(indices, false);
}

async function enviarOSCompleta() {
  if (DEMO_MODE) { showToast('Modo demo — GAS não configurado', 'warn'); return; }

  const indices = SES.equipamentos
    .map((_, i) => i)
    .filter(i => {
      const eq = SES.equipamentos[i];
      return eq._salvo || eq._nao_enquadrado || eq.status_completude === 'nao_enquadrado';
    });

  if (!indices.length) { showToast('Nenhum equipamento finalizado para enviar', 'warn'); return; }

  await _enviarParaRelatorio(indices, true);
}

async function _enviarParaRelatorio(indices, osCompleta) {
  ensureVisitId();
  autosaveDraft('before_envio_relatorio', true);

  showLoading('Preparando envio…');
  await new Promise(r => setTimeout(r, 80));

  try {
    const equipsSelecionados = indices.map(idx => {
      const eq = SES.equipamentos[idx];
      const { _fotos, _salvo, _ts, ...rest } = eq;
      return {
        ...rest,
        id_equipamento_colect: eq.id_equipamento_colect || newEquipId(),
        fotos: normalizarFotosParaEnvio(eq),
        status_completude: eq.status_completude || (eq._nao_enquadrado ? 'nao_enquadrado' : 'salvo'),
        foto_capa_key: eq.foto_capa_key || '',
        sync_status: 'liberado_relatorio',
      };
    });

    const payload = {
      id_visita_colect: SES.id_visita_colect,
      id_os:       SES.os.id_os,
      numero_os:   SES.os.numero_os,
      id_cliente:  SES.os.id_cliente,
      cliente:     SES.os.cliente,
      id_inspetor: SES.inspetor.id_inspetor,
      inspetor:    SES.inspetor.nome,
      app_version: APP_VERSION,
      data_coleta: new Date().toISOString(),
      equipamentos: equipsSelecionados,
    };

    // Se OS completa, adicionar sinal de status da OS
    if (osCompleta) {
      payload.os_status_update = 'pronta_para_relatorio';
    }

    const payloadStr = JSON.stringify(payload);
    const sizeMB = payloadStr.length / (1024 * 1024);
    if (sizeMB > 35) {
      hideLoading();
      showToast('Payload muito grande. Reduza as fotos ou envie em partes.', 'err');
      return;
    }

    showLoading(`Enviando… (${sizeMB.toFixed(1)} MB)`);
    const r = await gasPost('salvarLevantamentoNR13', payload);
    hideLoading();

    if (r.status === 'ok') {
      // Atualizar sync_status dos equipamentos enviados
      indices.forEach((idx, relIdx) => {
        const eq = SES.equipamentos[idx];
        const ret = r.resultados && r.resultados[relIdx];
        eq.sync_status = 'liberado_relatorio';
        eq.synced_at = new Date().toISOString();
        if (ret) {
          if (ret.drive_folder_url) eq.drive_folder_url = ret.drive_folder_url;
          if (ret.drive_folder_id)  eq.drive_folder_id  = ret.drive_folder_id;
          if (ret.quantidade_fotos !== undefined) eq.quantidade_fotos = ret.quantidade_fotos;
          if (ret.fotos_json)       eq.fotos_json = ret.fotos_json;
          if (ret.primeira_foto_url) eq.primeira_foto_url = ret.primeira_foto_url;
        }
      });

      // Se OS completa, gravar os_status na OS via atualizarOSColect
      if (osCompleta && SES.os?.id_os) {
        try {
          await api('atualizarOSColect', {
            id_os: SES.os.id_os,
            os_status: 'pronta_para_relatorio',
          });
        } catch(e) {
          console.warn('Falha ao atualizar os_status da OS:', e.message);
        }
      }

      saveOSDraft();
      renderEnvioList(); // Atualizar UI com novos status
      const msg = osCompleta
        ? `✅ OS completa enviada! ${indices.length} equipamento(s) liberado(s) para relatório.`
        : `✅ ${indices.length} equipamento(s) enviado(s) para relatório.`;
      showToast(msg);
    } else {
      showToast('Erro GAS: ' + (r.mensagem || 'falha desconhecida'), 'err');
    }
  } catch(e) {
    hideLoading();
    showToast('Falha ao enviar: ' + e.message, 'err');
  }
}
```

---

## MUDANÇA 5 — Bump de versão

**Localização:** Constante `APP_VERSION` no topo do arquivo.

```javascript
// ANTES:
const APP_VERSION = '2.4';

// DEPOIS:
const APP_VERSION = '2.5';
```

E atualizar o texto visível da versão no cabeçalho se existir (buscar por `'v2.4'` ou `'ColectTap v2.4'` no HTML e atualizar para `v2.5`).

---

## CHECKLIST DE AUTO-AUDITORIA

- [ ] A tela `scr-t-export` contém o novo HTML com `exp-envio-list`, `enviarSelecionados()` e `enviarOSCompleta()`
- [ ] As seções PDF Individual e Exportar CSV ainda existem e chamam as mesmas funções de antes
- [ ] O botão "Enviar ao GAS" original foi **removido** do HTML (substituído pelos novos botões de envio seletivo)
- [ ] CSS das classes `.envio-card`, `.foto-radio-row`, `.pill-liberado`, `.pill-synced` foi adicionado ao `<style>`
- [ ] `renderExport` chama `renderEnvioList()` ao final
- [ ] `renderEnvioList` monta cards com checkbox + botão de fotos + radio de seleção de capa
- [ ] `_fotosDisponiveis(eq)` retorna array com fallback para `fotos_json`
- [ ] `toggleFotosEnvio(idx)` alterna a visibilidade do painel de fotos
- [ ] `selecionarFotoCapa(idx, key)` salva `eq.foto_capa_key` e chama `saveOSDraft()`
- [ ] `enviarSelecionados()` lê checkboxes, chama `_enviarParaRelatorio(indices, false)`
- [ ] `enviarOSCompleta()` coleta todos os índices elegíveis, chama `_enviarParaRelatorio(indices, true)`
- [ ] `_enviarParaRelatorio` inclui `foto_capa_key` e `sync_status: 'liberado_relatorio'` no payload
- [ ] Quando `osCompleta === true`, chama `api('atualizarOSColect', { id_os, os_status: 'pronta_para_relatorio' })` após o envio bem-sucedido
- [ ] Equipamentos enviados recebem `eq.sync_status = 'liberado_relatorio'` na memória
- [ ] `renderEnvioList()` é chamado após o envio para atualizar os pills de status
- [ ] A função `enviarGAS` original permanece **inalterada**
- [ ] O engine de PDF (`gerarPDFEquips`, `gerarCapa`, `hdrPage`, `ftr`) permanece **inalterado**
- [ ] `APP_VERSION` foi atualizado para `'2.5'`
