Tarefa atual (ciclo 2026-06-14)
Existe um prompt cirúrgico pronto em `prompts/2026-06-14_fix_pdf_duplicacao_e_cnpj.md`.
Leia esse arquivo na íntegra e aplique exatamente as duas correções descritas nele:
Manager (`ColectTap_Manager_v1_19.html`) — corrigir a duplicação de campos de dimensões no PDF para equipamentos do tipo `caldeira` e `tanque`, alterando a condição do bloco genérico em `gerarConteudoEquip` de `s(eq.tipo)!=='tubulacao'` para `s(eq.tipo)==='vaso'`.
GAS (`ColectTap_GAS_v1_17.js`) — adicionar `setNumberFormat('@')` em `atualizarClienteLead` antes do `.setValues([rowData])`, no mesmo padrão já usado em `salvarClienteLead`.
Regras obrigatórias:
Não fazer nenhuma alteração além das descritas no prompt. Sem refatorações, sem "melhorias" adicionais.
Bump de versão apenas no Manager, de v1.19 para v1.20, nas 4 ocorrências da string de versão.
GAS permanece em v1.17 (`APP_VERSION` inalterado).
Field (`ColectTap_v2_16.html`) não deve ser tocado.
Salvar os arquivos corrigidos em `output/` como `ColectTap_Manager_v1_20.html` e `ColectTap_GAS_v1_17.js`.
Ao final, preencher o checklist de autoauditoria (10 itens) presente no próprio arquivo de prompt e reportar o resultado.
Esta é uma correção urgente para uso em produção — priorize precisão e mínima intervenção sobre qualquer outra consideração.
