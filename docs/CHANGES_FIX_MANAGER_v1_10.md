# CHANGES_FIX_MANAGER_v1_10

## Causa do travamento
- O Manager tinha uma chamada global solta `if (id === 'relatorios') popularSelectOS();`, que gerava `ReferenceError: id is not defined`.
- O bloco `RELATÓRIOS — ENGINE PDF ENGETAP` estava duplicado (uma cópia no `<head>`), gerando redeclarações como `LOGO_ENGETAP_B64`.

## Correções aplicadas
- Removida a duplicidade do engine de relatórios no `<head>`, mantendo apenas uma cópia funcional no script principal.
- Reposicionada a atualização de relatórios para dentro de `showView(id, el)` com `try/catch`.
- Inicialização protegida com `initManager()` e `DOMContentLoaded`.
- Removidos listeners globais diretos que podiam disparar antes do DOM.
- `verificarGAS()` reforçada com timeout defensivo e mensagens conclusivas para sucesso/erro/rede.
- Versão interna do Manager atualizada para `v1.10`.

## Auditoria dos prompts anteriores
- GAS auditado: itens `foto_capa_key`, `os_status`, `getFotoBase64`, `validarPIN(app:'manager')` e `healthCheck` confirmados.
- Field auditado: funções e fluxo de envio seletivo/completo presentes; atualização explícita de `os_status` via `atualizarOSColect` após OS completa já está implementada.
- Field recebeu ajuste cirúrgico de versionamento interno para `v2.6` no arquivo de saída.

## Arquivos alterados
- `output/ColectTap_Manager_v1_10.html`
- `output/ColectTap_v2_6.html`
- `docs/CHANGES_FIX_MANAGER_v1_10.md`

## Testes executados
- Buscas estáticas de duplicidade/sintaxe no Manager.
- Verificações de presença de funções/estruturas em Manager, Field e GAS.
- Validação de ausência da chamada global solta e de padrões inválidos conhecidos.
