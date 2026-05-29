# PROMPT CODEX — ColectTap Field v2.16 + GAS v1.17
## Correções de PDF, Field e GAS — Relatório de Levantamento NR-13

---

## PASSO 0 — LEITURA OBRIGATÓRIA ANTES DE QUALQUER ALTERAÇÃO

Leia integralmente ANTES de escrever qualquer linha:

1. `src/ColectTap_v2_15.html` — Field atual (base)
2. `src/ColectTap_GAS_v1_16.js` — GAS atual (base)

Só após leitura completa, iniciar as alterações.

---

## ARQUIVOS DE SAÍDA

- `output/ColectTap_v2_16.html` — Field corrigido (base: `src/ColectTap_v2_15.html`)
- `output/ColectTap_GAS_v1_17.js` — GAS corrigido (base: `src/ColectTap_GAS_v1_16.js`)

**O Manager NÃO é alterado nesta tarefa.**

---

## REGRAS GERAIS

- Nunca reescrever o arquivo inteiro do zero — partir do `src/` e aplicar as correções
- Preservar todas as funções existentes; apenas modificar o que está especificado
- Bump de versão: todas as ocorrências de `"v2.14"` ou `"v2.15"` → `"v2.16"` no HTML
- Bump de versão no GAS: `ColectTap-GAS-v1.16` → `ColectTap-GAS-v1.17`
- Cada entrega deve ser 100% funcional e autossuficiente (não omitir trechos)

---

## BLOCO 1 — HELPER DE FORMATAÇÃO DE DATA

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar a definição das constantes PDF no início de `gerarPDF` (onde `const dataHoje` é definido, aproximadamente na linha onde aparece `agora.toLocaleDateString('pt-BR')`).

Imediatamente **antes** da linha `const dataHoje = ...`, inserir a função auxiliar:

```javascript
function fmtData(v) {
  if (!v) return '—';
  // YYYY-MM-DD → DD/MM/AAAA
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  // já em DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(v))) return v;
  return String(v);
}
```

---

## BLOCO 2 — FOTO DA CAPA: DESENHO COM ASPECT-RATIO CORRETO

**Arquivo:** `output/ColectTap_v2_16.html`  
**Função:** `gerarCapa(eq)`

### 2.1 — Reposicionar o título para abrir espaço à foto

Localizar:
```javascript
doc.text('LEVANTAMENTO DE', PW/2, 105, {align:'center'});
doc.text('EQUIPAMENTOS NR-13', PW/2, 116, {align:'center'});
```
Substituir por:
```javascript
doc.text('LEVANTAMENTO DE', PW/2, 68, {align:'center'});
doc.text('EQUIPAMENTOS NR-13', PW/2, 79, {align:'center'});
```

Localizar a linha decorativa:
```javascript
doc.line(ML+20, 122, PW-MR-20, 122);
```
Substituir por:
```javascript
doc.line(ML+20, 83, PW-MR-20, 83);
```

Localizar o subtítulo ColectTap (contém `'ColectTap v2.14'` ou `'ColectTap v2.15'`):
Substituir pelo texto atualizado posicionado em y=140:
```javascript
doc.text('ColectTap v2.16  |  Gerado em: ' + dataHoje + ' ' + horaHoje, PW/2, 140, {align:'center'});
```

### 2.2 — Inserir foto da capa com proporção preservada

Localizar o trecho:
```javascript
// ── Bloco de dados do cliente ──
const bx=ML+10, bw=CW-20;
```

Imediatamente **antes** dessas linhas, inserir:
```javascript
// ── Foto da capa (se disponível) ──
if (eq && eq.foto_capa_key && eq._fotos) {
  const fotoCapa = eq._fotos[eq.foto_capa_key];
  if (fotoCapa && fotoCapa.dataUrl) {
    const fotoAreaX = ML;
    const fotoAreaY = 88;
    const fotoAreaW = CW;
    const fotoAreaH = 48;
    const r = (fotoCapa.w && fotoCapa.h) ? (fotoCapa.w / fotoCapa.h) : (4 / 3);
    let fw = fotoAreaW, fh = fotoAreaW / r;
    if (fh > fotoAreaH) { fh = fotoAreaH; fw = fotoAreaH * r; }
    if (fw > fotoAreaW) { fw = fotoAreaW; fh = fotoAreaW / r; }
    const fx = fotoAreaX + (fotoAreaW - fw) / 2;
    const fy = fotoAreaY + (fotoAreaH - fh) / 2;
    try { doc.addImage(fotoCapa.dataUrl, 'JPEG', fx, fy, fw, fh); } catch(_) {}
  }
}
```

---

## BLOCO 3 — CORREÇÃO DE renderFotoBlock RECEBENDO STRING

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar a linha:
```javascript
${SES.dados.possui_isolamento === 'Sim' ? renderFotoBlock('foto_isolamento', 'projeto') : ''}
```
Substituir por:
```javascript
${SES.dados.possui_isolamento === 'Sim' ? renderFotoBlock({key:'foto_isolamento', defaultLabel:'Foto do Isolamento Térmico'}, 'projeto') : ''}
```

Após a correção, **verificar todo o arquivo** por outras chamadas `renderFotoBlock(str, ...)` onde `str` é uma string literal (não um objeto). Para cada ocorrência encontrada, converter para o formato de objeto `{key: str, defaultLabel: LEGENDAS_TECNICAS[str] || str.replace('foto_','').replace(/_/g,' ')}`.

---

## BLOCO 4 — CAMPO "ANO DE EDIÇÃO DO CÓDIGO DE PROJETO" NO FIELD

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar em `renderProjetoSection` (ou função equivalente que renderiza a seção de projeto):
```javascript
${mostrarOutro ? campo('codigo_projeto_outro', 'Código de Projeto (especificar)', 'text', {placeholder: 'Ex: NR-12, EN 13445…'}) : ''}
```
Substituir por:
```javascript
${mostrarOutro ? campo('codigo_projeto_outro', 'Código de Projeto (especificar)', 'text', {placeholder: 'Ex: NR-12, EN 13445…'}) : ''}
${campo('ano_edicao_codigo', 'Ano de Edição do Código', 'number', {placeholder: 'Ex: 2019'})}
```

---

## BLOCO 5 — CORRIGIR function row2: ALINHAMENTO À ESQUERDA

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar `function row2(y, items)` no bloco da geração de PDF.  
Substituir o corpo inteiro da função por:

```javascript
function row2(y, items) {
  const rh = 8;
  y = ck(y, rh);
  const cw2 = CW / 2;
  items.forEach((item, i) => {
    const x = ML + i * cw2;
    doc.setFillColor(i % 2 === 0 ? 247 : 252, 250, 255);
    doc.rect(x, y, cw2, rh, 'F');
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.2);
    doc.rect(x, y, cw2, rh, 'S');
    // Label — bold, pequeno, azul, linha superior
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...AZUL2);
    doc.text(limparTxtPDF(item.l || ''), x + 2, y + 3);
    // Valor — normal, maior, escuro, linha inferior, alinhado à esquerda
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK);
    const v = (item.v !== undefined && item.v !== null && item.v !== '' && item.v !== '—')
      ? String(item.v) : '—';
    doc.text(limparTxtPDF(v), x + 2, y + 6.5);
  });
  return y + rh;
}
```

---

## BLOCO 6 — CORRIGIR function row1: VALOR ALINHADO À ESQUERDA

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar `function row1(y, label, val, alt)` no bloco da geração de PDF.  
Substituir o corpo inteiro por:

```javascript
function row1(y, label, val, alt) {
  const rh = 8;
  y = ck(y, rh);
  if (alt) { doc.setFillColor(247, 250, 255); doc.rect(ML, y, CW, rh, 'F'); }
  doc.setDrawColor(...MGRAY); doc.setLineWidth(0.2);
  doc.rect(ML, y, CW, rh, 'S');
  // Label bold pequeno
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...AZUL2);
  doc.text(limparTxtPDF(label), ML + 2, y + 3);
  // Valor normal, alinhado à esquerda abaixo do label
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK);
  const v = (val !== undefined && val !== null && val !== '') ? String(val) : '—';
  doc.text(limparTxtPDF(v), ML + 2, y + 6.5);
  return y + rh;
}
```

---

## BLOCO 7 — FORMATAÇÃO DE DATAS NO PDF

**Arquivo:** `output/ColectTap_v2_16.html`

Nos objetos `row1`/`row2` que referenciam campos de data (capturados como `type="date"`, armazenados como `YYYY-MM-DD`), envolver o valor com `fmtData()`.

Localizar e substituir as seguintes ocorrências (pode haver variações de label já corrigidas nos blocos seguintes — aplicar `fmtData` independentemente do label):

| Localizar | Substituir |
|-----------|-----------|
| `v:d.venc_manometro` | `v:fmtData(d.venc_manometro)` |
| `v:d.venc_valvula` | `v:fmtData(d.venc_valvula)` |

Além disso, varrer o arquivo por outros campos que usam `type="date"` no Field (ex: `d.data_coleta`, `d.data_inspecao`, `d.data_proxima_inspecao`) e aplicar `fmtData()` nas ocorrências correspondentes no PDF.

---

## BLOCO 8 — LABELS DO PDF: RENOMEAÇÕES COMPLETAS

**Arquivo:** `output/ColectTap_v2_16.html`

Aplicar as seguintes substituições de string nos labels de `row1`/`row2` dentro da função `gerarPDF` (e `gerarCapa`). Usar busca por string exata no trecho `{l:'...'}`:

### Seção A — Identificação
| De | Para |
|----|------|
| `'Placa Indelevel'` | `'Possui Placa Indelével?'` |
| `'Necessita Ident.TAG/Cat.'` | `'Necessita Identificação TAG/Categoria?'` |
| `'N° Equipamento'` | `'Número do Equipamento'` |
| `'Já Inspecionado'` | `'Já Foi Inspecionado Anteriormente?'` |

### Seção B — Dados de Projeto
| De | Para |
|----|------|
| `'PMTA (kgf/cm²)'` | `'PMTA — Pressão Máx. de Trabalho Admissível (kgf/cm²)'` |
| `'Ano Última Inspeção'` | `'Ano da Última Inspeção'` |
| `'Tipo Última Inspeção'` | `'Tipo da Última Inspeção'` |
| `'Pressão de Teste Hidrostático (kgf/cm²)'` | `'Pressão de Teste Hidrostático (kgf/cm²)'` ← confirmar/manter |

**ATENÇÃO:** Verificar se há variantes abreviadas como `'P. Teste'`, `'P. Projeto'` e corrigir para o nome completo com unidade.

### Seção C — Dimensões
| De | Para |
|----|------|
| `'Área Superf. Aquecimento (m²)'` | `'Área de Superfície de Aquecimento (m²)'` |
| `'Pressão de Projeto (kgf/cm²)'` | `'Pressão de Projeto (kgf/cm²)'` ← confirmar/manter |

### Seção D — Dispositivos de Segurança
| De | Para |
|----|------|
| `'Possui manômetro'` | `'Possui Manômetro?'` |
| `'Manômetro calibrado'` | `'Manômetro Calibrado?'` |
| `'N° Cert. Calib. Manômetro'` | `'Número de Certificado do Manômetro'` |
| `'Vencimento Calibração'` | `'Vencimento da Calibração'` |
| `'PA da PSV (kgf/cm2)'` | `'Pressão de Ajuste/Abertura da PSV (kgf/cm²)'` |
| `'N° Cert. Calib. PSV'` | `'Número de Certificado da PSV'` |
| `'Vencimento Calibração PSV'` | `'Vencimento da Calibração da PSV'` |
| `'Possui PSV (válvula segurança)'` | `'Possui PSV / Válvula de Segurança?'` |
| `'PSV calibrada'` | `'PSV Calibrada?'` |
| `'Possui purgador'` | `'Possui Purgador?'` |
| `'Possui DCBI'` | `'Possui DCBI?'` |
| `'Adequada ao equipamento'` | `'PSV Adequada ao Equipamento?'` |
| `'Motivo inadequação PSV'` | `'Motivo da Inadequação da PSV'` |

### Seção F — Condições de Serviço
| De | Para |
|----|------|
| `'Trabalho em altura'` | `'Requer Trabalho em Altura?'` |
| `'Necessita TH'` | `'Necessita Teste Hidrostático?'` |
| `'Espaço confinado'` | `'Acesso por Espaço Confinado?'` |
| `'Necessita andaime'` | `'Requer Uso de Andaime?'` |

**Regra geral:** varrer todo o bloco `gerarPDF` por labels que contenham abreviações (ponto no meio de palavra, barra invertida, parênteses truncados) e expandir para o nome completo. Se o label caber em uma linha do PDF (máx ~55 caracteres), não abreviar.

---

## BLOCO 9 — SEÇÃO C DO PDF: possui_isolamento E possui_indicador_nivel

**Arquivo:** `output/ColectTap_v2_16.html`

### 9.1 — Adicionar `possui_isolamento` para vaso no PDF

No bloco `if (d.tipo === 'vaso')` da seção C, localizar a última linha de dados do vaso (linha com `espessura_parede` e `material_casco`):
```javascript
y = row2(y,[{l:'Espessura de Parede (mm)',v:d.espessura_parede},{l:'Material do Casco',v:d.material_casco}]);
```
Inserir **depois** dessa linha:
```javascript
y = row2(y,[{l:'Possui Isolamento Térmico?',v:d.possui_isolamento},{l:'',v:''}]);
```

### 9.2 — Adicionar `possui_isolamento` para caldeira no PDF

No bloco `else if (d.tipo === 'caldeira')` da seção C, localizar a linha:
```javascript
y = row1(y,'Material do Casco',d.material_casco,true);
```
Inserir **depois** dessa linha:
```javascript
y = row2(y,[{l:'Possui Isolamento Térmico?',v:d.possui_isolamento},{l:'',v:''}]);
```

### 9.3 — Indicador de Nível: apenas caldeira e tanque no PDF

Na seção D do PDF, localizar:
```javascript
y = row2(y,[{l:'Possui purgador',v:d.possui_purgador},{l:'Possui DCBI',v:d.possui_dcbi}]);
```
(Labels já corrigidos para `'Possui Purgador?'` e `'Possui DCBI?'` pelo Bloco 8.)

Após essa linha, adicionar:
```javascript
if (d.tipo === 'caldeira' || d.tipo === 'tanque') {
  y = row2(y,[{l:'Possui Indicador de Nível?',v:d.possui_indicador_nivel},{l:'',v:''}]);
}
```

### 9.4 — Remover `possui_indicador_nivel` do Field para vaso e tubulação

Localizar no Field (em `renderDisp` ou equivalente):
```javascript
${t === 'caldeira' ? toggle('possui_indicador_nivel', 'Possui indicador de nível?', ['Sim','Não']) : ''}
```
Substituir por:
```javascript
${(t === 'caldeira' || t === 'tanque') ? toggle('possui_indicador_nivel', 'Possui Indicador de Nível?', ['Sim','Não']) : ''}
```

---

## BLOCO 10 — base_enquadramento NO PDF

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar o bloco customizado de `base_enquadramento` (bloco com `doc.setFont('helvetica','italic')` e `'Base: '`):

```javascript
if (d.base_enquadramento) {
  y=ck(y,8);
  doc.setFillColor(...LGRAY); doc.rect(ML,y,CW,7,'F');
  doc.setFont('helvetica','italic'); doc.setFontSize(7); doc.setTextColor(80,90,110);
  const l=doc.splitTextToSize(limparTxtPDF('Base: '+d.base_enquadramento), CW-4);
  doc.text(l, ML+2, y+4.5);
  y += Math.max(7, l.length*4+2);
}
```

Substituir por:
```javascript
if (d.base_enquadramento) {
  y = row1(y, 'Base de Enquadramento NR-13', d.base_enquadramento, true);
}
```

---

## BLOCO 11 — ANO DE EDIÇÃO DO CÓDIGO NO PDF

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar no PDF (seção A) o trecho que constrói o display do código de projeto:
```javascript
y = row2(y,[{l:'Categoria NR-13',v:d.categoria},{l:'Código de Projeto',v:d.codigo_projeto==='Outro'?(d.codigo_projeto_outro||'Outro'):d.codigo_projeto}]);
```
Substituir por:
```javascript
const codigoProjetoDisplay = (d.codigo_projeto === 'Outro'
  ? (d.codigo_projeto_outro || 'Outro')
  : (d.codigo_projeto || '—')) +
  (d.ano_edicao_codigo ? ' (' + d.ano_edicao_codigo + ')' : '');
y = row2(y,[{l:'Categoria NR-13',v:d.categoria},{l:'Código de Projeto',v:codigoProjetoDisplay}]);
```

---

## BLOCO 12 — ALINHAMENTO DA SEÇÃO F: "processo" E OUTRAS OBS

**Arquivo:** `output/ColectTap_v2_16.html`

Localizar o bloco de `d.processo` na seção F do PDF:
```javascript
if (d.processo) {
  ...
  doc.text('Informações do Processo:',ML+2,y+4.5);
  ...
  const pl=doc.splitTextToSize(limparTxtPDF(d.processo),CW-4);
  doc.text(pl,ML+2,y+8.5);
  ...
}
```

Confirmar que `doc.text(pl, ML+2, ...)` NÃO usa `{align:'center'}`. Se houver `{align:'center'}` ou `PW/2` como coordenada X nesse bloco, remover o alinhamento central e usar `ML+2`.

Fazer o mesmo para todos os blocos de texto longo nas seções F e G (`obs_gerais`, `obs_inspetor`, `risco_observado`): confirmar que o `doc.text` usa `ML+2` como X, sem `{align:'center'}`.

---

## BLOCO 13 — GAS: NOVO CAMPO ano_edicao_codigo

**Arquivo:** `output/ColectTap_GAS_v1_17.js`

### 13.1 — Adicionar ao array de campos permitidos em `salvarLevantamentoNR13`

Localizar o array que contém `'codigo_projeto'` na lista de campos aceitos (geralmente um array de strings com os nomes dos campos mapeados).  
Adicionar `'ano_edicao_codigo'` imediatamente após `'codigo_projeto'`.

### 13.2 — Adicionar ao objeto de retorno em `obterEquipamentoPorOS` (ou equivalente)

Localizar onde `codigo_projeto: eq.codigo_projeto || ''` é montado no objeto de resposta.  
Adicionar imediatamente após:
```javascript
ano_edicao_codigo: eq.ano_edicao_codigo || '',
```

### 13.3 — Adicionar à lista de colunas em `migrarEstrutura()`

Localizar o array de colunas esperadas da sheet LEVANTAMENTOS (ou equivalente) dentro de `migrarEstrutura`.  
Adicionar `'ano_edicao_codigo'` à lista, posicionado após `'codigo_projeto'`.

---

## BLOCO 14 — VERIFICAÇÕES FINAIS (self-audit obrigatório)

Antes de commitar, verificar cada item:

```
□ Todas as chamadas renderFotoBlock(string, ...) convertidas para objeto {key, defaultLabel}
□ fmtData() aplicado em TODOS os campos de data no PDF (venc_manometro, venc_valvula, outros)
□ String de versão "v2.14"/"v2.15" → "v2.16" em todas as ocorrências no HTML
□ String de versão GAS → "v1.17"
□ row2 com rh=8 não colide com outras linhas (verificar visualmente o layout esperado)
□ row1 com rh=8 idem
□ possui_isolamento aparece no PDF para vaso e caldeira (seção C)
□ possui_indicador_nivel aparece no PDF APENAS para caldeira e tanque (seção D)
□ base_enquadramento usa row1 padrão (não bloco italicizado customizado)
□ ano_edicao_codigo está no GAS payload, no objeto de retorno e na lista de migrarEstrutura
□ Foto da capa usa aspect-ratio preservado (não distorce)
□ Labels do PDF expandidos conforme tabelas do Bloco 8
□ Todos os doc.text de texto longo (obs, processo) usam ML+2 como X, sem align:'center'
□ Nenhuma funcionalidade existente foi quebrada (autosave, login, navegação, envio GAS)
```

---

## ENTREGA

Commitar em `output/`:
- `output/ColectTap_v2_16.html`
- `output/ColectTap_GAS_v1_17.js`

Nenhum outro arquivo deve ser modificado.
