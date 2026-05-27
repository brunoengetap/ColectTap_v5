# Prompt Codex — ColectTap Fase 3
**Repositório:** `ColectTap_v2`
**Arquivos de entrada (pasta `src/`):**
- `src/ColectTap_v2_12.html`
- `src/ColectTap_Manager_v1_14.html`
- `src/ColectTap_GAS_v1_14.js`

**Arquivos de saída (pasta `output/`):**
- `output/ColectTap_v2_13.html`
- `output/ColectTap_Manager_v1_15.html`
- `output/ColectTap_GAS_v1_15.js`

**Arquivo de prompt (pasta `prompts/`):**
- `prompts/Prompt_Codex_ColectTap_Fase3.md` ← este arquivo

**Escopo:** 9 correções cirúrgicas distribuídas em 3 componentes. Nenhuma outra linha deve ser alterada.

---

## CONTEXTO MÍNIMO

ColectTap é um sistema de coleta de inspeção NR-13 composto por:
- **Field** (`ColectTap_v2_12.html`) — app mobile usado pelo técnico em campo.
- **Manager** (`ColectTap_Manager_v1_14.html`) — painel web que gera PDF do relatório.
- **GAS** (`ColectTap_GAS_v1_14.js`) — Google Apps Script, backend/banco de dados.

Padrões existentes que **devem ser mantidos sem alteração**:
- `toggle(id, label, opções)` — renderiza botões Sim/Não/N/A.
- `campo(id, label, tipo, opts)` — renderiza input/select/textarea.
- `TOGGLES_REATIVOS` — Set de IDs que disparam re-render da seção ao ser alterados.
- `renderDispositivos(t)` — função que renderiza a seção de manômetro/PSV.
- `tipoLabel(t)` — função do Manager que traduz tipo bruto para label legível.
- `row1(y, eq, label, valor)` / `row2(y, eq, pares)` — linhas do PDF no Manager.
- `APP_VERSION` — constante de versão no GAS.

---

## CORREÇÃO 1 — B2: Remover "(Isento)" da Categoria V
**Arquivo:** `ColectTap_v2_12.html`
**Localizar pela string:** `function renderIdentificacao(t)` — dentro desta função há o objeto `categorias`.

**Problema:** "Categoria V (Isento)" é normativa e tecnicamente incorreto. Vasos categoria V têm prazos de inspeção definidos na Tabela 2 da NR-13 (exame externo 5 anos / interno 10 anos) e não são isentos de inspeção.

**Substituir:**
```js
{v:'V',l:'Categoria V (Isento)'}
```
**Por:**
```js
{v:'V',l:'Categoria V'}
```

**Verificação:** A linha `vaso: [{v:'I'...},{v:'II'...},{v:'III'...},{v:'IV'...},{v:'V',l:'Categoria V'}]` deve não conter a palavra "Isento".

---

## CORREÇÃO 2 — B4: Remover Categoria C das caldeiras
**Arquivo:** `ColectTap_v2_12.html`
**Localizar pela string:** `caldeira:[{v:'A',l:'Categoria A'},{v:'B',l:'Categoria B'},{v:'C',l:'Categoria C'}]`

**Problema:** A NR-13 define apenas Categoria A e Categoria B para caldeiras (item 13.4). Não existe Categoria C para caldeiras na norma vigente.

**Substituir:**
```js
caldeira:[{v:'A',l:'Categoria A'},{v:'B',l:'Categoria B'},{v:'C',l:'Categoria C'}],
```
**Por:**
```js
caldeira:[{v:'A',l:'Categoria A'},{v:'B',l:'Categoria B'}],
```

**Verificação:** O array `caldeira` deve conter exatamente 2 entradas, sem `{v:'C'...}`.

---

## CORREÇÃO 3 — B3: Ajustar labels das classes de fluido
**Arquivo:** `ColectTap_v2_12.html`
**Localizar pela string:** `const classesFluido = [`

**Problema:** As descrições atuais são imprecisas em relação à NR-13 item 13.1.5:
- Classe A: "Inflamável/Tóxico/Letal" mistura critérios distintos da norma.
- Classe B: "Inflamável" omite o critério de ponto de fulgor ≥ 37,8°C.
- Classe C: "Não inflamável / Não tóxico" é genérico demais.
- Classe D: "Vapor d'água / Água quente" é correto mas deve mencionar temperatura.

**Substituir este bloco:**
```js
  const classesFluido = [
    {v:'A',l:'Classe A — Inflamável/Tóxico/Letal'},
    {v:'B',l:'Classe B — Inflamável'},
    {v:'C',l:'Classe C — Não inflamável / Não tóxico'},
    {v:'D',l:'Classe D — Vapor d\'água / Água quente'},
  ];
```
**Por:**
```js
  const classesFluido = [
    {v:'A',l:'Classe A — Tóxico/Letal ou Inflamável com PF < 37,8°C'},
    {v:'B',l:'Classe B — Inflamável com PF ≥ 37,8°C'},
    {v:'C',l:'Classe C — Combustível ou não inflamável/não tóxico'},
    {v:'D',l:'Classe D — Vapor d\'água, água quente ≥ 45°C'},
  ];
```

**Verificação:** O array deve conter exatamente 4 entradas com as novas descrições. Nenhuma outra linha da função foi alterada.

---

## CORREÇÃO 4 — A3: Certificado e vencimento do manômetro condicionais
**Arquivo:** `ColectTap_v2_12.html`
**Função:** `renderDispositivos(t)` — localizar pela string `function renderDispositivos(t)`

**Problema:** `cert_manometro` e `venc_manometro` são renderizados incondicionalmente dentro do bloco `if (temMan === 'Sim')`, independente do valor de `manometro_calibrado`. Se o técnico marcar "Não", os campos de certificado aparecem sem sentido.

O padrão de re-render já existe: `manometro_calibrado` está em `TOGGLES_REATIVOS`, então ao alterar o toggle a seção é re-renderizada com os valores atuais de `SES.dados`.

**Localizar este bloco** (dentro de `if (temMan === 'Sim')`):
```js
    html += `
      ${toggle('manometro_calibrado', 'Manômetro calibrado?', ['Sim','Não','N/A'])}
      ${campo('cert_manometro', 'Nº Certificado de Calibração (Manômetro)', 'text', {placeholder: 'CAL-2026-001'})}
      ${campo('venc_manometro', 'Vencimento da Calibração', 'date', {})}`;
```

**Substituir por:**
```js
    const manCalib = SES.dados.manometro_calibrado || '';
    html += toggle('manometro_calibrado', 'Manômetro calibrado?', ['Sim','Não','N/A']);
    if (manCalib === 'Sim') {
      html += campo('cert_manometro', 'Nº Certificado de Calibração (Manômetro)', 'text', {placeholder: 'CAL-2026-001'});
      html += campo('venc_manometro', 'Vencimento da Calibração', 'date', {});
    } else if (manCalib === 'Não') {
      html += campo('motivo_nao_calibracao_man', 'Motivo da não calibração (Manômetro)', 'textarea', {placeholder: 'Ex: sem acesso ao certificado, calibração vencida, equipamento antigo…'});
    }
```

**Verificação:**
- `cert_manometro` e `venc_manometro` só renderizam quando `manometro_calibrado === 'Sim'`.
- `motivo_nao_calibracao_man` só renderiza quando `manometro_calibrado === 'Não'`.
- Para `'N/A'` nenhum campo adicional é exibido.
- Nenhuma outra parte de `renderDispositivos` foi alterada.

---

## CORREÇÃO 5 — A4: Certificado e vencimento da PSV condicionais
**Arquivo:** `ColectTap_v2_12.html`
**Função:** `renderDispositivos(t)` — dentro do bloco `if (temPSV === 'Sim')`

**Problema:** Mesmo padrão do A3. `cert_valvula` e `venc_valvula` aparecem independente do valor de `valvula_calibrada`.

**Localizar este bloco** (dentro de `if (temPSV === 'Sim')`):
```js
    html += `
      ${campo('pa_valvula', 'Pressão de Abertura da PSV (kgf/cm²)', 'number', {placeholder: 'Ex: 11'})}
      ${toggle('valvula_calibrada', 'PSV calibrada?', ['Sim','Não','N/A'])}
      ${campo('cert_valvula', 'Nº Certificado de Calibração (PSV)', 'text', {placeholder: 'CAL-2026-002'})}
      ${campo('venc_valvula', 'Vencimento da Calibração', 'date', {})}
      ${toggle('valvula_adequada', 'A PSV é adequada ao equipamento?', ['Sim','Não','Não foi possível avaliar'])}`;
```

**Substituir por:**
```js
    const psvCalib = SES.dados.valvula_calibrada || '';
    html += campo('pa_valvula', 'Pressão de Abertura da PSV (kgf/cm²)', 'number', {placeholder: 'Ex: 11'});
    html += toggle('valvula_calibrada', 'PSV calibrada?', ['Sim','Não','N/A']);
    if (psvCalib === 'Sim') {
      html += campo('cert_valvula', 'Nº Certificado de Calibração (PSV)', 'text', {placeholder: 'CAL-2026-002'});
      html += campo('venc_valvula', 'Vencimento da Calibração', 'date', {});
    } else if (psvCalib === 'Não') {
      html += campo('motivo_nao_calibracao_psv', 'Motivo da não calibração (PSV)', 'textarea', {placeholder: 'Ex: PSV sem certificado disponível, substituição pendente…'});
    }
    html += toggle('valvula_adequada', 'A PSV é adequada ao equipamento?', ['Sim','Não','Não foi possível avaliar']);
```

**Verificação:**
- `cert_valvula` e `venc_valvula` só renderizam quando `valvula_calibrada === 'Sim'`.
- `motivo_nao_calibracao_psv` só renderiza quando `valvula_calibrada === 'Não'`.
- `pa_valvula` e `valvula_adequada` continuam renderizando normalmente (não condicionais).
- O bloco `if (psvAdq === 'Não')` e `else if (psvAdq === 'Não foi possível avaliar')` que existia após este trecho **permanece inalterado**.
- Nenhuma outra parte de `renderDispositivos` foi alterada.

---

## CORREÇÃO 6 — A5: Tipo do equipamento com label legível no PDF do Manager
**Arquivo:** `ColectTap_Manager_v1_14.html`
**Localizar pela string:** `y=secTit(y,eq,'1. Identificação do Equipamento');`

**Problema:** O campo `eq.tipo` é gravado em minúsculo (`'vaso'`, `'caldeira'`...). Na linha do PDF que exibe TAG e Tipo, `tipoLabel()` existe e já é chamada corretamente em outros contextos, mas não nesta linha.

**Localizar:**
```js
    y=row2(y,eq,[{l:'TAG',v:eq.tag},{l:'Tipo',v:eq.tipo}]);
```

**Substituir por:**
```js
    y=row2(y,eq,[{l:'TAG',v:eq.tag},{l:'Tipo',v:tipoLabel(eq.tipo)}]);
```

**Verificação:** `tipoLabel` já existe no arquivo e não precisa ser criada. Apenas esta linha muda.

---

## CORREÇÃO 7 — A6: Datas de vencimento formatadas no PDF do Manager
**Arquivo:** `ColectTap_Manager_v1_14.html`

**Problema:** `venc_manometro` e `venc_valvula` chegam do Sheets como string ISO (`'2026-05-19'`) ou objeto Date serializado (`'2026-05-19T03:00:00.000Z'`). O PDF exibe o valor bruto.

**Ação 1 — Criar a função `fmtDate`.**
Localizar a função `function s(v)` (helper de string) e, imediatamente após seu fechamento `}`, inserir:

```js
function fmtDate(v) {
  if (!v) return '—';
  const str = String(v);
  // ISO completo: 2026-05-19T03:00:00.000Z
  const isoFull = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFull) return isoFull[3] + '/' + isoFull[2] + '/' + isoFull[1];
  // Somente data: 2026-05-19
  const isoDate = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return isoDate[3] + '/' + isoDate[2] + '/' + isoDate[1];
  return str;
}
```

**Ação 2 — Aplicar `fmtDate` nas linhas de vencimento.**
Localizar:
```js
    y=row2(y,eq,[{l:'Cert. Manômetro',v:eq.cert_manometro},{l:'Venc. Calibração',v:eq.venc_manometro}]);
```
Substituir por:
```js
    y=row2(y,eq,[{l:'Cert. Manômetro',v:eq.cert_manometro},{l:'Venc. Calibração',v:fmtDate(eq.venc_manometro)}]);
```

Localizar:
```js
    y=row2(y,eq,[{l:'Cert. PSV',v:eq.cert_valvula},{l:'PA da PSV',v:eq.pa_valvula}]);
```
Substituir por (inserir linha adicional de vencimento da PSV logo após):
```js
    y=row2(y,eq,[{l:'Cert. PSV',v:eq.cert_valvula},{l:'PA da PSV',v:eq.pa_valvula}]);
    if(s(eq.venc_valvula))y=row2(y,eq,[{l:'Venc. Calibração PSV',v:fmtDate(eq.venc_valvula)}]);
```

**Verificação:**
- `fmtDate` definida no escopo global do JS, após `function s(v)`.
- `venc_manometro` passa por `fmtDate` no PDF.
- `venc_valvula` passa por `fmtDate` e só renderiza se não vazio.
- Nenhuma outra linha foi alterada.

---

## CORREÇÃO 8 — D3: Categoria exibida com prefixo no PDF do Manager
**Arquivo:** `ColectTap_Manager_v1_14.html`

**Problema:** `eq.categoria` é gravado como letra solta (`'V'`, `'I'`, `'A'`). No PDF aparece apenas a letra, sem contexto.

**Localizar:**
```js
    y=row2(y,eq,[{l:'Ano Fabricação',v:eq.ano_fabricacao},{l:'Categoria',v:eq.categoria}]);
```
**Substituir por:**
```js
    y=row2(y,eq,[{l:'Ano Fabricação',v:eq.ano_fabricacao},{l:'Categoria',v:s(eq.categoria)?'Categoria '+s(eq.categoria):undefined}]);
```

**Verificação:** Se `eq.categoria === 'V'`, o PDF imprime `Categoria V`. Se vazio, não imprime nada (comportamento igual ao original).

---

## CORREÇÃO 9 — D1: Unidades nos labels de pressão/dimensão no PDF do Manager
**Arquivo:** `ColectTap_Manager_v1_14.html`

**Problema:** Labels como `'P. Trabalho'`, `'P. Teste'`, `'Temperatura'`, `'Diâmetro'`, `'Comprimento'`, `'Esp. Parede'` no PDF não indicam unidade, dificultando leitura do relatório.

**Localizar este bloco:**
```js
    y=row2(y,eq,[{l:'PMTA (kgf/cm²)',v:eq.pmta},{l:'P. Trabalho',v:eq.pressao_trabalho}]);
    y=row2(y,eq,[{l:'P. Teste',v:eq.pressao_teste},{l:'Temperatura',v:eq.temperatura}]);
    y=row2(y,eq,[{l:'Volume (m³)',v:eq.volume},{l:'Material',v:eq.material}]);
    y=row2(y,eq,[{l:'Diâmetro',v:eq.diametro},{l:'Comprimento',v:eq.comprimento}]);
    y=row2(y,eq,[{l:'Esp. Parede',v:eq.espessura_parede},{l:'Isolamento',v:eq.isolamento}]);
```

**Substituir por:**
```js
    y=row2(y,eq,[{l:'PMTA (kgf/cm²)',v:eq.pmta},{l:'P. Trabalho (kgf/cm²)',v:eq.pressao_trabalho}]);
    y=row2(y,eq,[{l:'P. Teste (kgf/cm²)',v:eq.pressao_teste},{l:'Temperatura (°C)',v:eq.temperatura}]);
    y=row2(y,eq,[{l:'Volume (m³)',v:eq.volume},{l:'Material',v:eq.material}]);
    y=row2(y,eq,[{l:'Diâmetro (mm)',v:eq.diametro},{l:'Comprimento (mm)',v:eq.comprimento}]);
    y=row2(y,eq,[{l:'Esp. Parede (mm)',v:eq.espessura_parede},{l:'Isolamento',v:eq.isolamento}]);
```

**Verificação:** Apenas os labels das 5 linhas mudaram. Nenhum valor (`v:`) foi alterado.

---

## CORREÇÃO 10 — GAS: Atualizar comentário de cabeçalho + novos campos A3/A4
**Arquivo:** `ColectTap_GAS_v1_14.js`

### 10a — Comentário de cabeçalho
**Localizar:**
```js
// Versão: v1.11 — Maio/2026
```
**Substituir por:**
```js
// Versão: v1.15 — Maio/2026
```

### 10b — Novos campos criados pelas correções A3 e A4
As correções 4 e 5 introduzem dois novos campos: `motivo_nao_calibracao_man` e `motivo_nao_calibracao_psv`. Eles precisam ser mapeados no GAS para não se perderem.

**Localizar a linha de mapeamento do diâmetro** (dentro de `salvarEquipamento`, objeto `campos`):
```js
    diametro: eq.diametro || eq.diametro_externo_mm || eq.diametro_externo_calculado_mm || '',
```

Logo após esta linha, **adicionar:**
```js
    motivo_nao_calibracao_man: eq.motivo_nao_calibracao_man || '',
    motivo_nao_calibracao_psv: eq.motivo_nao_calibracao_psv || '',
```

**Localizar a função `getCabecalhoEquip()`** — pela string `function getCabecalhoEquip()`.
Dentro do array de cabeçalhos, localizar a string `'enq_motivo'` (adicionada na Fase 1):
```js
    'enquadra_nr13','enq_motivo','base_enquadramento',
```
**Adicionar os dois novos campos** na seção de dispositivos de segurança. Localizar:
```js
    'possui_manometro','manometro_calibrado','cert_manometro','venc_manometro',
```
**Substituir por:**
```js
    'possui_manometro','manometro_calibrado','cert_manometro','venc_manometro','motivo_nao_calibracao_man',
```
E localizar:
```js
    'possui_valvula','valvula_calibrada','cert_valvula','venc_valvula','pa_valvula',
```
**Substituir por:**
```js
    'possui_valvula','valvula_calibrada','cert_valvula','venc_valvula','pa_valvula','motivo_nao_calibracao_psv',
```

**Verificação:**
- Comentário de cabeçalho diz `v1.15`.
- `APP_VERSION` permanece `'ColectTap-GAS-v1.15'` — **atualizar também esta constante**.
- `motivo_nao_calibracao_man` e `motivo_nao_calibracao_psv` presentes no objeto `campos` e no `getCabecalhoEquip()`.
- Nenhuma outra função foi alterada.

> **Nota de deploy:** Após qualquer alteração no GAS, é obrigatório republicar como nova versão no Google Apps Script. O Field exibe a versão retornada pelo endpoint de health — enquanto o deploy não for feito, continuará exibindo a versão anterior.

---

## BUMP DE VERSÃO

**Field:** substituir todas as ocorrências de `v2.12` por `v2.13`:
- `<title>` tag
- `<div class="pl-sub">Engetap · NR-13 · v2.12...`
- `doc.text('ColectTap v2.12 | Gerado em...`
- Qualquer outra ocorrência da string `v2.12` no arquivo

**Manager:** substituir todas as ocorrências de `v1.14` por `v1.15`:
- `<title>` tag
- `<div class="version">ColectTap Manager v1.14</div>`
- `Painel de Gestão · Engetap · NR-13 · v1.14...`
- Qualquer outra ocorrência da string `v1.14` no arquivo

**GAS:** substituir `'ColectTap-GAS-v1.14'` por `'ColectTap-GAS-v1.15'` na constante `APP_VERSION` (linha 9).

---

## INSTRUÇÕES DE COMMIT

Após todas as correções e bump de versão:

1. Copiar `src/ColectTap_v2_12.html` → salvar como `output/ColectTap_v2_13.html` com todas as correções aplicadas.
2. Copiar `src/ColectTap_Manager_v1_14.html` → salvar como `output/ColectTap_Manager_v1_15.html` com todas as correções aplicadas.
3. Copiar `src/ColectTap_GAS_v1_14.js` → salvar como `output/ColectTap_GAS_v1_15.js` com todas as correções aplicadas.
4. Copiar este arquivo para `prompts/Prompt_Codex_ColectTap_Fase3.md`.
5. Fazer commit com mensagem: `feat: Fase 3 — B2/B3/B4 NR-13, A3/A4 condicionais calibração, A5/A6/D1/D3 PDF Manager, GAS v1.15`

---

## CHECKLIST DE AUTO-AUDITORIA (executar antes de commitar)

- [ ] `Categoria V` não contém mais a palavra "(Isento)".
- [ ] Array `caldeira` em categorias contém apenas `Categoria A` e `Categoria B` — sem `Categoria C`.
- [ ] `classesFluido` com 4 entradas atualizadas (PF < 37,8°C / PF ≥ 37,8°C / combustível / vapor≥45°C).
- [ ] `cert_manometro` e `venc_manometro` só renderizam dentro de `if (manCalib === 'Sim')`.
- [ ] `motivo_nao_calibracao_man` renderiza apenas quando `manCalib === 'Não'`.
- [ ] `cert_valvula` e `venc_valvula` só renderizam dentro de `if (psvCalib === 'Sim')`.
- [ ] `motivo_nao_calibracao_psv` renderiza apenas quando `psvCalib === 'Não'`.
- [ ] `pa_valvula` e `valvula_adequada` continuam renderizando normalmente (não foram condicionalizados).
- [ ] Bloco `if (psvAdq === 'Não')` após o trecho da PSV permanece inalterado.
- [ ] Manager PDF linha 1722: `{l:'Tipo',v:tipoLabel(eq.tipo)}` — não mais `eq.tipo` bruto.
- [ ] `fmtDate()` definida no escopo global do Manager JS.
- [ ] `venc_manometro` passa por `fmtDate()` no PDF do Manager.
- [ ] `venc_valvula` passa por `fmtDate()` e só renderiza se não vazio.
- [ ] Categoria no PDF exibe `'Categoria ' + eq.categoria` (não letra solta).
- [ ] Labels de pressão, temperatura e dimensão com unidades: `(kgf/cm²)`, `(°C)`, `(mm)`.
- [ ] GAS: comentário cabeçalho diz `v1.15`.
- [ ] GAS: `APP_VERSION = 'ColectTap-GAS-v1.15'`.
- [ ] GAS: `motivo_nao_calibracao_man` e `motivo_nao_calibracao_psv` no objeto `campos`.
- [ ] GAS: ambos os campos adicionados ao `getCabecalhoEquip()`.
- [ ] Versões atualizadas nos três arquivos de saída.
- [ ] Nenhuma outra função foi modificada além das listadas acima.
