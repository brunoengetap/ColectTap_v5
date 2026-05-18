# PROMPT CODEX — ColectTap v2.2
## Implementação cirúrgica e incremental · Engetap NR-13

---

## CONTEXTO

Você está implementando melhorias no sistema **ColectTap** da Engetap, um formulário mobile de levantamento de campo para inspeção NR-13 de equipamentos sob pressão (vasos, caldeiras, tubulações, tanques).

---

## ESTRUTURA DO REPOSITÓRIO

O repositório é `github.com/brunoengetap/ColectTap_v5`, branch `main`. A estrutura de pastas é:

```
ColectTap_v5/
├── src/                        ← arquivos de trabalho (fontes atuais)
│   ├── ColectTap_v2_1.html
│   ├── ColectTap_GAS_v1_7.js
│   ├── ColectTap_Manager_v1_4.html
│   ├── GAS_properCare_v6 - initialize.js   ← NÃO TOCAR
│   └── pcf_v10.html                         ← NÃO TOCAR
├── output/                     ← arquivos gerados/entregues
│   └── (vazio — destino dos arquivos desta tarefa)
├── docs/                       ← documentação e changelogs
│   ├── CHANGES_v1_8.md
│   ├── CHANGES_v1_9.md
│   └── TEST_PLAN_v1_8.md
└── README.md
```

### Arquivos de entrada (leia em `src/`):
- `src/ColectTap_v2_1.html`
- `src/ColectTap_GAS_v1_7.js`
- `src/ColectTap_Manager_v1_4.html`

### Arquivos de saída (escreva em `output/` e `docs/`):
- `output/ColectTap_v2_2.html`
- `output/ColectTap_GAS_v1_8.js`
- `output/ColectTap_Manager_v1_5.html`
- `docs/CHANGES_v2_2.md`

**Nunca sobrescrever os arquivos em `src/`.** Os fontes originais são somente leitura nesta tarefa.

**Nunca tocar em** `GAS_properCare_v6 - initialize.js` **nem em** `pcf_v10.html` — são de outro sistema.

---

## INSTRUÇÕES DE COMMIT

Após gerar todos os arquivos com sucesso e executar a checklist de verificação final, fazer um único commit na branch `main` com:

**Mensagem de commit:**
```
feat(v2.2): fluxo campo/documento, gateway scroll, pendências por origem

- output/ColectTap_v2_2.html: tela T4b seleção de fluxo, getSecoesFluxo(),
  scroll gateway, modal pendências por origem, badge de modo, alternância
- output/ColectTap_GAS_v1_8.js: 10 novas colunas, toJsonCell, v1.8
- output/ColectTap_Manager_v1_5.html: filtros fluxo/pendência, 2 blocos pendências
- docs/CHANGES_v2_2.md: registro completo das mudanças

Compatibilidade total com registros antigos (modo_coleta_inicial ausente → 'campo')
Nenhuma rotina existente removida. URL GAS preservada.
```

**Arquivos a incluir no commit** (exatamente estes quatro, nada mais):
```
output/ColectTap_v2_2.html
output/ColectTap_GAS_v1_8.js
output/ColectTap_Manager_v1_5.html
docs/CHANGES_v2_2.md
```

Não adicionar ao commit: arquivos de `src/`, arquivos temporários, `.DS_Store`, arquivos de debug ou logs.

Se o Codex não tiver permissão de push direto, gerar os arquivos e deixar o commit preparado (`git add` + `git commit`) para push manual pelo desenvolvedor.

---

## REGRAS ABSOLUTAS — NÃO NEGOCIÁVEIS

1. **Não alterar a URL da GAS** — ela está em `const GAS_URL` no Field. Não tocar.
2. **Não remover nenhuma rotina existente**: login/PIN, autosave, saveOSDraft, fila pendente (colectGetPending/colectSavePendingQueue/colectFlushPending), upload de fotos, exportação PDF/CSV, envio ao GAS, proteção contra saída acidental (back-guard), edição de equipamento, exclusão de equipamento, revisão, geração de consulta cliente.
3. **Preservar compatibilidade total com registros antigos** que não possuam os novos campos — assumir `'campo'` como padrão silenciosamente.
4. **Não reescrever o sistema inteiro** — implementação cirúrgica. Cada alteração deve ser mínima e localizada.
5. **Não salvar base64 no localStorage** — regra já existente, manter.
6. **Não depender de posição fixa de colunas no GAS** — sempre usar header-by-name via `garantirColunas`.

---

## PARTE 1 — ColectTap_GAS_v1_8.js

### 1.1 Atualizar versão

```js
const APP_VERSION = 'ColectTap-GAS-v1.8';
```

### 1.2 Adicionar helper `toJsonCell`

Inserir após a função `serializarChecks`:

```js
function toJsonCell(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch(e) { return ''; }
}
```

### 1.3 Adicionar novas colunas em `migrarEstrutura`

Na chamada existente de `garantirColunas(abaEquip, [...])`, adicionar as seguintes colunas ao array (sem remover as existentes):

```
'modo_coleta_inicial'
'status_coleta_campo'
'status_coleta_documentos'
'pendencias_campo'
'pendencias_documentais'
'origem_respostas_json'
'conflitos_json'
'data_primeira_coleta_campo'
'data_primeira_coleta_documentos'
'data_ultima_alternancia_fluxo'
```

### 1.4 Atualizar `upsertEquipamentoNR13`

No objeto `campos` dentro de `upsertEquipamentoNR13`, adicionar após o bloco de campos existentes:

```js
modo_coleta_inicial:        eq.modo_coleta_inicial || '',
status_coleta_campo:        eq.status_coleta_campo || '',
status_coleta_documentos:   eq.status_coleta_documentos || '',
pendencias_campo:           eq.pendencias_campo || '',
pendencias_documentais:     eq.pendencias_documentais || '',
origem_respostas_json:      toJsonCell(eq.origem_respostas_json),
conflitos_json:             toJsonCell(eq.conflitos_json),
data_primeira_coleta_campo:       eq.data_primeira_coleta_campo || '',
data_primeira_coleta_documentos:  eq.data_primeira_coleta_documentos || '',
data_ultima_alternancia_fluxo:    eq.data_ultima_alternancia_fluxo || '',
```

### 1.5 Atualizar `gerarConsultaCliente`

Adicionar ao array `headers` as colunas novas:
`'Fluxo Coleta'`, `'Status Campo'`, `'Status Docs'`, `'Pendências Campo'`, `'Pendências Documentais'`

Adicionar nos `linhas.map(r => [...])` correspondentemente:
```js
get(r,'modo_coleta_inicial'),
get(r,'status_coleta_campo'),
get(r,'status_coleta_documentos'),
get(r,'pendencias_campo'),
get(r,'pendencias_documentais'),
```

Não alterar nenhuma coluna existente — apenas acrescentar ao final.

### 1.6 Adicionar as novas colunas ao `getCabecalhoEquip`

Adicionar ao array retornado por `getCabecalhoEquip()`:
```js
'modo_coleta_inicial','status_coleta_campo','status_coleta_documentos',
'pendencias_campo','pendencias_documentais','origem_respostas_json','conflitos_json',
'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo'
```

---

## PARTE 2 — ColectTap_v2_2.html

Esta é a parte mais complexa. Leia atentamente cada subseção antes de implementar.

---

### 2.1 Atualizar versão visual

- `<title>` → `ColectTap v2.2 — Levantamento NR-13 · Engetap`
- Subtexto da tela de login → `Engetap · NR-13 · v2.2`
- `const APP_VERSION` → `'ColectTap-v2.2'`

---

### 2.2 Criar helper `secAtualId()` e `secAtual()`

**CRÍTICO:** O código atual tem 14 referências diretas a `SECS[SES.secAtual]` espalhadas. Todas devem ser substituídas pelo helper. Nunca referenciar `SECS` diretamente após essa mudança.

Inserir logo após a definição do objeto `SES`:

```js
// ── HELPER: seção atual do fluxo ──────────────────────────────
function getSecoesFluxo() {
  const modo = SES.modoColetaInicial || (SES.dados && SES.dados.modo_coleta_inicial) || 'campo';

  const base = {
    enquadramento: { id:'enquadramento', label:'Enquadramento NR13',       icon:'⚖️',  pct:100, origem:'hibrido'   },
    ident:         { id:'ident',         label:'Identificação / Placa',    icon:'🏷️',  pct:15,  origem:'campo'     },
    docs:          { id:'docs',          label:'Documentação',             icon:'📁',  pct:30,  origem:'documento' },
    projeto:       { id:'projeto',       label:'Dados de Projeto',         icon:'📐',  pct:45,  origem:'documento' },
    dimensoes:     { id:'dimensoes',     label:'Dimensões',                icon:'📏',  pct:60,  origem:'campo'     },
    disp:          { id:'disp',          label:'Dispositivos de Seg.',     icon:'🔒',  pct:75,  origem:'campo'     },
    servico:       { id:'servico',       label:'Instalação e Acesso',      icon:'⚠️',  pct:88,  origem:'campo'     },
    obs:           { id:'obs',           label:'Obs / Fotos / Revisão',    icon:'📷',  pct:100, origem:'hibrido'   },
  };

  if (modo === 'documento') {
    return [
      { ...base.docs,          pct:13  },
      { ...base.projeto,       pct:26  },
      { ...base.enquadramento, pct:40  },
      { ...base.ident,         pct:55  },
      { ...base.dimensoes,     pct:68  },
      { ...base.disp,          pct:80  },
      { ...base.servico,       pct:91  },
      { ...base.obs,           pct:100 },
    ];
  }

  // modo === 'campo' (padrão)
  return [
    { ...base.ident,         pct:13  },
    { ...base.dimensoes,     pct:26  },
    { ...base.disp,          pct:40  },
    { ...base.servico,       pct:55  },
    { ...base.enquadramento, pct:68  },
    { ...base.obs,           pct:80  },
    { ...base.docs,          pct:91  },
    { ...base.projeto,       pct:100 },
  ];
}

function secAtualObj() {
  return getSecoesFluxo()[SES.secAtual] || getSecoesFluxo()[0];
}

function secAtualId() {
  return secAtualObj().id;
}
```

**Importante:** Manter o array `SECS` original no código por compatibilidade com qualquer referência que escape, mas ele não deve mais ser usado como fonte de verdade do fluxo. Renomear para `SECS_LEGADO` e deixar comentário explicativo.

---

### 2.3 Migrar todas as referências diretas a `SECS[SES.secAtual]`

Localizar e substituir **cada uma** das seguintes ocorrências:

| Linha original | Substituição |
|---|---|
| `SECS && SECS[SES.secAtual]` | `secAtualObj()` |
| `SECS[SES.secAtual].id` | `secAtualId()` |
| `salvarCampos(SECS[SES.secAtual].id)` | `salvarCampos(secAtualId())` |
| `SECS.length` | `getSecoesFluxo().length` |
| `const sec = SECS[SES.secAtual]` | `const sec = secAtualObj()` |
| `const secId = SECS[SES.secAtual].id` | `const secId = secAtualId()` |
| `SES.secAtual === 0 && isNaoEnquadrado()` | `secAtualId() === 'enquadramento' && isNaoEnquadrado()` |
| `SES.secAtual === SECS.length - 1` | `SES.secAtual === getSecoesFluxo().length - 1` |
| `body.innerHTML = renderSecao(SECS[SES.secAtual].id)` | `body.innerHTML = renderSecao(secAtualId())` |
| `restaurarCampos(SECS[SES.secAtual].id)` | `restaurarCampos(secAtualId())` |

Verificar também em `captureCurrentScreenState`, `setToggle`, `onCodigoProjetoChange`, `captureFotoFromInput`, `clearFoto`.

---

### 2.4 Atualizar `isNaoEnquadrado` e `secNext`

A função `isNaoEnquadrado()` não muda. Mas em `secNext`, o atalho de não enquadramento deve ser acionado quando a seção atual for `enquadramento` (independente de posição):

```js
// ANTES:
if (SES.secAtual === 0 && isNaoEnquadrado()) {

// DEPOIS:
if (secAtualId() === 'enquadramento' && isNaoEnquadrado()) {
```

Em `renderT5`, a lógica de "naoEnq" também deve usar `secAtualId() === 'enquadramento'`:

```js
// ANTES:
const naoEnq = SES.secAtual === 0 && isNaoEnquadrado();

// DEPOIS:
const naoEnq = secAtualId() === 'enquadramento' && isNaoEnquadrado();
```

---

### 2.5 Adicionar campos ao objeto `SES`

Adicionar ao objeto `SES` (sem remover campos existentes):

```js
modoColetaInicial: null,      // 'campo' | 'documento' — escolhido na tela T4b
origemRespostas: {},           // { campo_id: { origem: 'campo'|'documento'|'hibrido', ... } }
```

---

### 2.6 Nova tela `scr-t4b` — "Como deseja iniciar a coleta?"

Inserir o HTML desta tela imediatamente após o fechamento do `div#scr-t4`:

```html
<!-- ═══════════════════════════════════════════════════════ -->
<!-- T4B — MODO DE COLETA                                    -->
<!-- ═══════════════════════════════════════════════════════ -->
<div class="screen hidden" id="scr-t4b">
  <div class="hdr">
    <div class="hdr-back" onclick="goTo('t4')">‹</div>
    <div class="hdr-info">
      <div class="hdr-title" id="t4b-tipo-label">Equipamento</div>
      <div class="hdr-sub">Como deseja iniciar a coleta?</div>
    </div>
  </div>
  <div class="body" style="padding:20px 16px">
    <p class="sec-label" style="margin-bottom:16px">Escolha o ponto de partida da coleta</p>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="type-card" style="flex-direction:row;gap:16px;padding:22px 18px;align-items:flex-start;text-align:left"
           onclick="selecionarModoColeta('campo')">
        <div style="font-size:36px;flex-shrink:0">🔧</div>
        <div>
          <div class="tc-name" style="font-size:18px;margin-bottom:6px">Estou próximo ao equipamento</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.5">
            Priorizar placa, TAG, dimensões, dispositivos, instalação, acesso, condição visual e fotos.
          </div>
        </div>
      </div>
      <div class="type-card" style="flex-direction:row;gap:16px;padding:22px 18px;align-items:flex-start;text-align:left"
           onclick="selecionarModoColeta('documento')">
        <div style="font-size:36px;flex-shrink:0">📁</div>
        <div>
          <div class="tc-name" style="font-size:18px;margin-bottom:6px">Estou com a documentação em mãos</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.5">
            Priorizar prontuário, relatórios, certificados, projetos, dados de projeto, histórico e vencimentos.
          </div>
        </div>
      </div>
    </div>
    <div class="info-box" style="margin-top:20px">
      💡 Você poderá alternar entre os modos durante a coleta sem perder dados preenchidos.
    </div>
  </div>
</div>
```

---

### 2.7 Função `selectTipoEquip` — redirecionar para T4b

A função atual vai direto para `renderT5()`. Alterar para ir para T4b:

```js
function selectTipoEquip(tipo) {
  SES.tipoEquip = tipo;
  SES.dados.tipo = tipo;
  SES.secAtual = 0;
  document.getElementById('t4b-tipo-label').textContent = labelTipo(tipo);
  goTo('t4b');
}
```

---

### 2.8 Nova função `selecionarModoColeta`

```js
function selecionarModoColeta(modo) {
  SES.modoColetaInicial = modo;
  SES.dados.modo_coleta_inicial = modo;
  SES.dados.status_coleta_campo = SES.dados.status_coleta_campo || 'nao_iniciada';
  SES.dados.status_coleta_documentos = SES.dados.status_coleta_documentos || 'nao_iniciada';

  // Se rascunho antigo sem datas de início, registrar agora
  const agora = new Date().toISOString();
  if (modo === 'campo' && !SES.dados.data_primeira_coleta_campo) {
    SES.dados.data_primeira_coleta_campo = agora;
  }
  if (modo === 'documento' && !SES.dados.data_primeira_coleta_documentos) {
    SES.dados.data_primeira_coleta_documentos = agora;
  }

  SES.secAtual = 0;
  markDirty();
  renderT5();
}
```

---

### 2.9 Restaurar `modoColetaInicial` ao editar equipamento

Em `editarEquip(idx)`, após `SES.dados = { ...eq, ... }`, adicionar:

```js
SES.modoColetaInicial = SES.dados.modo_coleta_inicial || 'campo';
```

Em `abrirNovoEquip()`, resetar:

```js
SES.modoColetaInicial = null;
```

---

### 2.10 Indicador de fluxo no cabeçalho de T5

No HTML de `scr-t5`, abaixo do `div.progress-wrap`, adicionar um elemento de badge de fluxo:

```html
<div id="t5-modo-badge" style="
  padding:5px 18px 6px;
  font-size:11px;
  font-weight:700;
  letter-spacing:.8px;
  color:var(--text3);
  display:flex;
  align-items:center;
  gap:8px;
  flex-shrink:0;
  border-bottom:1px solid var(--border);
  background:var(--surf);
">
  <span id="t5-modo-icon">🔧</span>
  <span id="t5-modo-label">Fluxo: Equipamento em campo</span>
  <span style="flex:1"></span>
  <span id="t5-origem-sec" style="opacity:.7"></span>
  <button id="t5-btn-alternar"
    onclick="alternarModoColeta()"
    style="background:var(--surf2);border:1px solid var(--border);border-radius:8px;
           padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;
           color:var(--text2);white-space:nowrap">
    Alternar →
  </button>
</div>
```

Em `renderT5()`, após definir `const sec = secAtualObj()`, atualizar o badge:

```js
const modo = SES.modoColetaInicial || SES.dados.modo_coleta_inicial || 'campo';
const modoIcon = modo === 'documento' ? '📁' : '🔧';
const modoLabel = modo === 'documento' ? 'Fluxo: Documentação' : 'Fluxo: Equipamento em campo';
const origemIcon = { campo:'🔧 Campo', documento:'📁 Documento', hibrido:'⚖️ Híbrido' }[sec.origem] || '';
document.getElementById('t5-modo-icon').textContent = modoIcon;
document.getElementById('t5-modo-label').textContent = modoLabel;
document.getElementById('t5-origem-sec').textContent = origemIcon;
document.getElementById('t5-btn-alternar').textContent = modo === 'documento' ? '🔧 Ir para campo' : '📁 Ir para docs';
```

---

### 2.11 Função `alternarModoColeta`

```js
function alternarModoColeta() {
  salvarCampos(secAtualId());
  const modoAtual = SES.modoColetaInicial || SES.dados.modo_coleta_inicial || 'campo';
  const novoModo = modoAtual === 'campo' ? 'documento' : 'campo';

  SES.modoColetaInicial = novoModo;
  SES.dados.modo_coleta_inicial = novoModo;
  SES.dados.data_ultima_alternancia_fluxo = new Date().toISOString();

  // Mapear seção atual para equivalente no novo fluxo
  const secIdAtual = secAtualObj().id;
  const novoFluxo = getSecoesFluxo(); // já usa o novo modo
  const novoIdx = novoFluxo.findIndex(s => s.id === secIdAtual);
  SES.secAtual = novoIdx >= 0 ? novoIdx : 0;

  markDirty();
  renderT5();
  showToast(novoModo === 'documento' ? '📁 Modo documentação ativado' : '🔧 Modo campo ativado');
}
```

---

### 2.12 CAMPOS_OBRIGATORIOS → CAMPOS_RECOMENDADOS com classificação por origem

Substituir o objeto `CAMPOS_OBRIGATORIOS` atual pelo seguinte:

```js
const CAMPOS_RECOMENDADOS = {
  enquadramento: [
    { id:'toggle:enquadra_nr13', label:'Enquadramento NR13', origem:'hibrido' },
  ],
  ident: [
    { id:'f_tag',                label:'TAG / Código de Identificação',    origem:'campo'    },
    { id:'f_fabricante',         label:'Fabricante',                       origem:'campo'    },
    { id:'f_categoria',          label:'Categoria NR-13',                  origem:'hibrido'  },
    { id:'toggle:placa_indelevel',label:'Placa de identificação indelével',origem:'campo'    },
  ],
  projeto: [
    { id:'f_pmta',               label:'PMTA (kgf/cm²)',                   origem:'documento' },
    { id:'f_fluido',             label:'Fluido de Trabalho',               origem:'documento' },
    { id:'f_classe_fluido',      label:'Classe do Fluido',                 origem:'documento' },
  ],
  dimensoes: [],
  disp: [
    { id:'toggle:possui_manometro', label:'Possui manômetro?',             origem:'campo'    },
    { id:'toggle:possui_valvula',   label:'Possui válvula de segurança (PSV)?', origem:'campo' },
  ],
  docs: [],
  servico: [
    { id:'toggle:trabalho_altura', label:'Requer trabalho em altura?',     origem:'campo'    },
  ],
  obs: [],
};
```

Manter compatibilidade: onde o código referenciava `CAMPOS_OBRIGATORIOS`, substituir por `CAMPOS_RECOMENDADOS`.

---

### 2.13 Atualizar `validarSecaoAtual` — retorna grupos por origem

```js
function validarSecaoAtual() {
  const secId = secAtualId();
  const obrig = CAMPOS_RECOMENDADOS[secId] || [];
  const modoAtual = SES.modoColetaInicial || SES.dados.modo_coleta_inicial || 'campo';
  const faltando = { campo: [], documento: [], hibrido: [] };

  obrig.forEach(c => {
    let vazio;
    if (c.id.startsWith('toggle:')) {
      const key = c.id.replace('toggle:', '');
      vazio = !SES.dados[key];
    } else {
      const el = document.getElementById(c.id);
      vazio = el && !el.value.trim();
    }
    if (vazio) {
      const grupo = c.origem || 'campo';
      faltando[grupo].push(c);
    }
  });

  return faltando; // { campo: [...], documento: [...], hibrido: [...] }
}

// Helper para verificar se há algum campo faltando (qualquer grupo)
function temCamposFaltando(faltando) {
  return faltando.campo.length + faltando.documento.length + faltando.hibrido.length > 0;
}
```

---

### 2.14 Atualizar `secNext` — modal com classificação por origem

```js
function secNext() {
  markDirty();
  salvarCampos(secAtualId());

  if (secAtualId() === 'enquadramento' && isNaoEnquadrado()) {
    SES.dados._nao_enquadrado = true;
    SES.dados.status_completude = 'nao_enquadrado';
    renderT6();
    return;
  }

  const faltando = validarSecaoAtual();
  const modoAtual = SES.modoColetaInicial || SES.dados.modo_coleta_inicial || 'campo';

  if (temCamposFaltando(faltando)) {
    // Destacar campos no DOM
    const todos = [...faltando.campo, ...faltando.documento, ...faltando.hibrido];
    destacarCamposIncompletos(todos);

    // Construir conteúdo do modal com classificação por origem
    let listaHTML = '';

    const adicionarGrupo = (lista, icone, rotulo) => {
      if (!lista.length) return;
      listaHTML += `<div style="font-size:11px;font-weight:700;color:var(--text3);
                    text-transform:uppercase;letter-spacing:.8px;margin:8px 0 4px">
                    ${icone} ${rotulo}</div>`;
      lista.forEach(c => {
        listaHTML += `<div style="display:flex;align-items:center;gap:8px;font-size:13px;
                      color:var(--text2);padding:3px 0">
                      <span style="color:var(--warn)">⚠️</span>
                      <span>${c.label}</span>
                    </div>`;
      });
    };

    adicionarGrupo(faltando.campo,     '🔧', 'Campo');
    adicionarGrupo(faltando.documento, '📁', 'Documental');
    adicionarGrupo(faltando.hibrido,   '⚖️', 'Híbrido');

    document.getElementById('inc-lista').innerHTML = listaHTML;

    // Lógica do botão "Continuar"
    const temSoDocumental = faltando.campo.length === 0 && faltando.hibrido.length === 0 && faltando.documento.length > 0;
    const temSoCampo      = faltando.documento.length === 0 && faltando.hibrido.length === 0 && faltando.campo.length > 0;

    let textoBotaoContinuar = 'Continuar e registrar pendência →';
    if (temSoDocumental) textoBotaoContinuar = '📁 Registrar como pendência documental →';
    if (temSoCampo)      textoBotaoContinuar = '🔧 Registrar como pendência de campo →';

    document.getElementById('inc-btn-continuar').textContent = textoBotaoContinuar;
    document.getElementById('inc-btn-continuar').onclick = () => {
      closeDialog('modal-incompleto');
      // Registrar pendências separadas
      _registrarPendenciasFaltando(faltando);
      _secNextExecutar();
    };

    document.getElementById('modal-incompleto').classList.add('open');
    return;
  }

  _secNextExecutar();
}
```

---

### 2.15 Nova função `_registrarPendenciasFaltando`

```js
function _registrarPendenciasFaltando(faltando) {
  const agora = new Date().toISOString();

  if (faltando.campo.length > 0 || (faltando.hibrido.length > 0)) {
    const campos = [...faltando.campo, ...faltando.hibrido].map(c => c.label).join(', ');
    SES.dados.pendencias_campo = SES.dados.pendencias_campo
      ? SES.dados.pendencias_campo + '; ' + campos
      : campos;
    SES.dados.status_coleta_campo = 'parcial';
  }

  if (faltando.documento.length > 0) {
    const docs = faltando.documento.map(c => c.label).join(', ');
    SES.dados.pendencias_documentais = SES.dados.pendencias_documentais
      ? SES.dados.pendencias_documentais + '; ' + docs
      : docs;
    SES.dados.status_coleta_documentos = 'parcial';
  }
}
```

---

### 2.16 Atualizar `_secNextExecutar`

```js
function _secNextExecutar() {
  document.querySelectorAll('#t5-body .field.campo-incompleto').forEach(el => el.classList.remove('campo-incompleto'));
  const fluxo = getSecoesFluxo();
  if (SES.secAtual < fluxo.length - 1) {
    SES.secAtual++;
    renderT5();
  } else {
    renderT6();
  }
}
```

---

### 2.17 Atualizar `secBack`

```js
function secBack() {
  markDirty();
  if (SES.secAtual === 0) return;
  salvarCampos(secAtualId());
  SES.secAtual--;
  renderT5();
}
```

---

### 2.18 Atualizar `renderT5` — barra de progresso e referências

```js
function renderT5() {
  const sec = secAtualObj();
  const fluxo = getSecoesFluxo();
  document.getElementById('t5-tipo-label').textContent = labelTipo(SES.tipoEquip);
  document.getElementById('t5-os-label').textContent = SES.os ? SES.os.numero_os : '—';
  document.getElementById('t5-badge').textContent = SES.equipEdit !== null ? 'Editando' : 'Novo';

  const naoEnq = secAtualId() === 'enquadramento' && isNaoEnquadrado();
  if (naoEnq) {
    document.getElementById('t5-progress').style.width = '100%';
    document.getElementById('t5-progress-lbl').textContent = '⚠️ Registro de não enquadramento — etapa única';
  } else {
    document.getElementById('t5-progress').style.width = sec.pct + '%';
    document.getElementById('t5-progress-lbl').textContent =
      sec.icon + ' ' + sec.label + ' (' + (SES.secAtual + 1) + '/' + fluxo.length + ')';
  }

  document.getElementById('t5-btn-back').style.opacity = SES.secAtual === 0 ? '.3' : '1';
  document.getElementById('t5-btn-back').disabled = SES.secAtual === 0;

  if (naoEnq) {
    document.getElementById('t5-btn-next').textContent = '✓ Revisar / Finalizar';
  } else {
    document.getElementById('t5-btn-next').textContent =
      SES.secAtual === fluxo.length - 1 ? '✓ Revisar' : 'Próximo →';
  }

  // Atualizar badge de modo/origem
  const modo = SES.modoColetaInicial || SES.dados.modo_coleta_inicial || 'campo';
  document.getElementById('t5-modo-icon').textContent = modo === 'documento' ? '📁' : '🔧';
  document.getElementById('t5-modo-label').textContent =
    modo === 'documento' ? 'Fluxo: Documentação' : 'Fluxo: Equipamento em campo';
  document.getElementById('t5-origem-sec').textContent =
    { campo:'🔧 Campo', documento:'📁 Documento', hibrido:'⚖️ Híbrido' }[sec.origem] || '';
  document.getElementById('t5-btn-alternar').textContent =
    modo === 'documento' ? '🔧 Ir para campo' : '📁 Ir para docs';

  const body = document.getElementById('t5-body');
  body.innerHTML = renderSecao(sec.id);
  restaurarCampos(sec.id);
  body.scrollTop = 0;
  _iniciarWatcherScroll();
  goTo('t5');
}
```

---

### 2.19 GATEWAY DE SCROLL — botão "Próximo" com indicador de scroll

**Conceito:** O botão "Próximo →" no rodapé fixo permanece visível, mas exibe um indicador pulsante "↓ Role para ver tudo" enquanto o técnico não chegou ao fim do conteúdo. Quando o técnico chega ao fim (ou a seção não requer scroll), o indicador some. Não bloqueia funcionalmente — apenas orienta.

#### 2.19.1 CSS — adicionar ao `<style>`:

```css
/* SCROLL HINT */
.scroll-hint{
  position:absolute;
  bottom:0;left:0;right:0;
  height:56px;
  background:linear-gradient(to bottom,transparent,rgba(13,27,42,.95));
  display:flex;
  align-items:flex-end;
  justify-content:center;
  padding-bottom:8px;
  pointer-events:none;
  transition:opacity .4s;
  z-index:10;
}
.scroll-hint.hidden{opacity:0}
.scroll-hint-pill{
  display:flex;
  align-items:center;
  gap:6px;
  background:var(--surf2);
  border:1px solid var(--border);
  border-radius:20px;
  padding:5px 14px;
  font-size:12px;
  font-weight:600;
  color:var(--text2);
  animation:bounce-hint 1.6s ease-in-out infinite;
  pointer-events:none;
}
@keyframes bounce-hint{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-4px)}
}
/* Botão próximo — estado "ainda há scroll" */
#t5-btn-next.has-scroll{
  opacity:.5;
}
```

#### 2.19.2 HTML — adicionar dentro de `scr-t5`, logo após o `div.body#t5-body`, antes do `div.bot`:

```html
<div class="scroll-hint hidden" id="t5-scroll-hint">
  <div class="scroll-hint-pill">↓ Role para ver tudo</div>
</div>
```

**Atenção:** O `div.body#t5-body` deve ter `position:relative` adicionado ao seu CSS existente para que o `scroll-hint` posicione corretamente. Adicionar `position:relative` ao seletor `.body` existente no CSS, ou inline no elemento.

#### 2.19.3 JS — função `_iniciarWatcherScroll`:

```js
let _scrollWatcherActive = false;

function _iniciarWatcherScroll() {
  const body  = document.getElementById('t5-body');
  const hint  = document.getElementById('t5-scroll-hint');
  const btnNext = document.getElementById('t5-btn-next');
  if (!body || !hint || !btnNext) return;

  _scrollWatcherActive = true;

  function _checarScroll() {
    if (!_scrollWatcherActive) return;
    const temScroll = body.scrollHeight > body.clientHeight + 24;
    const chegouFim = body.scrollTop + body.clientHeight >= body.scrollHeight - 24;

    if (!temScroll || chegouFim) {
      hint.classList.add('hidden');
      btnNext.classList.remove('has-scroll');
    } else {
      hint.classList.remove('hidden');
      btnNext.classList.add('has-scroll');
    }
  }

  // Remover listener anterior se existir
  if (body._scrollHandler) {
    body.removeEventListener('scroll', body._scrollHandler);
  }
  body._scrollHandler = _checarScroll;
  body.addEventListener('scroll', _checarScroll, { passive: true });

  // Verificação inicial (aguarda render)
  setTimeout(_checarScroll, 150);
}

// Limpar watcher ao sair de T5
function _pararWatcherScroll() {
  _scrollWatcherActive = false;
  const body = document.getElementById('t5-body');
  if (body && body._scrollHandler) {
    body.removeEventListener('scroll', body._scrollHandler);
    body._scrollHandler = null;
  }
}
```

Chamar `_pararWatcherScroll()` no início de `renderT6()` e sempre que `goTo` sair de `t5`.

---

### 2.20 Atualizar `renderT6` — usar `secAtualId()` na chamada de `salvarCampos`

```js
function renderT6() {
  _pararWatcherScroll();
  salvarCampos(secAtualId());
  // ... restante da função sem alterações
}
```

---

### 2.21 Atualizar `saveOSDraft` — incluir novos campos no rascunho

Em `saveOSDraft`, os campos novos já estarão em `SES.dados` (pois são salvos via `salvarCampos`). Apenas garantir que `modoColetaInicial` também seja salvo no payload de rascunho, adicionando ao objeto `payload` existente:

```js
modoColetaInicial: SES.modoColetaInicial || '',
```

E ao restaurar em `loadDraftsForOS` / `editarEquip`, após `SES.dados = {...}`:

```js
SES.modoColetaInicial = SES.dados.modo_coleta_inicial || 'campo';
```

---

### 2.22 Atualizar `salvarEquipamento` — incluir novos campos

Garantir que os campos de status de completude sejam atualizados antes de salvar:

```js
// Dentro de salvarEquipamento(), após definir `const equip = { ...SES.dados, ... }`:
equip.modo_coleta_inicial      = SES.dados.modo_coleta_inicial || SES.modoColetaInicial || 'campo';
equip.status_coleta_campo      = SES.dados.status_coleta_campo || 'nao_iniciada';
equip.status_coleta_documentos = SES.dados.status_coleta_documentos || 'nao_iniciada';
equip.pendencias_campo         = SES.dados.pendencias_campo || '';
equip.pendencias_documentais   = SES.dados.pendencias_documentais || '';
```

---

### 2.23 Atualizar `exportarCSV` — incluir colunas novas

Adicionar ao array `cabecalho`:
```js
'Modo_Coleta_Inicial', 'Status_Coleta_Campo', 'Status_Coleta_Docs',
'Pendencias_Campo', 'Pendencias_Documentais'
```

Adicionar nas `linhas.map(eq => [...])`:
```js
eq.modo_coleta_inicial      || '',
eq.status_coleta_campo      || '',
eq.status_coleta_documentos || '',
(eq.pendencias_campo        || '').replace(/\n/g,' '),
(eq.pendencias_documentais  || '').replace(/\n/g,' '),
```

---

### 2.24 Atualizar PDF — bloco "Origem da Coleta"

Na função `gerarPDFEquips`, localizar onde o PDF é gerado e adicionar um bloco chamado "Origem da Coleta" com as seguintes linhas (usar o padrão já existente de `addRow`/`addText` da engine jsPDF presente no código):

```
Iniciada por:         campo → "Equipamento em campo" | documento → "Documentação"
Status de campo:      eq.status_coleta_campo || 'não informado'
Status documental:    eq.status_coleta_documentos || 'não informado'
Pendências de campo:  eq.pendencias_campo || '—'
Pendências documentais: eq.pendencias_documentais || '—'
```

O bloco deve ser inserido após o cabeçalho do equipamento e antes dos dados técnicos. Se não couber na largura do PDF, omitir as pendências e incluir apenas os primeiros três itens.

---

### 2.25 Retrocompatibilidade — rascunhos antigos sem `modo_coleta_inicial`

Em `editarEquip` e `loadDraftsForOS`, após restaurar `SES.dados`:

```js
if (!SES.dados.modo_coleta_inicial) {
  SES.modoColetaInicial = 'campo'; // silencioso, sem perguntar
} else {
  SES.modoColetaInicial = SES.dados.modo_coleta_inicial;
}
```

---

## PARTE 3 — ColectTap_Manager_v1_5.html

### 3.1 Atualizar versão visual

- `<title>` → `ColectTap Manager v1.5`
- Sidebar `.version` → `ColectTap Manager v1.5`
- Subtexto login → `v1.5`

### 3.2 Adicionar filtros de fluxo na view-coletas

Na toolbar de `view-coletas`, adicionar um `<select>` novo:

```html
<select class="filter-select" onchange="filtrarColetas(this.value,'fluxo')">
  <option value="">Todos os fluxos</option>
  <option value="campo">🔧 Iniciadas pelo Campo</option>
  <option value="documento">📁 Iniciadas por Documento</option>
</select>
<select class="filter-select" onchange="filtrarColetas(this.value,'pend')">
  <option value="">Todas as pendências</option>
  <option value="campo">⚠️ Pendência de campo</option>
  <option value="documental">⚠️ Pendência documental</option>
</select>
```

### 3.3 Atualizar `filtrarColetas` para suportar novos filtros

```js
function filtrarColetas(val, campo) {
  _filtroColetas[campo] = val.toLowerCase();
  const filtrado = CACHE.coletas.filter(c => {
    if (_filtroColetas.tipo && !lower(c.tipo).includes(_filtroColetas.tipo)) return false;
    if (_filtroColetas.enq  && !lower(c.enquadra_nr13).includes(_filtroColetas.enq)) return false;
    if (_filtroColetas.rev  && !lower(c.status_revisao||'pendente').includes(_filtroColetas.rev)) return false;
    if (_filtroColetas.fluxo && !lower(c.modo_coleta_inicial||'campo').includes(_filtroColetas.fluxo)) return false;
    if (_filtroColetas.pend === 'campo'     && !s(c.pendencias_campo)) return false;
    if (_filtroColetas.pend === 'documental' && !s(c.pendencias_documentais)) return false;
    return true;
  });
  renderColetas(filtrado);
}
```

### 3.4 Adicionar coluna "Fluxo" na tabela de coletas

No `<thead>` da tabela de coletas, adicionar `<th>Fluxo</th>` após a coluna "Tipo".

Em `renderColetas`, na linha do `<tr>`, adicionar após a célula de tipo:

```js
const fluxoLabel = lower(c.modo_coleta_inicial) === 'documento' ? '📁 Docs' : '🔧 Campo';
const fluxoPill  = lower(c.modo_coleta_inicial) === 'documento' ? 'pill-pend' : 'pill-blue';
```

Inserir célula:
```html
<td><span class="pill ${fluxoPill}" style="font-size:10px">${fluxoLabel}</span></td>
```

### 3.5 Atualizar `renderPendencias` — separar em dois blocos

```js
function renderPendencias(lista) {
  const el = document.getElementById('content-pendencias');
  const comPendDoc   = lista.filter(c => s(c.pendencias_documentais));
  const comPendCampo = lista.filter(c => s(c.pendencias_campo));

  // Também manter filtro legado de status_documentacao
  const legado = lista.filter(c => {
    const doc = lower(c.status_documentacao);
    return doc.includes('parcial') || doc.includes('não localizada') ||
           doc.includes('extraviada') || doc.includes('aguardando');
  });

  // Unificar pendências documentais (novo + legado)
  const setDocIds = new Set(comPendDoc.map(c => c.id_equipamento_colect));
  const pendDocUnificadas = [...comPendDoc];
  legado.forEach(c => { if (!setDocIds.has(c.id_equipamento_colect)) pendDocUnificadas.push(c); });

  let html = '';

  // Bloco 1 — Pendências Documentais
  html += `<h3 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">
             📁 Pendências Documentais (${pendDocUnificadas.length})</h3>`;
  if (!pendDocUnificadas.length) {
    html += '<div class="info-box" style="margin-bottom:16px">✅ Nenhuma pendência documental.</div>';
  } else {
    html += `<table style="margin-bottom:20px"><thead>
      <tr><th>TAG</th><th>Cliente</th><th>OS</th><th>Situação Docs</th><th>Pendências</th><th>Ação</th></tr>
    </thead><tbody>${pendDocUnificadas.map(c => `<tr>
      <td><strong>${s(c.tag)||'—'}</strong></td>
      <td>${s(c.cliente)||'—'}</td>
      <td>${s(c.numero_os)||'—'}</td>
      <td><span class="pill pill-warn">${(s(c.status_documentacao)||'—').substring(0,25)}</span></td>
      <td style="font-size:12px;color:var(--text2);max-width:180px;overflow:hidden;text-overflow:ellipsis">${s(c.pendencias_documentais)||'—'}</td>
      <td><button class="btn btn-ghost" style="font-size:11px" onclick="verDetalhes('${s(c.id_equipamento_colect)}')">Ver</button></td>
    </tr>`).join('')}</tbody></table>`;
  }

  // Bloco 2 — Pendências de Campo
  html += `<h3 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">
             🔧 Pendências de Campo (${comPendCampo.length})</h3>`;
  if (!comPendCampo.length) {
    html += '<div class="info-box">✅ Nenhuma pendência de campo.</div>';
  } else {
    html += `<table><thead>
      <tr><th>TAG</th><th>Cliente</th><th>OS</th><th>Pendências de Campo</th><th>Ação</th></tr>
    </thead><tbody>${comPendCampo.map(c => `<tr>
      <td><strong>${s(c.tag)||'—'}</strong></td>
      <td>${s(c.cliente)||'—'}</td>
      <td>${s(c.numero_os)||'—'}</td>
      <td style="font-size:12px;color:var(--text2);max-width:240px;overflow:hidden;text-overflow:ellipsis">${s(c.pendencias_campo)||'—'}</td>
      <td><button class="btn btn-ghost" style="font-size:11px" onclick="verDetalhes('${s(c.id_equipamento_colect)}')">Ver</button></td>
    </tr>`).join('')}</tbody></table>`;
  }

  el.innerHTML = html;
}
```

### 3.6 Adicionar novos campos no modal `verDetalhes`

Na função `verDetalhes`, após os campos existentes, adicionar no HTML do modal:

```js
['Fluxo de Coleta',       c.modo_coleta_inicial === 'documento' ? '📁 Documentação' : '🔧 Campo'],
['Status Campo',          c.status_coleta_campo      || '—'],
['Status Documentos',     c.status_coleta_documentos || '—'],
['Pendências de Campo',   c.pendencias_campo         || '—'],
['Pendências Documentais',c.pendencias_documentais   || '—'],
```

Se `origem_respostas_json` ou `conflitos_json` existirem e forem JSON válido, exibir como lista legível:

```js
if (c.origem_respostas_json) {
  try {
    const obj = JSON.parse(c.origem_respostas_json);
    // exibir como "campo: origem" uma por linha
  } catch(_) {}
}
```

---

## PARTE 4 — docs/CHANGES_v2_2.md

Gerar um arquivo Markdown com as seguintes seções:

```markdown
# ColectTap v2.2 — Registro de Mudanças

## Versão
- Field: v2.2
- GAS: v1.8
- Manager: v1.5
- Data: [data atual]

## Mudanças Principais

### 1. Seleção de fluxo de coleta (T4b)
- Nova tela entre seleção de tipo e início do formulário
- Opções: "Estou próximo ao equipamento" e "Estou com a documentação em mãos"

### 2. Reorganização dinâmica das seções
- `getSecoesFluxo()` retorna ordem diferente por modo
- Modo campo: Identificação → Dimensões → Dispositivos → Instalação → Enquadramento → Obs → Documentação → Projeto
- Modo documento: Documentação → Projeto → Enquadramento → Identificação → Dimensões → Dispositivos → Instalação → Obs

### 3. Gateway de scroll no formulário
- Indicador "↓ Role para ver tudo" na transição inferior do corpo da seção
- Botão Próximo com opacidade reduzida enquanto há conteúdo não visualizado
- Sem bloqueio funcional — apenas orientação visual

### 4. Modal de campos incompletos com classificação por origem
- Campos faltantes separados em: 🔧 Campo / 📁 Documental / ⚖️ Híbrido
- Botão "Registrar como pendência documental" quando só há pendências documentais
- Botão "Registrar como pendência de campo" quando só há pendências de campo

### 5. Botão de alternância de fluxo
- Disponível no cabeçalho de T5 em todas as seções
- Preserva dados preenchidos e seção atual
- Toast de confirmação

### 6. GAS v1.8 — Novas colunas
- modo_coleta_inicial, status_coleta_campo, status_coleta_documentos
- pendencias_campo, pendencias_documentais, origem_respostas_json, conflitos_json
- data_primeira_coleta_campo, data_primeira_coleta_documentos, data_ultima_alternancia_fluxo

### 7. Manager v1.5
- Filtros de fluxo (Campo / Documento) e pendência na view-coletas
- Pendências separadas em dois blocos na view-pendencias
- Coluna "Fluxo" na tabela de coletas
- Novos campos no modal de detalhes

## Compatibilidade
- Registros antigos sem modo_coleta_inicial assumem 'campo' silenciosamente
- Nenhuma rotina existente foi removida

## Testes Realizados
[Preencher após execução dos testes 1–7 do documento de spec]
```

---

## VERIFICAÇÃO FINAL OBRIGATÓRIA

Antes de fazer o commit, verificar cada item:

**Repositório e arquivos:**
- [ ] Os três arquivos de saída estão em `output/`, não em `src/`
- [ ] O changelog está em `docs/CHANGES_v2_2.md`
- [ ] Nenhum arquivo em `src/` foi modificado
- [ ] `GAS_properCare_v6 - initialize.js` e `pcf_v10.html` não foram tocados
- [ ] O commit contém exatamente 4 arquivos (3 em output/ + 1 em docs/)
- [ ] A mensagem de commit segue o padrão especificado

**Código — Field (ColectTap_v2_2.html):**
- [ ] Nenhuma referência direta a `SECS[SES.secAtual]` permanece (exceto no array `SECS_LEGADO`)
- [ ] `SES.secAtual === 0 && isNaoEnquadrado()` substituído por `secAtualId() === 'enquadramento' && isNaoEnquadrado()` em todos os pontos
- [ ] `SECS.length` substituído por `getSecoesFluxo().length` em todos os pontos
- [ ] A URL da GAS não foi alterada
- [ ] `saveOSDraft` inclui `modoColetaInicial`
- [ ] `editarEquip` restaura `SES.modoColetaInicial`
- [ ] `_iniciarWatcherScroll` é chamado em `renderT5`
- [ ] `_pararWatcherScroll` é chamado em `renderT6` e ao sair de t5
- [ ] `CAMPOS_OBRIGATORIOS` renomeado para `CAMPOS_RECOMENDADOS` com campo `origem` em cada item
- [ ] Modal `modal-incompleto` mostra grupos por origem com botões contextuais
- [ ] Tela `scr-t4b` presente no HTML com id correto
- [ ] `selectTipoEquip` redireciona para `t4b`, não para `t5`
- [ ] Badge de modo visível em T5 com botão de alternância
- [ ] Scroll hint aparece e some corretamente

**Código — GAS (ColectTap_GAS_v1_8.js):**
- [ ] `toJsonCell` é usado em `upsertEquipamentoNR13` para campos JSON
- [ ] `getCabecalhoEquip` inclui as 10 novas colunas
- [ ] `migrarEstrutura` adiciona as 10 novas colunas via `garantirColunas`
- [ ] `APP_VERSION` atualizado para `'ColectTap-GAS-v1.8'`

**Código — Manager (ColectTap_Manager_v1_5.html):**
- [ ] Filtros de fluxo e pendência funcionam sem quebrar filtros existentes
- [ ] `renderPendencias` separa em dois blocos distintos
- [ ] Coluna "Fluxo" visível na tabela de coletas
- [ ] Novos campos no modal `verDetalhes`

**Qualidade geral:**
- [ ] Nenhum `console.log` ou código de debug nos arquivos finais
- [ ] Compatibilidade com registros antigos (sem `modo_coleta_inicial`) verificada

---

## NOTAS DE IMPLEMENTAÇÃO

### Mapeamento de caminhos no repositório

```
Ler de:   src/ColectTap_v2_1.html          → Gerar em: output/ColectTap_v2_2.html
Ler de:   src/ColectTap_GAS_v1_7.js        → Gerar em: output/ColectTap_GAS_v1_8.js
Ler de:   src/ColectTap_Manager_v1_4.html  → Gerar em: output/ColectTap_Manager_v1_5.html
Criar em: docs/CHANGES_v2_2.md             (novo arquivo)
```

### Ordem de implementação recomendada

1. `output/ColectTap_GAS_v1_8.js` — sem risco de quebrar o Field, validar isolado
2. `getSecoesFluxo` + `secAtualObj` + migração das referências `SECS` no Field
3. Tela `scr-t4b` + `selecionarModoColeta` + redirecionar `selectTipoEquip`
4. `CAMPOS_RECOMENDADOS` + validação por origem + modal com botões contextuais
5. Gateway de scroll (CSS + HTML + JS do watcher)
6. Badge de modo + botão de alternância em T5
7. CSV/PDF com novos campos
8. `output/ColectTap_Manager_v1_5.html`
9. `docs/CHANGES_v2_2.md`
10. Checklist de verificação → commit

**Filosofia:** Cada passo deve ser testável independentemente. Não misturar mudanças estruturais com mudanças visuais no mesmo passo. Em caso de dúvida entre implementar algo novo e preservar algo existente, sempre preservar.
