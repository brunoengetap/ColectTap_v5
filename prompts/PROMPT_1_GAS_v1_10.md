# Prompt Codex 1 de 3 — ColectTap GAS v1.10
**Arquivo base:** `ColectTap_GAS_v1_9.js`
**Arquivo de saída:** `ColectTap_GAS_v1_10.js`
**Objetivo:** 4 acréscimos cirúrgicos. Nenhuma função existente é removida ou alterada — apenas adições.

---

## CONTEXTO GLOBAL

O GAS usa `garantirColunas(aba, [...])` para garantir que colunas existam na Sheets sem sobrescrever dados. O router usa `switch(action)` em `doGet`/`doPost`. A função `atualizarOSColect` lê/grava a aba OS por header name (não por índice fixo). O campo `updFields` dentro de `atualizarOSColect` lista explicitamente quais campos são atualizáveis.

---

## MUDANÇA 1 — Adicionar `foto_capa_key` à garantirColunas da aba EQUIP

**Localização:** Dentro de `salvarLevantamentoNR13`, no bloco `garantirColunas(aba, [...])`.

**Ação:** Adicionar `'foto_capa_key'` ao final do array existente (antes do `]);`).

**Array atual termina com:**
```javascript
    'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo',
  ]);
```

**Deve ficar:**
```javascript
    'data_primeira_coleta_campo','data_primeira_coleta_documentos','data_ultima_alternancia_fluxo',
    'foto_capa_key',
  ]);
```

---

## MUDANÇA 2 — Mapear `foto_capa_key` no `upsertEquipamentoNR13`

**Localização:** Dentro de `upsertEquipamentoNR13`, no objeto `const campos = { ... }`.

**Ação:** Adicionar a linha abaixo imediatamente antes do fechamento do objeto `campos` (antes da linha `if (rowIndex < 0) campos.data_criacao = nowIso;`).

**Linha a adicionar no final do objeto `campos`:**
```javascript
    foto_capa_key: eq.foto_capa_key || '',
```

O objeto `campos` já termina com `data_atualizacao: nowIso`. Adicionar `foto_capa_key` como última propriedade antes do `};`.

---

## MUDANÇA 3 — Adicionar `os_status` à aba OS

### 3a — `garantirAbas`: adicionar `os_status` na criação da aba OS

**Localização:** Dentro de `garantirAbas()`, no bloco `// OS_COLECT`:

```javascript
  // OS_COLECT
  aba = ss.getSheetByName(ABA_OS);
  if (!aba) {
    aba = ss.insertSheet(ABA_OS);
    aba.appendRow(['id_os','numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','criado_em']);
```

**Deve ficar** (adicionar `'os_status'` ao array do `appendRow`):
```javascript
  // OS_COLECT
  aba = ss.getSheetByName(ABA_OS);
  if (!aba) {
    aba = ss.insertSheet(ABA_OS);
    aba.appendRow(['id_os','numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','criado_em','os_status']);
```

### 3b — `atualizarOSColect`: adicionar `os_status` ao `updFields` e ao `garantirColunas`

**Localização:** Dentro de `atualizarOSColect(params)`.

**Ação 1:** Adicionar `garantirColunas` no início da função, logo após obter `const aba = getOuCriarAba(ABA_OS);`:

```javascript
function atualizarOSColect(params) {
  const id = norm(params.id_os);
  if (!id) return { status:'erro', mensagem:'id_os obrigatório' };

  const aba = getOuCriarAba(ABA_OS);
  garantirColunas(aba, ['os_status']);   // ← ADICIONAR ESTA LINHA
  const dados = aba.getDataRange().getValues();
```

**Ação 2:** Adicionar `'os_status'` ao array `updFields`:

```javascript
  // ANTES:
  const updFields = ['numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp'];

  // DEPOIS:
  const updFields = ['numero_os','id_cliente','cliente','descricao','data_abertura','status','id_inspetor_resp','os_status'];
```

---

## MUDANÇA 4 — Novo endpoint `getFotoBase64`

### 4a — Router: adicionar o case

**Localização:** No `switch(action)` do router (dentro de `doGet`/`doPost`), adicionar imediatamente após a linha do `case 'atualizarEquipamentoRevisao'`:

```javascript
      case 'atualizarEquipamentoRevisao': result = atualizarEquipamentoRevisao(params); break;
      case 'getFotoBase64':               result = getFotoBase64(params);               break;  // ← ADICIONAR
```

### 4b — Implementação da função

**Localização:** Adicionar a função completa ao final do arquivo, antes da última linha (se houver comentário de fechamento, inserir antes dele).

```javascript
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
```

---

## MUDANÇA 5 — Bump de versão

**Localização:** Constante `APP_VERSION` no topo do arquivo.

```javascript
// ANTES:
const APP_VERSION = 'GAS-1.9';

// DEPOIS:
const APP_VERSION = 'GAS-1.10';
```

---

## CHECKLIST DE AUTO-AUDITORIA (executar antes de commitar)

- [ ] `foto_capa_key` aparece exatamente uma vez em `garantirColunas` (dentro de `salvarLevantamentoNR13`)
- [ ] `foto_capa_key` aparece exatamente uma vez no objeto `campos` de `upsertEquipamentoNR13`
- [ ] `os_status` aparece em `garantirAbas` (array do `appendRow` da aba OS) — apenas se a aba for criada do zero
- [ ] `os_status` aparece em `garantirColunas` dentro de `atualizarOSColect`
- [ ] `os_status` aparece em `updFields` dentro de `atualizarOSColect`
- [ ] `case 'getFotoBase64'` existe no switch do router
- [ ] Função `getFotoBase64` existe e usa `DriveApp.getFileById`, `Utilities.base64Encode`, e `logErro`
- [ ] `APP_VERSION` foi atualizado para `'GAS-1.10'`
- [ ] Nenhuma função existente foi removida ou alterada
- [ ] O arquivo compila sem erros de sintaxe (verificar chaves e parênteses balanceados)
