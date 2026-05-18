# ColectTap v1.9 — Correções cirúrgicas

## Falha 1 — Back-guard visual
- Implementado modal visual de back-guard com 3 ações (continuar, salvar e sair, sair sem salvar).
- Adicionado CSS do modal (`.back-guard`, `.back-guard-box`, `.back-guard-actions`, botões).
- Inserido `<div id="colectBackGuard">` antes do overlay de loading.
- Substituído tratamento antigo de `popstate`/`beforeunload` por `setupColectBackGuard()`.
- Incluída flag global `_allowLeave` e funções:
  - `guardarColectFicar()`
  - `guardarColectSalvarSair()`
  - `guardarColectSairSemSalvar()`
- `setupColectBackGuard()` agora é chamado na inicialização.

## Falha 2 — Duplicação e perda de `sync_status`
- `captureCurrentScreenState()` não chama mais `persistCurrentEquipDraft`; agora delega apenas para `saveOSDraft(reason)`.
- `persistCurrentEquipDraft` mantida apenas por compatibilidade e marcada como obsoleta.
- `saveOSDraft(reason)` refatorada para:
  - preservar status de equipamentos já existentes (`status_completude`, `sync_status`, `synced_at`);
  - incluir equipamento em edição ainda não salvo no array (`equipEdit === null` + `SES.dados` com conteúdo);
  - evitar serialização de campos internos dentro de `dados` (incluindo `_fotos`);
  - atualizar item em edição sem rebaixar status indevidamente.
- `selectOS()` ajustada para restaurar `sync_status` e `synced_at` corretamente.
- `salvarEquipamento()` ajustada para preservar metadados vindos do servidor (`drive_folder_*`, `created_at`) e limpar `SES.equipEdit = null` após salvar.
- `abrirNovoEquip()` reforçada para limpar estado de edição e `SES.tipoEquip = null`.
- `enviarGAS()` passa a registrar `synced_at` ao marcar `sync_status = 'synced'`.

## Versionamento
- Título/label atualizado para **ColectTap v1.9**.
- `APP_VERSION` atualizada para `'ColectTap-v1.9'`.

## Arquivos gerados
- `output/ColectTap_v1_9.html`
- `docs/CHANGES_v1_9.md`

> Não foi necessário gerar novo GAS nesta correção.
