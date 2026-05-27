# Prompt Codex — ColectTap Fase 2
**Arquivos de entrada:** `ColectTap_v2_11.html` · `ColectTap_Manager_v1_13.html`  
**Arquivos de saída:** `ColectTap_v2_12.html` · `ColectTap_Manager_v1_14.html`  
**Escopo:** 5 correções cirúrgicas. Nenhuma outra linha deve ser alterada.

---

## CONTEXTO MÍNIMO

ColectTap é um sistema de coleta de inspeção NR-13 composto por:
- **Field** (`ColectTap_v2_11.html`) — app mobile usado pelo técnico em campo.
- **Manager** (`ColectTap_Manager_v1_13.html`) — painel web que gera PDF do relatório.

Padrões que já existem no código e **devem ser mantidos sem alteração**:
- `toggle(id, label, opções)` — renderiza botões Sim/Não/N/A.
- `campo(id, label, tipo, opts)` — renderiza input/select/textarea.
- `checkList(id, label, itens)` — renderiza lista de checkboxes.
- `getFotosSecao(secaoId, tipo)` — retorna array de defs de foto por seção.
- `renderFotoBlock(def, secaoId)` — renderiza bloco de câmera/galeria.
- `LEGENDAS_TECNICAS` — mapa de chave → legenda de foto.
- `SES.dados` — objeto com todos os campos da sessão atual.
- `SES.tipoEquip` — tipo do equipamento (`'vaso'`, `'caldeira'`, `'tubulacao'`, `'tanque'`).
- `row1(y, eq, label, valor)` / `row2(y, eq, pares)` — funções de linha do PDF no Manager.
- `secTit(y, eq, titulo)` — título de seção no PDF do Manager.

---

## CORREÇÃO 1 — B1: Motivos de enquadramento por tipo de equipamento
**Arquivo:** `ColectTap_v2_11.html`  
**Função:** `renderEnquadramento(t)` — localizar pela string `function renderEnquadramento(t)`

**Problema:** `motivosEnq` é um array fixo com motivos incorretos (ex.: `'PMTA > 0,8 kgf/cm²'` é critério de caldeira, não de vaso). Os motivos não variam por tipo de equipamento e não correspondem às alíneas da NR-13.

**O que fazer:** Substituir o array `motivosEnq` por um objeto indexado por tipo. Manter tudo o mais na função inalterado — apenas a definição de `motivosEnq` e o `checkList` que a usa mudam.

**Substituir este bloco** (está dentro de `renderEnquadramento`, logo após `const enquadra = SES.dados.enquadra_nr13 || '';`):

```js
// BLOCO ATUAL — substituir:
const motivosEnq = [
  'PMTA > 0,8 kgf/cm²',
  'Produto perigoso/classe A/B',
  'Volume acima do limite normativo',
  'Fluido sob pressão em regime contínuo',
  'Equipamento listado no inventário NR13',
  'Processo crítico com risco potencial'
];
```

**Por este bloco:**

```js
// BLOCO NOVO — motivos por tipo, conforme NR-13 item 13.2.1
const MOTIVOS_ENQ = {
  vaso: [
    '(b) P.V > 8, onde P = pressão máx. operação em kPa e V = volume interno em m³',
    '(c) Fluido classe A, independentemente do produto P.V',
    '(d) Recipiente móvel com P.V > 8 (kPa·m³) ou com fluido classe A',
  ],
  caldeira: [
    '(a) Pressão de operação superior a 60 kPa (0,61 kgf/cm²)',
  ],
  tubulacao: [
    '(e) Tubulação com fluido classe A ou B, ligada a caldeira ou vaso abrangido pela NR-13',
  ],
  tanque: [
    '(f) Tanque metálico: diâmetro externo > 3 m, capacidade > 20.000 L, fluido classe A ou B\n    ⚠️ Vigência: 04/07/2026 (Portaria MTP nº 1.846/2022)',
  ],
};
const motivosEnq = MOTIVOS_ENQ[t] || MOTIVOS_ENQ.vaso;
```

Logo após, ainda dentro do bloco `if (enquadra === 'Sim, enquadra conforme 13.2.1')`, substituir apenas a chamada do checkList:

```js
// ATUAL:
${checkList('enq_motivo', 'Motivos de enquadramento (NR13)', motivosEnq)}

// NOVO:
${checkList('enq_motivo', 'Motivos de enquadramento — NR-13 item 13.2.1', motivosEnq)}
${t === 'vaso' ? `<div class="info-box" style="font-size:12px">⚠️ Exclusão automática: vasos com diâmetro interno &lt; 150 mm não se enquadram na NR-13 (item 13.2.2 alínea "f"), independente da classe do fluido.</div>` : ''}
```

**Verificação pós-edição:**
- `MOTIVOS_ENQ` definido dentro de `renderEnquadramento`, antes de ser usado.
- `motivosEnq` continua sendo passado para `checkList`.
- Nenhuma outra linha da função foi alterada.

---

## CORREÇÃO 2 — C1: Foto de prontuário duplicada entre seção Docs e Projeto
**Arquivo:** `ColectTap_v2_11.html`  
**Função:** `getFotosSecao(secaoId, tipo)` — localizar pela string `function getFotosSecao(`

**Problema:** `docs` inclui `'foto_prontuario'`, e `projeto` inclui `'foto_folha_dados'` que na prática é o mesmo documento. A seção de Projeto deve pedir especificamente a folha de dados com PMTA/volume/material, com legenda diferente, e **não** pedir foto genérica de prontuário.

**O que fazer:** Apenas atualizar as entradas do `mapa` para `docs` e `projeto`. Não alterar nada mais na função.

**Localizar este objeto dentro de `getFotosSecao`:**
```js
const mapa = {
  ident:    ['foto_placa','foto_tag','foto_geral_equip'],
  projeto:  ['foto_folha_dados','foto_trecho_pmta'],
  dimensoes:['foto_medicao','foto_corpo','foto_conexoes'],
  disp:     ['foto_psv','foto_manometro','foto_cert_psv','foto_cert_man'],
  docs:     ['foto_prontuario','foto_registro_seg','foto_rel_anterior','foto_cert_psv_doc'],
  servico:  ['foto_ambiente','foto_acesso','foto_risco'],
};
```

**Substituir por:**
```js
const mapa = {
  ident:    ['foto_placa','foto_tag','foto_geral_equip'],
  projeto:  ['foto_folha_dados_pmta'],
  dimensoes:['foto_medicao','foto_corpo','foto_conexoes'],
  disp:     ['foto_psv','foto_manometro','foto_cert_psv','foto_cert_man'],
  docs:     ['foto_prontuario','foto_registro_seg','foto_rel_anterior','foto_cert_psv_doc'],
  servico:  ['foto_ambiente','foto_acesso','foto_risco'],
};
```

E adicionar a legenda da nova chave em `LEGENDAS_TECNICAS`. Localizar o objeto `LEGENDAS_TECNICAS` (pela string `const LEGENDAS_TECNICAS`) e adicionar a entrada abaixo de `foto_prontuario`:

```js
// Linha existente:
foto_prontuario:  'Foto do Prontuário / Folha de Dados',
// Adicionar logo abaixo:
foto_folha_dados_pmta: 'Foto da Folha de Dados (PMTA, volume, material)',
```

**Verificação pós-edição:**
- `mapa.projeto` contém apenas `'foto_folha_dados_pmta'`.
- `mapa.docs` não foi alterado.
- `LEGENDAS_TECNICAS` contém a chave `foto_folha_dados_pmta`.
- Nenhuma outra entrada do mapa foi alterada.

---

## CORREÇÃO 3 — C2: Foto da placa com PMTA removida da seção Docs
**Arquivo:** `ColectTap_v2_11.html`  
**Função:** `renderDocumentacaoInteligente(t)` — localizar pela string `function renderDocumentacaoInteligente(`

**Problema:** A seção de Documentação exibe fotos da seção `'docs'` via `getFotosSecao('docs', t)`, que atualmente inclui `'foto_cert_psv_doc'`. Isso é correto. O problema é que em versões anteriores existia uma foto de placa com PMTA neste fluxo — ela foi reposicionada mas a legenda `'Foto da Placa com PMTA'` ainda pode aparecer via `getFotosSecao`. Confirmar que `mapa.docs` não contém `'foto_placa_pmta'` nem `'foto_placa'` (após a Correção 2 acima, isso já estará garantido pelo mapa correto). 

**Ação adicional:** Dentro de `renderDocumentacaoInteligente`, localizar o bloco que renderiza as fotos quando `temDocs === true`:

```js
<p class="sec-label">📷 Fotos / Documentos desta Seção</p>
${getFotosSecao('docs', t).map(d => renderFotoBlock(d, 'docs')).join('')}
```

Substituir por:

```js
<p class="sec-label">📷 Fotos / Documentos desta Seção</p>
<div class="info-box" style="font-size:12px">Registre apenas documentos. Fotos de equipamento e placa são coletadas na seção de Campo.</div>
${getFotosSecao('docs', t).map(d => renderFotoBlock(d, 'docs')).join('')}
```

**Verificação pós-edição:**
- O `info-box` foi inserido imediatamente antes do `map` de fotos de docs.
- Nenhuma outra parte de `renderDocumentacaoInteligente` foi alterada.

---

## CORREÇÃO 4 — C3: Foto de dimensões condicional à origem da medição
**Arquivo:** `ColectTap_v2_11.html`  
**Função:** `renderDimensoes(t)` — localizar pela string `function renderDimensoes(t)`

**Problema:** A última linha da função usa `getFotosSecao('dimensoes', t)` de forma incondicional. Quando `modo_medicao_diametro` é `'Não medido'`, pedir foto de trena não faz sentido.

**Localizar este bloco** (as duas últimas linhas antes do `return` da função):

```js
  const fotosSecao = getFotosSecao('dimensoes', t);
  return html + '<p class="sec-label">📷 Fotos desta Seção</p>' + fotosSecao.map(d => renderFotoBlock(d, 'dimensoes')).join('');
```

**Substituir por:**

```js
  const modoDimFoto = SES.dados.modo_medicao_diametro || '';
  let fotosSecao;
  if (t === 'vaso' && modoDimFoto === 'Não medido') {
    // Sem medição direta: pedir apenas foto do corpo e conexões (sem foto de trena)
    fotosSecao = [
      { key:'foto_corpo',    defaultLabel: LEGENDAS_TECNICAS['foto_corpo']    || 'Foto do Corpo do Equipamento' },
      { key:'foto_conexoes', defaultLabel: LEGENDAS_TECNICAS['foto_conexoes'] || 'Foto das Conexões e Bocais' },
    ];
  } else if (t === 'vaso' && (modoDimFoto === 'Diâmetro externo medido' || modoDimFoto === 'Circunferência medida')) {
    // Medição direta: incluir foto da medição
    fotosSecao = getFotosSecao('dimensoes', t);
  } else {
    fotosSecao = getFotosSecao('dimensoes', t);
  }
  return html + '<p class="sec-label">📷 Fotos desta Seção</p>' + fotosSecao.map(d => renderFotoBlock(d, 'dimensoes')).join('');
```

**Verificação pós-edição:**
- A variável `modoDimFoto` lê de `SES.dados.modo_medicao_diametro`.
- Para `t !== 'vaso'`, o comportamento é idêntico ao original.
- Para `t === 'vaso'` com `'Não medido'`, retorna apenas 2 fotos (corpo + conexões).
- Nenhuma outra linha de `renderDimensoes` foi alterada.

---

## CORREÇÃO 5 — D4 + F2: Listar enq_motivo no PDF e aviso de conflito
**Arquivo:** `ColectTap_Manager_v1_13.html`  
**Localização:** seção de geração do PDF — localizar pela string `y=secTit(y,eq,'6. Enquadramento NR-13');`

**Problema D4:** Os motivos de enquadramento marcados pelo técnico (`enq_motivo`, gravado como string `'alínea b | alínea c'`) não aparecem no PDF.

**Problema F2:** Quando `conflitos_json` não está vazio, o PDF não avisa o revisor.

**Localizar este bloco:**

```js
    y=secTit(y,eq,'6. Enquadramento NR-13');
    y=row1(y,eq,'Enquadramento',eq.enquadra_nr13);
    y=row1(y,eq,'Base de Enquadramento',eq.base_enquadramento);
    if(s(eq.motivo_nao_enquadramento))y=row1(y,eq,'Motivo Não Enquadramento',eq.motivo_nao_enquadramento);
    if(s(eq.situacao_nr13))y=row1(y,eq,'Situação NR-13',eq.situacao_nr13);
```

**Substituir por:**

```js
    y=secTit(y,eq,'6. Enquadramento NR-13');
    y=row1(y,eq,'Enquadramento',eq.enquadra_nr13);
    if(s(eq.enq_motivo))y=row1(y,eq,'Motivos (NR-13 13.2.1)',eq.enq_motivo);
    y=row1(y,eq,'Base de Enquadramento',eq.base_enquadramento);
    if(s(eq.motivo_nao_enquadramento))y=row1(y,eq,'Motivo Não Enquadramento',eq.motivo_nao_enquadramento);
    if(s(eq.situacao_nr13))y=row1(y,eq,'Situação NR-13',eq.situacao_nr13);

    // F2: aviso de conflito entre coleta de campo e documentação
    try {
      const conf = eq.conflitos_json ? JSON.parse(eq.conflitos_json) : null;
      if (conf && typeof conf === 'object' && Object.keys(conf).length > 0) {
        y=ck(y,10,eq);
        doc.setFillColor(120,0,0); doc.rect(ML,y,CW,8,'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,200,200);
        doc.text('⚠ CONFLITOS DETECTADOS entre coleta de campo e documentação — revisar antes de assinar.',ML+2,y+5.5);
        y+=10; doc.setTextColor(...REL_DARK);
      }
    } catch(e) {}
```

**Verificação pós-edição:**
- `eq.enq_motivo` é exibido apenas se não vazio.
- O bloco de conflito usa `try/catch` para não quebrar o PDF em caso de JSON inválido.
- Nenhuma outra seção do PDF foi alterada.

---

## BUMP DE VERSÃO

Após todas as correções:

**Field:** substituir `ColectTap v2.11` por `ColectTap v2.12` na tag `<title>` e em qualquer outra ocorrência de número de versão no arquivo.

**Manager:** substituir `ColectTap Manager v1.13` por `ColectTap Manager v1.14` na tag `<title>`, no `<div class="version">` e na linha `doc.text('Gerado por ColectTap Manager v1.13...`.

---

## CHECKLIST DE AUTO-AUDITORIA (executar antes de entregar)

- [ ] `MOTIVOS_ENQ` definido dentro de `renderEnquadramento` — não no escopo global.
- [ ] `motivosEnq` ainda é passado para `checkList` após a mudança.
- [ ] Info-box de exclusão de vaso < 150mm aparece apenas quando `t === 'vaso'`.
- [ ] `mapa.projeto` em `getFotosSecao` contém apenas `'foto_folha_dados_pmta'`.
- [ ] `LEGENDAS_TECNICAS` contém `foto_folha_dados_pmta`.
- [ ] `mapa.docs` não contém `'foto_placa'` nem `'foto_placa_pmta'`.
- [ ] Info-box "Registre apenas documentos..." inserido em `renderDocumentacaoInteligente` antes do map de fotos.
- [ ] `renderDimensoes` só omite `foto_medicao` quando `t === 'vaso'` e `modo_medicao_diametro === 'Não medido'`.
- [ ] `eq.enq_motivo` exibido no PDF do Manager após `row1('Enquadramento', ...)`.
- [ ] Bloco de conflito envolto em `try/catch`.
- [ ] Versões atualizadas nos dois arquivos.
- [ ] Nenhuma outra função foi modificada.
