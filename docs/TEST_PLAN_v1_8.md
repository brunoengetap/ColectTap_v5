# TEST PLAN v1.8 (manual)

## 1) Login
- [ ] PIN válido entra.
- [ ] PIN inválido não entra.
- [ ] GAS indisponível mostra aviso.

## 2) Autosave campos
- [ ] Entrar em OS, criar equipamento.
- [ ] Digitar TAG/fabricante/PMTA.
- [ ] Fechar/recarregar sem Próximo.
- [ ] Reabrir e confirmar rascunho.

## 3) Autosave toggles/checklists
- [ ] Marcar enquadramento/documentação.
- [ ] Fechar/recarregar.
- [ ] Confirmar preservação.

## 4) Não enquadramento
- [ ] Selecionar “Não enquadra conforme 13.2.2”.
- [ ] Confirmar encerramento na etapa inicial.
- [ ] Salvar e reabrir.
- [ ] Confirmar `status_completude=nao_enquadrado`.

## 5) Fotos
- [ ] Tirar foto e legenda.
- [ ] Fechar/reabrir e confirmar.
- [ ] Remover foto e confirmar persistência.

## 6) Voltar mobile/navegador
- [ ] Preencher e clicar voltar.
- [ ] Confirmar proteção de saída.
- [ ] “Continuar aqui” mantém dados.
- [ ] “Salvar e sair” restaura depois.

## 7) Fechar/recarregar aba
- [ ] Confirmar alerta nativo.
- [ ] Confirmar rascunho ao voltar.

## 8) Sessões salvas
- [ ] Salvar manualmente.
- [ ] Abrir lista de rascunhos.
- [ ] Restaurar e excluir com confirmação.

## 9) Envio online
- [ ] Enviar ao GAS.
- [ ] Confirmar `sync_status=synced`.
- [ ] Confirmar retorno de Drive.
- [ ] Reenvio não duplica linha.

## 10) Envio offline/GAS indisponível
- [ ] Simular offline/URL inválida e enviar.
- [ ] Confirmar fila e badge pendente.
- [ ] Reenviar ao restaurar conexão.
- [ ] Confirmar limpeza da fila.

## 11) Duplicidade de fotos no Drive
- [ ] Enviar coleta com fotos.
- [ ] Reenviar payload.
- [ ] Confirmar reuso/não duplicidade por nome.

## 12) CSV/PDF
- [ ] Gerar CSV/PDF sem clicar Próximo.
- [ ] Confirmar dados da tela atual.

## 13) Regressão
- [ ] Manager abre.
- [ ] OS carregam no Field.
- [ ] CSV continua funcional.
- [ ] Envio GAS continua funcional.
- [ ] Fluxo normal enquadrado mantém seções.
