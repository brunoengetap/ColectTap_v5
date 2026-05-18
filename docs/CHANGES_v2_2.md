# ColectTap v2.2 — Registro de Mudanças

## Versão
- Field: v2.2
- GAS: v1.8
- Manager: v1.5
- Data: 2026-05-18

## Mudanças Principais

### 1. Seleção de fluxo de coleta (T4b)
- Nova tela entre seleção de tipo e início do formulário
- Opções: "Estou próximo ao equipamento" e "Estou com a documentação em mãos"

### 2. Reorganização dinâmica das seções
- `getSecoesFluxo()` retorna ordem diferente por modo
- Modo campo: Identificação → Dimensões → Dispositivos → Instalação → Enquadramento → Obs → Documentação → Projeto
- Modo documento: Documentação → Projeto → Enquadramento → Identificação → Dimensões → Dispositivos → Instalação → Obs

### 3. Gateway de scroll no formulário
- Indicador "↓ Role para ver tudo" na transição inferior do corpo da seção
- Botão Próximo com opacidade reduzida enquanto há conteúdo não visualizado
- Sem bloqueio funcional — apenas orientação visual

### 4. Modal de campos incompletos com classificação por origem
- Campos faltantes separados em: 🔧 Campo / 📁 Documental / ⚖️ Híbrido
- Botão "Registrar como pendência documental" quando só há pendências documentais
- Botão "Registrar como pendência de campo" quando só há pendências de campo

### 5. Botão de alternância de fluxo
- Disponível no cabeçalho de T5 em todas as seções
- Preserva dados preenchidos e seção atual
- Toast de confirmação

### 6. GAS v1.8 — Novas colunas
- modo_coleta_inicial, status_coleta_campo, status_coleta_documentos
- pendencias_campo, pendencias_documentais, origem_respostas_json, conflitos_json
- data_primeira_coleta_campo, data_primeira_coleta_documentos, data_ultima_alternancia_fluxo

### 7. Manager v1.5
- Filtros de fluxo (Campo / Documento) e pendência na view-coletas
- Pendências separadas em dois blocos na view-pendencias
- Coluna "Fluxo" na tabela de coletas
- Novos campos no modal de detalhes

## Compatibilidade
- Registros antigos sem modo_coleta_inicial assumem 'campo' silenciosamente
- Nenhuma rotina existente foi removida

## Testes Realizados
- Verificação de sintaxe dos scripts embutidos no Field (`node --check /tmp/ColectTap_v2_2.js`)
- Verificação de sintaxe do GAS (`node --check output/ColectTap_GAS_v1_8.js`)
- Verificação de sintaxe dos scripts embutidos no Manager (`node --check /tmp/ColectTap_Manager_v1_5.js`)
- Busca por referências diretas legadas a `SECS[SES.secAtual]`, `SECS.length` e `CAMPOS_OBRIGATORIOS`
- Verificação de que a URL do GAS do Field foi preservada
- Verificação de que os arquivos protegidos em `src/` não foram modificados
- Verificação do conjunto exato de quatro arquivos preparados para commit
