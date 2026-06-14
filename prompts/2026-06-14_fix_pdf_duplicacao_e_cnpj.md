# Prompt Codex — Correção cirúrgica: duplicação de campos no PDF (Manager) + setNumberFormat CNPJ (GAS)

## Contexto
Sistema ColectTap (NR-13, Engetap). Versões de referência atuais:
- Field: `ColectTap_v2_16.html` (sem alterações neste ciclo)
- Manager: `ColectTap_Manager_v1_19.html`
- GAS: `ColectTap_GAS_v1_17__1_.js`

Esta correção é **urgente e cirúrgica** — o sistema entra em uso real com cliente já amanhã. Faça **apenas** as duas alterações descritas abaixo, sem refatorações, sem "melhorias" adicionais, sem tocar em nenhum outro trecho dos arquivos. Qualquer mudança fora do escopo descrito deve ser evitada.

---

## CORREÇÃO 1 — Duplicação de campos de dimensões no PDF (Manager)

**Arquivo:** `ColectTap_Manager_v1_19.html`
**Função:** `gerarConteudoEquip(eq, fotosEquip)`, dentro de `_gerarPDFEquipamentos`

### Problema
O bloco genérico de dimensões é executado para todos os tipos exceto tubulação:

```javascript
if(s(eq.tipo)!=='tubulacao'){
  y=row2(y,eq,[{l:'Volume (L)',v:eq.volume},{l:'Material',v:eq.material}]);
  y=row2(y,eq,[{l:'Diâmetro (mm)',v:eq.diametro},{l:'Comprimento (mm)',v:eq.comprimento}]);
  y=row2(y,eq,[{l:'Espessura de Parede (mm)',v:eq.espessura_parede},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
}
```

Em seguida, os blocos específicos de `caldeira` e `tanque` também imprimem linhas equivalentes de dimensões (Volume, Material, Diâmetro/Altura, Espessura, Isolamento), resultando em **linhas duplicadas no PDF para equipamentos do tipo caldeira e tanque**.

O bloco do tipo `vaso` já está vazio, com o comentário:
```javascript
if(s(eq.tipo)==='vaso'){
  // vaso já tem diametro/comprimento/espessura/material acima no bloco genérico
}
```
Isso confirma que o bloco genérico foi originalmente pensado **apenas para o tipo `vaso`**.

### Correção exata
Trocar a condição do bloco genérico de:
```javascript
if(s(eq.tipo)!=='tubulacao'){
```
para:
```javascript
if(s(eq.tipo)==='vaso'){
```

### Resultado esperado após a correção
- **vaso**: continua recebendo Volume/Material/Diâmetro/Comprimento/Espessura/Isolamento — agora exclusivamente pelo bloco genérico (o bloco `if(s(eq.tipo)==='vaso'){ // vazio }` permanece vazio e sem necessidade de alteração).
- **caldeira**: dimensões aparecem **apenas uma vez**, vindas do bloco específico de caldeira (Capacidade de Vapor, Área de Aquecimento, Combustível, Pressão de Projeto, Material do Casco, Isolamento).
- **tanque**: dimensões aparecem **apenas uma vez**, vindas do bloco específico de tanque (Diâmetro, Altura, Volume, Tipo de Teto, Material, Revestimento, Espessura, Isolamento).
- **tubulação**: comportamento inalterado (já era excluído antes e continua sendo, agora por não satisfazer `=== 'vaso'`).

### ⚠️ Atenção — não alterar nada além da condição
Não altere o conteúdo interno do bloco genérico, nem os blocos específicos de `tubulacao`, `caldeira`, `tanque`, `vaso`. A única mudança é a condição na linha do `if`.

---

## CORREÇÃO 2 — `setNumberFormat('@')` ausente em `atualizarClienteLead` (GAS)

**Arquivo:** `ColectTap_GAS_v1_17__1_.js`
**Função:** `atualizarClienteLead(params)`

### Problema
Ao **criar** um cliente (`salvarClienteLead`), o campo CNPJ é gravado com `setNumberFormat('@')` para forçar formato texto e evitar coerção numérica (perda de zeros à esquerda, notação científica, etc.):

```javascript
const next = aba.getLastRow() + 1;
aba.getRange(next, 1, 1, row.length).setNumberFormat('@');
aba.getRange(next, 1, 1, row.length).setValues([row]);
```

Porém, ao **atualizar** um cliente existente (`atualizarClienteLead`), essa formatação **não é aplicada**:

```javascript
const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];
const updFields = ['nome','cnpj','contato','email','telefone','status_lead'];
updFields.forEach(k => {
  const idx = header.indexOf(k);
  if (params[k] !== undefined && idx >= 0) rowData[idx] = norm(params[k]);
});
aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
return { status:'ok', id_cliente: id };
```

Isso pode causar coerção numérica do CNPJ (perda de zeros à esquerda) quando um cliente já existente é editado pelo Manager.

### Correção exata
Adicionar a chamada `setNumberFormat('@')` na mesma `Range` usada por `.setValues([rowData])`, **antes** dessa chamada, em `atualizarClienteLead`:

```javascript
const rowData = aba.getRange(rowIndex, 1, 1, aba.getLastColumn()).getValues()[0];
const updFields = ['nome','cnpj','contato','email','telefone','status_lead'];
updFields.forEach(k => {
  const idx = header.indexOf(k);
  if (params[k] !== undefined && idx >= 0) rowData[idx] = norm(params[k]);
});
aba.getRange(rowIndex, 1, 1, rowData.length).setNumberFormat('@');
aba.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
return { status:'ok', id_cliente: id };
```

### ⚠️ Atenção — não alterar nada além de adicionar essa linha
Não altere `updFields`, a lógica de busca de `rowIndex`, nem qualquer outra função do arquivo (especialmente não tocar em `salvarClienteLead`, `salvarInspetor`, `atualizarInspetor`, que já estão corretas).

---

## Versionamento (obrigatório)

Após aplicar as duas correções, bump de versão **apenas** nos componentes alterados:

### Manager → v1.20
Atualizar **todas** as ocorrências da string de versão, mantendo o padrão já usado no arquivo:
- `<title>ColectTap Manager v1.19</title>` → `v1.20`
- `<p style="color:var(--text2);font-size:13px">Painel de Gestão · Engetap · NR-13 · v1.19 · GAS v1.17</p>` → `v1.20` (manter `GAS v1.17` sem alteração, pois o GAS não terá bump de versão visível — ver nota abaixo)
- `<div class="version">ColectTap Manager v1.19</div>` → `v1.20`
- `doc.text('Gerado por ColectTap Manager v1.19  ·  Engetap Engenharia  ·  uso interno', ML, 290);` → `v1.20`

### GAS → manter v1.17, sem bump
A correção em `atualizarClienteLead` é mínima e não altera comportamento de versão/health-check. **Não alterar** `APP_VERSION = 'ColectTap-GAS-v1.17'` nem qualquer outra referência de versão do GAS. (Se preferir registrar a mudança internamente, pode adicionar um comentário de uma linha acima da função `atualizarClienteLead` indicando a correção, mas isso é opcional e não deve afetar nenhuma string de versão.)

### Field → sem alteração
Nenhuma mudança no `ColectTap_v2_16.html`. Não criar nova versão do Field.

---

## Nomenclatura dos arquivos de saída

Salvar os arquivos corrigidos em `output/` com os nomes:
- `ColectTap_Manager_v1_20.html`
- `ColectTap_GAS_v1_17.js` (mesmo conteúdo do v1.17 original + correção 2, sem mudança de `APP_VERSION`)

Não recriar/tocar o arquivo do Field.

---

## Checklist de autoauditoria (preencher ao final, antes de entregar)

1. [ ] A condição do bloco genérico de dimensões em `gerarConteudoEquip` foi alterada de `s(eq.tipo)!=='tubulacao'` para `s(eq.tipo)==='vaso'` — e **somente** essa condição foi alterada.
2. [ ] Gerar mentalmente o PDF para um equipamento tipo `caldeira`: confirmar que "Volume (L)/Material", "Diâmetro (mm)/Comprimento (mm)", "Espessura de Parede/Possui Isolamento?" do bloco genérico **não aparecem mais**, e que aparecem apenas os campos do bloco específico de caldeira (Capacidade de Vapor, Área de Aquecimento, Combustível, Pressão de Projeto, Material do Casco, Isolamento).
3. [ ] Repetir o mesmo raciocínio para `tanque`: confirmar ausência de duplicação, mantendo apenas os campos do bloco específico de tanque.
4. [ ] Confirmar que `vaso` continua exibindo Volume/Material/Diâmetro/Comprimento/Espessura/Isolamento normalmente (via bloco genérico agora restrito a `vaso`).
5. [ ] Confirmar que `tubulacao` permanece sem nenhuma alteração de comportamento.
6. [ ] Em `atualizarClienteLead`, confirmar que `setNumberFormat('@')` foi adicionado na `Range` correta, imediatamente antes do `.setValues([rowData])`, e que nenhuma outra função do GAS foi tocada.
7. [ ] Confirmar `APP_VERSION` do GAS permanece `'ColectTap-GAS-v1.17'` (inalterado).
8. [ ] Confirmar todas as 4 ocorrências da string de versão no Manager foram atualizadas de `v1.19` para `v1.20` de forma consistente (title, subtítulo de login, sidebar/header `.version`, rodapé do PDF).
9. [ ] Validar sintaticamente os dois arquivos finais (sem erros de JS — `node --check` equivalente).
10. [ ] Nenhuma outra função, string, comentário ou trecho de código foi alterado além do estritamente descrito neste prompt.

---

## Prompt curto para colar na interface do Codex (referência ao arquivo completo)

> Leia o arquivo `prompts/2026-06-14_fix_pdf_duplicacao_e_cnpj.md` neste repositório e aplique exatamente as duas correções descritas: (1) trocar a condição do bloco genérico de dimensões em `gerarConteudoEquip` (Manager) de `s(eq.tipo)!=='tubulacao'` para `s(eq.tipo)==='vaso'`, eliminando a duplicação de campos no PDF para caldeira e tanque; (2) adicionar `setNumberFormat('@')` em `atualizarClienteLead` (GAS) antes do `.setValues([rowData])`, igual ao que já existe em `salvarClienteLead`. Faça o bump de versão do Manager para v1.20 em todas as 4 ocorrências da string de versão, sem alterar a versão do GAS. Não faça nenhuma outra alteração além dessas. Ao final, preencha o checklist de autoauditoria do arquivo de prompt e salve os arquivos em `output/` como `ColectTap_Manager_v1_20.html` e `ColectTap_GAS_v1_17.js`.
