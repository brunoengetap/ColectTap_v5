# Prompt Codex — ColectTap Field v2.14 + Manager v1.16
## 6 correções cirúrgicas · Saída em `output/`

---

## CONTEXTO

Repositório `ColectTap_v5`, estrutura:
```
src/
  ColectTap_v2_13.html       ← Field app (mobile, coleta de campo)
  ColectTap_Manager_v1_15.html ← Manager (dashboard web, gera PDF)
  ColectTap_GAS_v1_15.js     ← Backend GAS (não alterar)
output/                       ← destino dos arquivos gerados
```

Gere dois arquivos de saída:
- `output/ColectTap_v2_14.html`   (baseado em `src/ColectTap_v2_13.html`)
- `output/ColectTap_Manager_v1_16.html` (baseado em `src/ColectTap_Manager_v1_15.html`)

Bumpe a string de versão interna em cada arquivo:
- Field: toda ocorrência de `v2.13` → `v2.14`
- Manager: toda ocorrência de `v1.15` → `v1.16`

---

## CORREÇÕES — Field (`ColectTap_v2_14.html`)

---

### FIX-F1 — Remover "BPVC" das strings de código de projeto

**Localizar** a constante/objeto `getCodigoProjetoSelect` (ou equivalente) que contém os arrays de opções de código de projeto para cada tipo de equipamento. Atualmente as strings têm o formato `'ASME BPVC Section VIII Div. 1'`.

**Substituir** todas as ocorrências removendo o trecho ` BPVC` (espaço + BPVC):

| De | Para |
|----|------|
| `'ASME BPVC Section VIII Div. 1'` | `'ASME Section VIII Div. 1'` |
| `'ASME BPVC Section VIII Div. 2'` | `'ASME Section VIII Div. 2'` |
| `'ASME BPVC Section VIII Div. 3'` | `'ASME Section VIII Div. 3'` |
| `'ASME BPVC Section X'`           | `'ASME Section X'`           |
| `'ASME BPVC Section I'`           | `'ASME Section I'`           |
| `'ASME BPVC Section IV'`          | `'ASME Section IV'`          |
| `'ASME BPVC Section VIII, se aplicável'` | `'ASME Section VIII, se aplicável'` |

Aplicar em **todos** os lugares do arquivo onde essas strings aparecem (arrays de opções, comparações, lógica de enquadramento, etc.).

---

### FIX-F2 — Corrigir classes de fluido conforme NR-13 item 13.5.1.1.1

**Localizar** o array `classesFluido` (aproximadamente linha 1724) com o seguinte conteúdo atual:

```js
const classesFluido = [
  {v:'A',l:'Classe A — Tóxico/Letal ou Inflamável com PF < 37,8°C'},
  {v:'B',l:'Classe B — Inflamável com PF ≥ 37,8°C'},
  {v:'C',l:'Classe C — Combustível ou não inflamável/não tóxico'},
  {v:'D',l:'Classe D — Vapor d\'água, água quente ≥ 45°C'},
];
```

**Substituir** pelo conteúdo abaixo, fiel ao texto normativo NR-13 item 13.5.1.1.1:

```js
const classesFluido = [
  {v:'A',l:'Classe A — Inflamável; combustível ≥ 200°C; tóxico ≤ 20 ppm; H₂ ou acetileno'},
  {v:'B',l:'Classe B — Combustível < 200°C ou tóxico > 20 ppm'},
  {v:'C',l:'Classe C — Vapor d\'água, gases asfixiantes simples ou ar comprimido'},
  {v:'D',l:'Classe D — Outros fluidos não enquadrados nas classes anteriores'},
];
```

> **Importante:** os valores `v` ('A','B','C','D') não mudam — apenas os labels `l`.  
> Não alterar nenhuma outra lógica que dependa de `d.classe_fluido`.

---

### FIX-F3 — Corrigir IDs dos checkboxes de documentos (acentuação)

**Causa raiz:** a função `checkList` gera IDs derivando do label do item via:
```js
item.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')
```
Caracteres acentuados (ã, ç, é, õ, etc.) são removidos pelo segundo `.replace`, produzindo IDs truncados (ex.: `"Prontuário"` → `"Pronturio"`). Quando `serializarChecks` no GAS reconstrói o texto a partir do ID, saem os textos mutilados.

**Solução — slugs ASCII predefinidos para cada item de documento:**

Localizar os arrays de documentos por tipo de equipamento (aproximadamente linha 1892), que atualmente são:

```js
vaso:     ['Prontuário do vaso (fabricante)','Registro de segurança',
           'Relatórios de inspeção anteriores','Projeto de Alteração e Reparo (PAR)',
           'Certificado de calibração PSV','Certificado de calibração manômetro',
           'Projeto de instalação'],
caldeira: ['Prontuário da caldeira (fabricante)','Registro de segurança',
           'Relatórios de inspeção anteriores','Projeto de Alteração e Reparo (PAR)',
           'Certificado de calibração PSV','Certificado de calibração manômetro',
           'Projeto de instalação','Licença de operação'],
```

**Converter esses arrays de strings para arrays de objetos `{id, label}`:**

```js
vaso: [
  {id:'prontuario_fabricante',      label:'Prontuário do vaso (fabricante)'},
  {id:'registro_seguranca',         label:'Registro de segurança'},
  {id:'relatorios_inspecao_ant',    label:'Relatórios de inspeção anteriores'},
  {id:'projeto_alteracao_reparo',   label:'Projeto de Alteração e Reparo (PAR)'},
  {id:'cert_calibracao_psv',        label:'Certificado de calibração PSV'},
  {id:'cert_calibracao_manometro',  label:'Certificado de calibração manômetro'},
  {id:'projeto_instalacao',         label:'Projeto de instalação'},
],
caldeira: [
  {id:'prontuario_fabricante',      label:'Prontuário da caldeira (fabricante)'},
  {id:'registro_seguranca',         label:'Registro de segurança'},
  {id:'relatorios_inspecao_ant',    label:'Relatórios de inspeção anteriores'},
  {id:'projeto_alteracao_reparo',   label:'Projeto de Alteração e Reparo (PAR)'},
  {id:'cert_calibracao_psv',        label:'Certificado de calibração PSV'},
  {id:'cert_calibracao_manometro',  label:'Certificado de calibração manômetro'},
  {id:'projeto_instalacao',         label:'Projeto de instalação'},
  {id:'licenca_operacao',           label:'Licença de operação'},
],
```

Se existirem arrays similares para `tubulacao` e `tanque`, aplicar a mesma conversão mantendo slugs ASCII coerentes.

**Atualizar a função `checkList`** para aceitar itens como `{id, label}` ou string (retrocompatibilidade):

```js
function checkList(id, label, items) {
  const checks = items.map(item => {
    const slug  = typeof item === 'string'
      ? item.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')
      : item.id;
    const txt   = typeof item === 'string' ? item : item.label;
    const iid   = id + '_' + slug;
    return `<div class="check-item" id="ci_${iid}" onclick="toggleCheck('${iid}')">
      <div class="check-box" id="cb_${iid}">✓</div>
      <div class="check-label">${txt}</div>
    </div>`;
  }).join('');
  return `<div class="field"><label>${label}</label><div class="check-list">${checks}</div></div>`;
}
```

**Atualizar a função `serializarChecks` no GAS** — NÃO ALTERAR (o GAS continuará recebendo `doc_prontuario_fabricante | doc_registro_seguranca | ...` e reconstruindo por `replace(/_/g,' ')`). O GAS receberá IDs legíveis sem acentos, o que resolve o problema.

> **Atenção:** verificar se existe algum trecho no Field que reconstrói `_checks` para exibição (ex.: preview de revisão) e garantir que use o campo `label` do objeto, não o ID.

---

## CORREÇÕES — Manager (`ColectTap_Manager_v1_16.html`)

---

### FIX-M1 — Foto da capa: preservar aspect ratio

**Localizar** a função `gerarCapaEngetap` (aproximadamente linha 1635). O trecho atual insere a foto da capa com altura fixa:

```js
const imgY=90, imgH=85;
// ...
doc.addImage('data:'+fotoCapa.mimeType+';base64,'+fotoCapa.base64, mt, ML, imgY, CW, imgH);
```

**Substituir** pela lógica proporcional (mesma técnica já usada nas fotos internas da seção 8):

```js
const imgY = 90;
const MAX_IMG_H = 100; // altura máxima permitida na capa (mm)
let imgH = MAX_IMG_H;  // fallback

try {
  const props = doc.getImageProperties('data:' + fotoCapa.mimeType + ';base64,' + fotoCapa.base64);
  if (props && props.width && props.height) {
    const ratio = props.height / props.width;
    imgH = Math.min(MAX_IMG_H, CW * ratio); // proporcional, limitado ao máximo
    imgH = Math.max(40, imgH);              // mínimo 40mm para não ficar minúscula
  }
} catch(e) {}

// Centralizar verticalmente se imgH < MAX_IMG_H
const imgYAdj = imgY + (MAX_IMG_H - imgH) / 2;

try {
  const mt = (fotoCapa.mimeType||'').toUpperCase().includes('PNG') ? 'PNG' : 'JPEG';
  doc.addImage('data:'+fotoCapa.mimeType+';base64,'+fotoCapa.base64, mt, ML, imgYAdj, CW, imgH);
} catch(e) {
  doc.setFillColor(220,230,245); doc.rect(ML, imgY, CW, MAX_IMG_H, 'F');
}
```

Ajustar `yBase` (posição do bloco de texto abaixo da foto) para usar `imgY + MAX_IMG_H + 10` — garante posição consistente independente do aspect ratio.

---

### FIX-M2 — Volume: trocar label "m³" por "L" (litros)

**Localizar** todas as ocorrências no Manager onde o volume é exibido com label `m³` ou `(m³)`:

1. Linha ~1742:
   ```js
   y=row2(y,eq,[{l:'Volume (m³)',v:eq.volume},{l:'Material',v:eq.material}]);
   ```
   → Trocar para:
   ```js
   y=row2(y,eq,[{l:'Volume (L)',v:eq.volume},{l:'Material',v:eq.material}]);
   ```

2. Linha ~1193 (tabela de detalhes):
   ```js
   ['Volume (m³)', eq.volume],
   ```
   ou similar → trocar label para `'Volume (L)'`.

3. Qualquer outro `'Volume (m³)'` ou `'Volume (m3)'` no arquivo → trocar para `'Volume (L)'`.

> O valor `eq.volume` não é alterado — apenas o label exibido.

---

### FIX-M3 — Foto invadindo o rodapé na seção de fotos (seção 8)

**Localizar** o loop de renderização de fotos na função `gerarConteudoEquip` (aproximadamente linha 1800). O trecho atual faz a verificação de quebra de página apenas quando `col === 0`:

```js
fotosEquip.forEach(foto => {
  // ...cálculo de imgH2...
  if(col===0) rowMaxH = imgH2;
  else rowMaxH = Math.max(rowMaxH, imgH2);
  if(col===0) y = ck(y, rowMaxH+20, eq);   // ← só verifica na col 0
  const imgX = ML + col*(PW2+4);
  // ...desenha foto...
  col++;
  if(col>=2){ col=0; y+=rowMaxH+16; rowMaxH=0; }
});
```

**Substituir** pela lógica que verifica antes de cada foto, usando um look-ahead para a altura da linha:

```js
fotosEquip.forEach(foto => {
  // Calcular altura proporcional desta foto
  let imgH2 = PW2 * 0.75; // fallback 4:3
  try {
    const props = doc.getImageProperties('data:'+foto.mimeType+';base64,'+foto.base64);
    if(props && props.width && props.height) imgH2 = PW2 * (props.height / props.width);
  } catch(e) {}
  imgH2 = Math.max(30, Math.min(imgH2, PW2 * 1.5));

  if(col === 0) {
    // Início de nova linha: verificar se cabe (foto + legenda + margem)
    rowMaxH = imgH2;
    y = ck(y, rowMaxH + 20, eq);
  } else {
    // Segunda coluna: se esta foto for maior que a primeira,
    // verificar se a linha ainda cabe com a nova altura
    const novoMaxH = Math.max(rowMaxH, imgH2);
    if (y + novoMaxH + 20 > PH - 22) {
      // Não cabe — fechar a linha atual e abrir nova página
      y += rowMaxH + 16;
      rowMaxH = 0;
      col = 0;
      y = ck(y, imgH2 + 20, eq);
      rowMaxH = imgH2;
    } else {
      rowMaxH = novoMaxH;
    }
  }

  const imgX = ML + col * (PW2 + 4);

  // Fundo e borda
  doc.setFillColor(245, 248, 255);
  doc.rect(imgX, y, PW2, rowMaxH, 'F');
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.rect(imgX, y, PW2, rowMaxH, 'S');

  // Inserir imagem
  try {
    const mt = (foto.mimeType||'').toUpperCase().includes('PNG') ? 'PNG' : 'JPEG';
    doc.addImage('data:'+foto.mimeType+';base64,'+foto.base64, mt, imgX+1, y+1, PW2-2, imgH2-2);
  } catch(e) {
    doc.setFillColor(220,230,245); doc.rect(imgX+1, y+1, PW2-2, imgH2-2, 'F');
  }

  // Legenda
  const legLines = doc.splitTextToSize(ltx(foto.label||foto.key), PW2-2);
  doc.setFont('helvetica','italic'); doc.setFontSize(7); doc.setTextColor(...REL_TEXT2);
  doc.text(legLines[0]||'', imgX, y + rowMaxH + 4);

  col++;
  if(col >= 2) { col = 0; y += rowMaxH + 16; rowMaxH = 0; }
});
if(col === 1) y += rowMaxH + 16;
```

> **Nota:** a variável `PH` já existe no escopo (`PH=297`). `PW2=(CW-4)/2` já está definida no escopo do bloco de fotos — mantê-la.

---

### FIX-M4 — Remover "BPVC" no relatório PDF (Manager)

O Manager exibe `eq.codigo_projeto` diretamente como texto via `row2` — não precisa de lógica especial. Porém, como o Field já terá sido corrigido (FIX-F1) e os dados novos chegarão sem "BPVC", adicionar uma função de normalização para dados legados:

**Localizar** a função `s(v)` ou o local onde `eq.codigo_projeto` é passado para `row2`. Adicionar limpeza:

```js
// Adicionar helper junto às outras funções utilitárias do Manager:
function normCodigo(v) {
  if (!v) return '';
  return String(v).replace(/\s*BPVC\s*/g, ' ').replace(/\s+/g,' ').trim();
}
```

**Aplicar** nas chamadas de exibição do código de projeto:

```js
// Na função gerarConteudoEquip, onde exibe código de projeto:
y=row2(y,eq,[{l:'Localização / Setor',v:eq.localizacao||eq.setor},{l:'Código Projeto',v:normCodigo(eq.codigo_projeto)}]);
```

Aplicar `normCodigo()` em **todos** os outros locais do Manager que exibem `eq.codigo_projeto`.

---

## SELF-AUDIT — Verificar antes de commitar

Após gerar os dois arquivos, confirmar:

- [ ] **F1:** Não existe nenhuma string `'BPVC'` nos arrays de opções de código de projeto do Field
- [ ] **F2:** Array `classesFluido` contém exatamente 4 opções com `v` A/B/C/D e labels conforme NR-13 13.5.1.1.1
- [ ] **F3:** Função `checkList` usa `item.id` para gerar `iid` quando item é objeto; arrays de documentos são objetos `{id, label}` com slugs ASCII puros
- [ ] **F3:** Nenhum slug de documento contém caracteres fora de `[a-zA-Z0-9_]`
- [ ] **M1:** Função `gerarCapaEngetap` usa `getImageProperties` para calcular altura proporcional da foto da capa
- [ ] **M2:** Não existe nenhuma label `'Volume (m³)'` ou `'Volume (m3)'` no Manager
- [ ] **M3:** Loop de fotos na seção 8 verifica quebra de página para col 0 e col 1
- [ ] **M4:** Helper `normCodigo` remove `BPVC` de valores legados; aplicado em todo `eq.codigo_projeto` exibido
- [ ] **Versões:** Field marcado como `v2.14`, Manager como `v1.16`
- [ ] **GAS:** arquivo GAS não foi alterado
- [ ] **Outputs:** ambos os arquivos gerados em `output/` com os nomes corretos

---

## RESTRIÇÕES

- **Não alterar** nenhum outro comportamento não listado acima
- **Não alterar** `ColectTap_GAS_v1_15.js`
- **Não alterar** lógica de autosave, envio ao GAS, login, navegação, enquadramento NR-13
- Manter toda estrutura HTML, CSS e JS existente intacta fora dos pontos de correção
- Os arquivos de saída devem ser **arquivos completos** (não patches/diffs)
