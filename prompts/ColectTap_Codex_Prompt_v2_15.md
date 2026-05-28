# ColectTap — Prompt Cirúrgico para Codex
## Versões-alvo: Field v2.15 · Manager v1.17 · GAS v1.16 (sem alteração)
**Data:** 2026-05-28 · **Arquivo de referência:** ColectTap_v2_14.html · ColectTap_Manager_v1_16.html · ColectTap_GAS_v1_15.js

---

## AUDITORIA COMPLETA — PROBLEMAS IDENTIFICADOS

### CAMPO → PDF: Dados coletados no Field que não aparecem no PDF do Manager

| # | Campo no Field | Variável no SES.dados | Chegada no GAS? | Aparece no PDF? |
|---|---|---|---|---|
| 1 | "Motivo da não calibração (Manômetro)" | `motivo_nao_calibracao_man` | ✅ GAS linha 408 | ❌ ausente no PDF |
| 2 | "Motivo da não calibração (PSV)" | `motivo_nao_calibracao_psv` | ✅ GAS linha 409 | ❌ ausente no PDF |
| 3 | "Motivo da inadequação da PSV" | `motivo_valvula_inadequada` | ❌ não mapeado no GAS | ❌ ausente no PDF |
| 4 | "Motivo da não avaliação da PSV" | `motivo_nao_avaliacao_valvula` | ❌ não mapeado no GAS | ❌ ausente no PDF |
| 5 | "Obs. sobre manômetro" (ausente/N/A) | `obs_manometro` | ❌ não mapeado no GAS | ❌ ausente no PDF |
| 6 | "Obs. sobre válvula de segurança" (ausente/N/A) | `obs_valvula` | ❌ não mapeado no GAS | ❌ ausente no PDF |
| 7 | "Adequação da PSV" | `valvula_adequada` | ❌ não mapeado no GAS | ❌ ausente no PDF |
| 8 | Temperatura de operação | `temperatura` | ✅ GAS linha 402 | ❌ **PDF não pergunta no Field** → campo existe no GAS e no PDF (seção 2) mas **não há pergunta no Field** |
| 9 | Isolamento | `isolamento` | ✅ GAS linha 413 (só tubulação) | ❌ **VP não pergunta no Field** |

### CAMPO → Field: Perguntas que faltam no Field

| # | Descrição | Onde incluir |
|---|---|---|
| A | Temperatura média de operação (campo numérico, °C) + foto se aplicável | Seção B (renderProjeto), após `pressao_teste`, para todos os tipos |
| B | Possui isolamento? (toggle Sim/Não/N/A) + foto da isolação | Seção B (renderProjeto), após campo temperatura, para vaso, caldeira e tanque |
| C | "Prontuário Reconstituído" como opção adicional na checklist de documentos | Seção E (renderDocumentacaoInteligente), na lista `docsTipo.vaso` e demais |
| D | Ano de edição do código de projeto (campo numérico livre) | Seção A (renderIdentificacao), logo após o select `codigo_projeto` |

### PDF do Manager — Bugs e melhorias

| # | Bug / Melhoria | Localização no Manager |
|---|---|---|
| P1 | Documentos presentes sem acentuação — `serializarChecks` no GAS faz `replace(/_/g,' ')` mas os slugs são criados por `item.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')`, que **remove acentos e ç** dos nomes dos documentos | GAS `serializarChecks` + Field `checkList` |
| P2 | Datas em formato americano (ISO `2026-05-27`) na capa e no header — `data_coleta` chega como string ISO e não é formatada com `fmtDate` | Manager `gerarCapaEngetap` e `gerarConteudoEquip` |
| P3 | "Scaffold" no PDF → traduzir para "Andaime" | Manager linha 1777: `{l:'Scaffold',v:eq.necessita_scaffold}` |
| P4 | "Ensaios END Necessários" → traduzir para "Ensaios Não Destrutivos Necessários" | Manager linha 1778: rótulo row1 |
| P5 | Legendas das fotos não centralizadas em relação à foto (alinhadas à esquerda: `imgX`) | Manager linha 1840: `doc.text(legLines[0]||'',imgX,y+imgH2+4)` |
| P6 | "Documentos Ausentes" aparecem no PDF mas não há dados válidos para esse campo (apenas documentos presentes são coletados) | Manager linhas 1772-1773: remover `row1` de Documentos Ausentes E Documentos a Receber |
| P7 | Temperatura e Isolamento: títulos no PDF são genéricos — ajustar labels para "Temperatura Média de Operação (°C)" e "Possui Isolamento?" | Manager linha 1756 |
| P8 | Prontuário Reconstituído: quando marcado, o PDF deve diferenciar "Prontuário do vaso (fabricante)" de "Prontuário Reconstituído" | Novo campo `prontuario_tipo` no Field + PDF |

### Persistência de fotos ao editar (bug crítico)

| # | Problema | Causa raiz |
|---|---|---|
| F1 | Ao editar equipamento já enviado ao Manager, as fotos somem do formulário | `editarEquip`: `SES.fotos = SES.dados._fotos \|\| {}` carrega objeto sem `dataUrl` (removido por `_stripDataUrls`). `renderFotoBlock` mostra botão câmera/galeria quando `!foto.dataUrl`, ignorando `thumbUrl` e `driveUrl` |

---

## INSTRUÇÕES CIRÚRGICAS PARA CODEX

### ARQUIVO 1: ColectTap_v2_14.html → gerar ColectTap_v2_15.html

**Bumpar versão:** alterar `APP_VERSION` para `'2.15'` e `<title>` para `ColectTap v2.15`.

---

#### FIX-F1 — Persistência de fotos ao editar (CRÍTICO)

**Problema:** `renderFotoBlock` só exibe a foto quando `foto.dataUrl` existe. Após salvar/enviar, os `dataUrl` são removidos pelo `_stripDataUrls`. Ao editar, `SES.fotos` tem apenas `thumbUrl` (miniatura 80px) e metadados.

**Correção cirúrgica em `renderFotoBlock`:**

Localizar o trecho atual (dentro de `renderFotoBlock`, no `<div style="padding:0 14px 12px">`):
```js
${foto && foto.dataUrl
  ? `<img src="${foto.dataUrl}" class="photo-thumb" style="margin-bottom:6px"><span class="photo-clear" onclick="clearFoto('${key}')">✕ Remover foto</span>`
  : `<div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','camera')">📷 Câmera</button><button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','galeria')">🖼️ Galeria</button></div>`
}
```

Substituir por:
```js
${foto && foto.dataUrl
  ? `<img src="${foto.dataUrl}" class="photo-thumb" style="margin-bottom:6px"><span class="photo-clear" onclick="clearFoto('${key}')">✕ Remover foto</span>`
  : foto && (foto.thumbUrl || foto.driveUrl)
    ? `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <img src="${foto.thumbUrl || ''}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;border:1px solid var(--border);${!foto.thumbUrl?'display:none':''}" onerror="this.style.display='none'">
        <div style="flex:1">
          <div style="font-size:11px;color:var(--ok);font-weight:600">✓ Foto enviada ao Drive</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">Substituir capturando nova foto</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','camera')">📷 Câmera</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','galeria')">🖼️ Galeria</button>
      </div>`
    : `<div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','camera')">📷 Câmera</button><button type="button" class="btn btn-ghost btn-sm" onclick="preparePhoto('${key}','${secaoId}','${key}','galeria')">🖼️ Galeria</button></div>`
}
```

Também, ao restaurar fotos em `editarEquip` (linha 1266), propagar `driveUrl` e `fileId` dos metadados salvos em `fotos_json` (retornado pelo GAS após upload). Adicionar após `SES.fotos = SES.dados._fotos || {};`:
```js
// Enriquecer fotos com driveUrl salvo em fotos_json (se disponível)
if (eq.fotos_json) {
  try {
    const parsed = JSON.parse(eq.fotos_json);
    if (Array.isArray(parsed)) {
      parsed.forEach(f => {
        if (f.key && SES.fotos[f.key]) {
          SES.fotos[f.key].driveUrl = f.file_url || SES.fotos[f.key].driveUrl || null;
          SES.fotos[f.key].fileId   = f.file_id  || SES.fotos[f.key].fileId  || null;
        } else if (f.key && !SES.fotos[f.key]) {
          // Foto enviada anteriormente mas sem metadado local — criar entrada mínima
          SES.fotos[f.key] = {
            key: f.key,
            label: f.label || LEGENDAS_TECNICAS[f.key] || f.key,
            driveUrl: f.file_url || null,
            fileId:   f.file_id  || null,
            _hasData: false,
            thumbUrl: null,
          };
        }
      });
    }
  } catch(e) {}
}
```

---

#### ADD-A — Temperatura média de operação e Isolamento no Field (Seção B)

Localizar `renderProjeto` e encontrar a linha:
```js
${toggle('ja_inspecionado', 'Já foi inspecionado anteriormente?')}`;
```

Inserir **antes** desse toggle, após `pressao_teste`:
```js
<p class="sec-label">Condições de Operação</p>
${campo('temperatura', 'Temperatura Média de Operação (°C)', 'number', {placeholder: 'Ex: 80 (deixe vazio se desconhecida)'})}
${t !== 'tubulacao' ? toggle('possui_isolamento', 'Possui isolamento térmico?', ['Sim','Não','N/A']) : ''}
```

Adicionar `'possui_isolamento'` ao set `TOGGLES_REATIVOS` para que ao selecionar "Sim" apareça o bloco de foto.

Na função `getFotosSecao`, adicionar chave `foto_isolamento` no array de `projeto`:
```js
projeto: ['foto_folha_dados_pmta', 'foto_isolamento'],
```

E adicionar legenda em `LEGENDAS_TECNICAS`:
```js
foto_isolamento: 'Foto do Isolamento Térmico',
```

A exibição condicional da foto do isolamento deve ser controlada em `renderProjeto`: só incluir `foto_isolamento` se `SES.dados.possui_isolamento === 'Sim'`.

No GAS, o campo `temperatura` já é mapeado (linha 402). O campo `possui_isolamento` precisa ser adicionado ao `campos` em `salvarEquipamento` e ao `getCabecalhoEquip`. O campo `isolamento` existente no GAS (linha 413, só tubulação) deve continuar para tubulação; para vaso/caldeira/tanque usar `possui_isolamento` como substituto.

---

#### ADD-B — Prontuário Reconstituído (Seção E)

Em `renderDocumentacaoInteligente`, localizar os arrays `docsTipo`:
```js
vaso: ['Prontuário do vaso (fabricante)','Registro de segurança',...],
caldeira: ['Prontuário da caldeira (fabricante)',...],
```

Substituir `'Prontuário do vaso (fabricante)'` por dois itens:
```js
'Prontuário do vaso (fabricante)',
'Prontuário do vaso (reconstituído)',
```

Idem para caldeira:
```js
'Prontuário da caldeira (fabricante)',
'Prontuário da caldeira (reconstituído)',
```

> **Nota:** como o `checkList` gera slugs via `.replace(/[^a-zA-Z0-9_]/g,'')`, os novos items precisam ter slugs distintos. O Field preserva os labels originais para `serializarChecks` reconstruir os nomes. A correção da acentuação (P1 abaixo) vai resolver o problema de exibição no PDF.

---

#### ADD-C — Ano de edição do Código de Projeto (Seção A)

Em `renderIdentificacao`, localizar o bloco do campo `codigo_projeto`:
```js
${mostrarOutro ? campo('codigo_projeto_outro', 'Código de Projeto (especificar)', 'text', ...) : ''}
```

Adicionar imediatamente após:
```js
${campo('ano_edicao_codigo_projeto', 'Ano de Edição do Código de Projeto', 'number', {placeholder: 'Ex: 2021'})}
```

No GAS (`salvarEquipamento`), adicionar mapeamento:
```js
ano_edicao_codigo_projeto: eq.ano_edicao_codigo_projeto || '',
```

E adicionar ao `getCabecalhoEquip` após `codigo_projeto`.

---

#### ADD-D — Condicionalidade de fotos por resposta (dispositivos de segurança)

Em `renderDispositivos`, a lógica atual já controla os campos de texto condicionalmente (campos de motivo só aparecem se `Não`). Estender a mesma lógica para as fotos:

Substituir o bloco de montagem de `fotosDisp`:
```js
const fotosDisp = [];
if (temMan === 'Sim') { fotosDisp.push('foto_manometro', 'foto_cert_man'); }
if (temPSV === 'Sim') { fotosDisp.push('foto_psv', 'foto_cert_psv'); }
```

Por:
```js
const fotosDisp = [];
if (temMan === 'Sim') {
  fotosDisp.push('foto_manometro');
  const manCalib = SES.dados.manometro_calibrado || '';
  if (manCalib === 'Sim') fotosDisp.push('foto_cert_man');
}
if (temPSV === 'Sim') {
  fotosDisp.push('foto_psv');
  const psvCalib = SES.dados.valvula_calibrada || '';
  if (psvCalib === 'Sim') fotosDisp.push('foto_cert_psv');
}
```

> Isso elimina a solicitação de foto do certificado quando o técnico indica que não está calibrado.

---

### ARQUIVO 2: ColectTap_Manager_v1_16.html → gerar ColectTap_Manager_v1_17.html

**Bumpar versão:** alterar `v1.16` para `v1.17` em todos os lugares do HTML (title, sidebar version, login subtitle).

---

#### FIX-P1 — Documentos presentes sem acentuação (CRÍTICO)

**Causa raiz confirmada:** O Field gera slugs com `item.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')` — isso remove ç, acentos. O GAS reconstrói os nomes com `.replace(/_/g,' ')` — mas os acentos já se perderam.

**Solução:** Usar uma abordagem diferente para serialização. Em vez de slugs a partir do texto, **serializar os labels originais diretamente** na função `checkList` do Field e na função `serializarChecks` do GAS.

**Parte Field (ColectTap_v2_14.html → v2.15):**

Localizar função `toggleCheck`:
```js
function toggleCheck(id) { markDirty(); debounceAutosave('check');
  const ci = document.getElementById('ci_'+id);
  const cb = document.getElementById('cb_'+id);
  if (!ci || !cb) return;
  const checked = ci.classList.toggle('checked');
  if (!SES.dados._checks) SES.dados._checks = {};
  SES.dados._checks[id] = checked;
}
```

Adicionar armazenamento do label original em `SES.dados._checkLabels`:
```js
function toggleCheck(id) { markDirty(); debounceAutosave('check');
  const ci = document.getElementById('ci_'+id);
  const cb = document.getElementById('cb_'+id);
  if (!ci || !cb) return;
  const checked = ci.classList.toggle('checked');
  if (!SES.dados._checks) SES.dados._checks = {};
  SES.dados._checks[id] = checked;
  // Preservar label original com acentuação para serialização correta
  if (!SES.dados._checkLabels) SES.dados._checkLabels = {};
  const labelEl = ci.querySelector('.check-label');
  if (labelEl) SES.dados._checkLabels[id] = labelEl.textContent.trim();
}
```

Adicionar restauração de `_checkLabels` em `restaurarCampos` — já é feito automaticamente pois `_checkLabels` fica em `SES.dados` que é serializado no localStorage.

**Parte GAS (ColectTap_GAS_v1_15.js → v1.16):**

Localizar função `serializarChecks`:
```js
function serializarChecks(checks, prefixo) {
  return Object.entries(checks)
    .filter(([k, v]) => v && k.startsWith(prefixo))
    .map(([k]) => k.replace(prefixo+'_','').replace(/_/g,' '))
    .join(' | ');
}
```

Substituir por versão que usa `_checkLabels` quando disponível:
```js
function serializarChecks(checks, prefixo, checkLabels) {
  return Object.entries(checks)
    .filter(([k, v]) => v && k.startsWith(prefixo))
    .map(([k]) => {
      // Prioridade: label original com acentuação
      if (checkLabels && checkLabels[k]) return checkLabels[k];
      return k.replace(prefixo+'_','').replace(/_/g,' ');
    })
    .join(' | ');
}
```

Atualizar as chamadas de `serializarChecks` para passar `eq._checkLabels`:
```js
documentos_presentes: serializarChecks(eq._checks || {}, 'doc', eq._checkLabels || {}),
// ...
ensaios_nd_necessarios: serializarChecks(eq._checks || {}, 'end', eq._checkLabels || {}),
```

Adicionar `_checkLabels` ao cabeçalho de colunas e ao mapeamento de campos do GAS (como campo de apoio, não precisa de coluna — pode serializar junto com `_checks`). **Solução alternativa mais simples:** passar `eq._checkLabels` como terceiro argumento sem necessidade de nova coluna na Sheet — apenas ajustar as chamadas acima.

---

#### FIX-P2 — Datas em formato americano no PDF

Em `gerarCapaEngetap` (linha ~1672):
```js
doc.text('Inspeção realizada em: '+ltx(s(eq.data_coleta||dataHoje)).substring(0,10), PW-MR, yBase+6, {align:'right'});
```

Substituir por:
```js
doc.text('Inspeção realizada em: '+fmtDate(eq.data_coleta||dataHoje), PW-MR, yBase+6, {align:'right'});
```

Em `gerarConteudoEquip` (linha ~1741):
```js
const osLbl=ltx((_relOSAtual?'OS: '+s(_relOSAtual.numero_os)+'  |  Cliente: '+s(eq.cliente):'')+
                '  |  Técnico: '+s(eq.inspetor)+'  |  Data: '+s(eq.data_coleta||'').substring(0,10));
```

Substituir `s(eq.data_coleta||'').substring(0,10)` por `fmtDate(eq.data_coleta)`.

---

#### FIX-P3 — Tradução "Scaffold" → "Andaime" e "Ensaios END" → "Ensaios Não Destrutivos"

Localizar em `gerarConteudoEquip`:
```js
y=row2(y,eq,[{l:'Espaço Confinado',v:eq.espaco_confinado},{l:'Scaffold',v:eq.necessita_scaffold}]);
y=row1(y,eq,'Ensaios END Necessários',eq.ensaios_nd_necessarios);
```

Substituir por:
```js
y=row2(y,eq,[{l:'Espaço Confinado',v:eq.espaco_confinado},{l:'Andaime',v:eq.necessita_scaffold}]);
y=row1(y,eq,'Ensaios Não Destrutivos Necessários',eq.ensaios_nd_necessarios);
```

---

#### FIX-P4 — Centralizar legendas das fotos em relação à foto

Localizar em `gerarConteudoEquip` dentro do bloco de fotos (`fotosEquip.forEach`):
```js
const legLines=doc.splitTextToSize(ltx(foto.label||foto.key),PW2-2);
doc.setFont('helvetica','italic');doc.setFontSize(7);doc.setTextColor(...REL_TEXT2);
doc.text(legLines[0]||'',imgX,y+imgH2+4);
```

Substituir por:
```js
const legLines=doc.splitTextToSize(ltx(foto.label||foto.key),PW2-2);
doc.setFont('helvetica','italic');doc.setFontSize(7);doc.setTextColor(...REL_TEXT2);
// Centralizar legenda em relação à foto (imgX + PW2/2 = centro da foto)
doc.text(legLines[0]||'', imgX + PW2/2, y+imgH2+4, {align:'center'});
```

---

#### FIX-P5 — Remover "Documentos Ausentes" do PDF

Localizar:
```js
y=row1(y,eq,'Documentos Presentes',eq.documentos_presentes);
y=row1(y,eq,'Documentos Ausentes',eq.documentos_ausentes);
y=row1(y,eq,'Documentos a Receber',eq.documentos_a_receber);
```

Substituir por:
```js
y=row1(y,eq,'Documentos Presentes',eq.documentos_presentes);
```

> Documentos ausentes e a receber são removidos pois o Field só coleta documentos presentes. A ausência não pode ser inferida como "documento ausente".

---

#### ADD-E — Incluir campos de texto condicionais dos dispositivos no PDF

Após o bloco de dispositivos de segurança em `gerarConteudoEquip`, localizar:
```js
y=row2(y,eq,[{l:'Válv. Retenção',v:eq.possui_valvula_retencao},{l:'Ind. Nível',v:eq.possui_indicador_nivel}]);
```

Adicionar logo após:
```js
// Campos condicionais — motivos e observações de dispositivos
if(s(eq.motivo_nao_calibracao_man))y=row1(y,eq,'Motivo da Não Calibração (Manômetro)',eq.motivo_nao_calibracao_man);
if(s(eq.obs_manometro))y=row1(y,eq,'Observação sobre Manômetro',eq.obs_manometro);
if(s(eq.motivo_nao_calibracao_psv))y=row1(y,eq,'Motivo da Não Calibração (PSV)',eq.motivo_nao_calibracao_psv);
if(s(eq.obs_valvula))y=row1(y,eq,'Observação sobre Válvula de Segurança',eq.obs_valvula);
if(s(eq.valvula_adequada))y=row1(y,eq,'PSV Adequada ao Equipamento',eq.valvula_adequada);
if(s(eq.motivo_valvula_inadequada))y=row1(y,eq,'Motivo da Inadequação da PSV',eq.motivo_valvula_inadequada);
if(s(eq.motivo_nao_avaliacao_valvula))y=row1(y,eq,'Motivo da Não Avaliação da PSV',eq.motivo_nao_avaliacao_valvula);
```

---

#### ADD-F — Temperatura e Isolamento no PDF (seção 2)

Localizar em `gerarConteudoEquip`:
```js
y=row2(y,eq,[{l:'P. Teste (kgf/cm²)',v:eq.pressao_teste},{l:'Temperatura (°C)',v:eq.temperatura}]);
```

Substituir por:
```js
y=row2(y,eq,[{l:'P. Teste (kgf/cm²)',v:eq.pressao_teste},{l:'Temperatura Média de Operação (°C)',v:eq.temperatura}]);
```

Localizar:
```js
y=row2(y,eq,[{l:'Esp. Parede (mm)',v:eq.espessura_parede},{l:'Isolamento',v:eq.isolamento}]);
```

Substituir por:
```js
y=row2(y,eq,[{l:'Esp. Parede (mm)',v:eq.espessura_parede},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
```

---

#### ADD-G — Prontuário Reconstituído diferenciado no PDF

O campo `documentos_presentes` já é uma string serializada com `|`. Nenhuma mudança adicional no PDF é necessária além de garantir que o label apareça corretamente (coberto pelo FIX-P1 acima). O PDF exibirá exatamente o texto que o técnico selecionou: "Prontuário do vaso (fabricante)" ou "Prontuário do vaso (reconstituído)".

---

#### ADD-H — Ano de edição do código de projeto no PDF (seção 1)

Localizar:
```js
y=row2(y,eq,[{l:'Localização / Setor',v:eq.localizacao||eq.setor},{l:'Código Projeto',v:normCodigo(eq.codigo_projeto)}]);
```

Substituir por:
```js
const codProjetoLabel = normCodigo(eq.codigo_projeto) + (s(eq.ano_edicao_codigo_projeto) ? ' ('+s(eq.ano_edicao_codigo_projeto)+')' : '');
y=row2(y,eq,[{l:'Localização / Setor',v:eq.localizacao||eq.setor},{l:'Código Projeto',v:codProjetoLabel}]);
```

---

### ARQUIVO 3: ColectTap_GAS_v1_15.js → gerar ColectTap_GAS_v1_16.js

#### FIX-G1 — serializarChecks com suporte a _checkLabels (ver FIX-P1 acima)

#### ADD-G2 — Novos campos no cabeçalho e mapeamento

Em `getCabecalhoEquip`, localizar a linha de `codigo_projeto`:
```
'codigo_projeto','localizacao','placa_indelevel','necessita_tag','obs_ident',
```

Substituir por:
```
'codigo_projeto','ano_edicao_codigo_projeto','localizacao','placa_indelevel','necessita_tag','obs_ident',
```

Em `campos` (dentro de `salvarEquipamento`), localizar:
```js
codigo_projeto: eq.codigo_projeto || '',
```

Adicionar após:
```js
ano_edicao_codigo_projeto: eq.ano_edicao_codigo_projeto || '',
```

Para `possui_isolamento` (novo para vaso/caldeira/tanque), localizar no `getCabecalhoEquip`:
```
'bitola','classe_pressao','isolamento',
```

Substituir por:
```
'bitola','classe_pressao','isolamento','possui_isolamento',
```

Em `campos`, localizar:
```js
classe_pressao: eq.classe_pressao || '', isolamento: eq.isolamento || '',
```

Adicionar após:
```js
possui_isolamento: eq.possui_isolamento || '',
```

Para campos condicionais de dispositivos que ainda não são mapeados, localizar:
```js
motivo_nao_calibracao_man: eq.motivo_nao_calibracao_man || '',
motivo_nao_calibracao_psv: eq.motivo_nao_calibracao_psv || '',
```

Adicionar após:
```js
obs_manometro: eq.obs_manometro || '',
obs_valvula: eq.obs_valvula || '',
valvula_adequada: eq.valvula_adequada || '',
motivo_valvula_inadequada: eq.motivo_valvula_inadequada || '',
motivo_nao_avaliacao_valvula: eq.motivo_nao_avaliacao_valvula || '',
```

Adicionar esses campos também ao `getCabecalhoEquip` após `motivo_nao_calibracao_psv`.

---

## CHECKLIST DE AUTO-AUDITORIA PARA CODEX

Antes de finalizar cada arquivo, verificar:

### Field v2.15
- [ ] `renderFotoBlock` exibe thumbUrl/driveUrl como indicador visual "Foto enviada ao Drive" com opção de substituir
- [ ] `editarEquip` propaga dados do `fotos_json` para `SES.fotos` ao carregar equipamento para edição
- [ ] `renderProjeto` contém campo `temperatura` e toggle `possui_isolamento` para vaso/caldeira/tanque
- [ ] `getFotosSecao('projeto')` inclui `foto_isolamento` condicionalmente
- [ ] `LEGENDAS_TECNICAS` contém `foto_isolamento`
- [ ] `renderDocumentacaoInteligente` lista `docsTipo.vaso` com "Prontuário do vaso (fabricante)" E "Prontuário do vaso (reconstituído)"
- [ ] `renderIdentificacao` contém campo `ano_edicao_codigo_projeto` após seletor de código de projeto
- [ ] `renderDispositivos` só solicita `foto_cert_man` quando manômetro calibrado = "Sim"; só solicita `foto_cert_psv` quando PSV calibrada = "Sim"
- [ ] `toggleCheck` preserva labels originais em `SES.dados._checkLabels`
- [ ] `APP_VERSION` = `'2.15'`

### Manager v1.17
- [ ] Datas no PDF usam `fmtDate()` — verificar capa e header de conteúdo
- [ ] "Scaffold" → "Andaime" no row2 da seção 5
- [ ] "Ensaios END Necessários" → "Ensaios Não Destrutivos Necessários"
- [ ] Legendas das fotos centralizadas com `{align:'center'}` e `x = imgX + PW2/2`
- [ ] "Documentos Ausentes" e "Documentos a Receber" removidos do PDF
- [ ] Seção 3 contém rows condicionais para `motivo_nao_calibracao_man`, `motivo_nao_calibracao_psv`, `obs_manometro`, `obs_valvula`, `valvula_adequada`, `motivo_valvula_inadequada`, `motivo_nao_avaliacao_valvula`
- [ ] Temperatura label: "Temperatura Média de Operação (°C)"
- [ ] Isolamento label: "Possui Isolamento?"
- [ ] Código de projeto exibe ano de edição se preenchido: `ASME Section VIII Div. 1 (2021)`
- [ ] Versão `v1.17` em todos os lugares

### GAS v1.16
- [ ] `serializarChecks` aceita terceiro parâmetro `checkLabels` e o usa quando disponível
- [ ] Chamadas de `serializarChecks` passam `eq._checkLabels || {}`
- [ ] Cabeçalho contém `ano_edicao_codigo_projeto`, `possui_isolamento`, `obs_manometro`, `obs_valvula`, `valvula_adequada`, `motivo_valvula_inadequada`, `motivo_nao_avaliacao_valvula`
- [ ] `campos` mapeia todos esses novos campos
- [ ] Versão bumped para `v1.16`

---

## OBSERVAÇÃO SOBRE `_checkLabels` NO GAS

O campo `_checkLabels` chegará dentro do objeto `eq` (dados do equipamento) enviado pelo Field para o GAS. O GAS já recebe o objeto completo via `eq._checks`. Apenas garantir que `eq._checkLabels` seja lido corretamente — ele não precisa de coluna própria na Sheet pois é apenas um dicionário auxiliar para reconstrução dos labels no momento da serialização, não para persistência.
