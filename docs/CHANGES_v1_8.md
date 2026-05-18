# CHANGES v1.8

- Field atualizado para **ColectTap-v1.8** com autosave reforçado por captura da tela atual (`captureCurrentScreenState`) e chamadas forçadas em eventos críticos.
- `setToggle`, `toggleCheck`, foto e pendências agora marcam `_dirty` e disparam autosave com debounce.
- Adicionadas proteções de saída com `beforeunload`, interceptação de `popstate` e tentativa de salvamento antes de sair.
- Desativada restauração obsoleta `restoreDraftIfExists()` para evitar marcação insegura de rascunhos como salvos.
- Introduzida base de fila offline (`colect_pending_sync_v1`) com assinatura de payload, limite e rotina de reenvio.
- Adicionados helpers de armazenamento seguro (`safeSetJSON`) e toasts para falhas de persistência local.
- GAS atualizado para **ColectTap-GAS-v1.7**.
- Upload de fotos do GAS agora usa pasta raiz `ColectTap_Fotos` para novos envios.
- Upload de fotos com nome determinístico passa a reutilizar arquivo existente no Drive, evitando duplicidade em reenvios.
- Suporte inicial a metadados de idempotência/sincronização (`idempotency_key`, `client_updated_at`, `upload_attempt_id`, `synced_at`).
