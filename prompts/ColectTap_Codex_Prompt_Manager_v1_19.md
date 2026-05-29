# PROMPT CODEX — ColectTap Manager v1.19
## Correções de completude e qualidade do PDF

---

## PASSO 0 — LEITURA OBRIGATÓRIA

Leia integralmente ANTES de escrever qualquer linha:
- `ColectTap_Manager_v1_18.html` (raiz do repositório)

Arquivo de saída: `ColectTap_Manager_v1_19.html` (raiz do repositório)

---

## REGRAS GERAIS

- Partir do `ColectTap_Manager_v1_18.html` e aplicar apenas as correções abaixo
- Bump de versão: `v1.18` → `v1.19` em TODAS as ocorrências (título, sidebar, header, footer)
- Corrigir também `GAS v1.18` → `GAS v1.17` na sidebar (linha ~78)
- Não reescrever do zero — cirúrgico
- Entrega 100% funcional e autossuficiente

---

## BLOCO 1 — CORRIGIR row2: REMOVER TRUNCAMENTO E WRAP DE LABELS LONGOS

### 1.1 — Remover `.substring(0,35)` do valor

Localizar `function row2(y,eq,pares)` e dentro dela:
```javascript
doc.text(ltx(String(p.v||'—')).substring(0,35),x+2,y+8);
```
Substituir por:
```javascript
const vTxt = ltx(String(p.v||'—'));
const vLines = doc.splitTextToSize(vTxt, hw-4);
doc.text(vLines[0]||'—', x+2, y+8);
```

### 1.2 — Aumentar altura da célula row2 para acomodar labels longos

Localizar o início de `function row2(y,eq,pares)`:
```javascript
  function row2(y,eq,pares) {
    y=ck(y,12,eq); const hw=CW/2;
    pares.forEach((p,i)=>{
      const x=ML+i*hw;
      doc.setFillColor(...REL_LGRAY);doc.rect(x,y,hw-1,10,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...REL_TEXT2);
      doc.text(ltx(String(p.l||'')).toUpperCase(),x+2,y+3.5);
      doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...REL_DARK);
```
Substituir a função inteira por:
```javascript
  function row2(y,eq,pares) {
    const hw=CW/2;
    // Calcular altura necessária para labels mais longos
    let maxLabelLines = 1;
    pares.forEach(p => {
      if (p.l) {
        const ll = doc.splitTextToSize(ltx(String(p.l)).toUpperCase(), hw-4);
        if (ll.length > maxLabelLines) maxLabelLines = ll.length;
      }
    });
    const cellH = maxLabelLines > 1 ? 14 : 12;
    y=ck(y,cellH,eq);
    pares.forEach((p,i)=>{
      const x=ML+i*hw;
      doc.setFillColor(...REL_LGRAY);doc.rect(x,y,hw-1,cellH-2,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...REL_TEXT2);
      const lLines = doc.splitTextToSize(ltx(String(p.l||'')).toUpperCase(), hw-4);
      lLines.forEach((line,li) => doc.text(line, x+2, y+3.5+(li*3.5)));
      const labelBottom = 3.5 + (lLines.length * 3.5);
      doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...REL_DARK);
      const vTxt = ltx(String(p.v||'—'));
      const vLines = doc.splitTextToSize(vTxt, hw-4);
      doc.text(vLines[0]||'—', x+2, y+labelBottom+3);
    });
    return y+cellH;
  }
```

---

## BLOCO 2 — LABEL: 'Espaço Confinado' → 'Acesso por Espaço Confinado?'

Localizar:
```javascript
y=row2(y,eq,[{l:'Espaço Confinado',v:eq.espaco_confinado},{l:'Requer Uso de Andaime?',v:eq.necessita_scaffold}]);
```
Substituir por:
```javascript
y=row2(y,eq,[{l:'Acesso por Espaço Confinado?',v:eq.espaco_confinado},{l:'Requer Uso de Andaime?',v:eq.necessita_scaffold}]);
```

---

## BLOCO 3 — SEÇÃO 1: ADICIONAR CAMPOS FALTANTES

Localizar o bloco completo da seção 1 no PDF:
```javascript
    y=secTit(y,eq,'1. Identificação do Equipamento');
    y=row2(y,eq,[{l:'TAG',v:eq.tag},{l:'Tipo',v:tipoLabel(eq.tipo)}]);
    y=row2(y,eq,[{l:'Fabricante',v:eq.fabricante},{l:'Número do Equipamento',v:eq.numero_equip}]);
    y=row2(y,eq,[{l:'Ano de Fabricação',v:eq.ano_fabricacao},{l:'Categoria',v:s(eq.categoria)?'Categoria '+s(eq.categoria):undefined}]);
    const codProjetoLabel = normCodigo(eq.codigo_projeto) + (s(eq.ano_edicao_codigo_projeto) ? ' ('+s(eq.ano_edicao_codigo_projeto)+')' : '');
    y=row2(y,eq,[{l:'Localização / Setor',v:eq.localizacao||eq.setor},{l:'Código de Projeto',v:codProjetoLabel}]);
    y=row2(y,eq,[{l:'Placa Indelével',v:eq.placa_indelevel},{l:'Fluido / Classe',v:s(eq.fluido)+(eq.classe_fluido?' / '+s(eq.classe_fluido):'')+''}]);
```
Substituir por:
```javascript
    y=secTit(y,eq,'1. Identificação do Equipamento');
    y=row2(y,eq,[{l:'TAG',v:eq.tag},{l:'Tipo',v:tipoLabel(eq.tipo)}]);
    y=row2(y,eq,[{l:'Fabricante',v:eq.fabricante},{l:'Número do Equipamento',v:eq.numero_equip}]);
    y=row2(y,eq,[{l:'Ano de Fabricação',v:eq.ano_fabricacao},{l:'Categoria',v:s(eq.categoria)?'Categoria '+s(eq.categoria):undefined}]);
    const codProjetoLabel = normCodigo(eq.codigo_projeto) + (s(eq.ano_edicao_codigo_projeto) ? ' ('+s(eq.ano_edicao_codigo_projeto)+')' : '');
    y=row2(y,eq,[{l:'Localização / Setor',v:eq.localizacao||eq.setor},{l:'Código de Projeto',v:codProjetoLabel}]);
    y=row2(y,eq,[{l:'Placa Indelével',v:eq.placa_indelevel},{l:'Fluido / Classe',v:s(eq.fluido)+(eq.classe_fluido?' / '+s(eq.classe_fluido):'')+''}]);
    y=row2(y,eq,[{l:'Necessita Identificação TAG/Categoria?',v:eq.necessita_tag},{l:'Descrição do Equipamento',v:eq.descricao_equipamento}]);
```

---

## BLOCO 4 — SEÇÃO 2: ADICIONAR CAMPOS DE HISTÓRICO DE INSPEÇÃO E TUBULAÇÃO

Localizar o bloco da seção 2:
```javascript
    y=secTit(y,eq,'2. Dados de Projeto e Pressão');
    y=row2(y,eq,[{l:'PMTA (kgf/cm²)',v:eq.pmta},{l:'Pressão de Trabalho (kgf/cm²)',v:eq.pressao_trabalho}]);
    y=row2(y,eq,[{l:'Pressão de Teste Hidrostático (kgf/cm²)',v:eq.pressao_teste},{l:'Temperatura Média de Operação (°C)',v:eq.temperatura}]);
    y=row2(y,eq,[{l:'Volume (L)',v:eq.volume},{l:'Material',v:eq.material}]);
    y=row2(y,eq,[{l:'Diâmetro (mm)',v:eq.diametro},{l:'Comprimento (mm)',v:eq.comprimento}]);
    y=row2(y,eq,[{l:'Espessura de Parede (mm)',v:eq.espessura_parede},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
    if(s(eq.tipo)==='caldeira'){y=row2(y,eq,[{l:'Capacidade de Vapor (kg/h)',v:eq.capacidade_vapor},{l:'Área de Superf. de Aquecimento (m²)',v:eq.area_aquecimento}]);y=row2(y,eq,[{l:'Combustível',v:eq.combustivel},{l:'Pressão de Projeto (kgf/cm²)',v:eq.pressao_projeto}]);}
    if(s(eq.tipo)==='tanque'){y=row2(y,eq,[{l:'Teto',v:eq.teto},{l:'Revestimento',v:eq.revestimento}]);}
```
Substituir por:
```javascript
    y=secTit(y,eq,'2. Dados de Projeto e Pressão');
    y=row2(y,eq,[{l:'PMTA (kgf/cm²)',v:eq.pmta},{l:'Pressão de Trabalho (kgf/cm²)',v:eq.pressao_trabalho}]);
    y=row2(y,eq,[{l:'Pressão de Teste Hidrostático (kgf/cm²)',v:eq.pressao_teste},{l:'Temperatura Média de Operação (°C)',v:eq.temperatura}]);
    y=row2(y,eq,[{l:'Já Foi Inspecionado Anteriormente?',v:eq.ja_inspecionado},{l:'Ano da Última Inspeção',v:eq.ano_ultima_inspecao}]);
    if(s(eq.tipo)!=='tubulacao'){
      y=row2(y,eq,[{l:'Volume (L)',v:eq.volume},{l:'Material',v:eq.material}]);
      y=row2(y,eq,[{l:'Diâmetro (mm)',v:eq.diametro},{l:'Comprimento (mm)',v:eq.comprimento}]);
      y=row2(y,eq,[{l:'Espessura de Parede (mm)',v:eq.espessura_parede},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
    }
    if(s(eq.tipo)==='tubulacao'){
      y=row2(y,eq,[{l:'Bitola Nominal',v:eq.bitola},{l:'Comprimento (m)',v:eq.comprimento}]);
      y=row2(y,eq,[{l:'Espessura de Parede (mm)',v:eq.espessura_parede},{l:'Classe de Pressão (ANSI/ASME)',v:eq.classe_pressao}]);
      y=row2(y,eq,[{l:'Material',v:eq.material},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
    }
    if(s(eq.tipo)==='caldeira'){
      y=row2(y,eq,[{l:'Capacidade de Vapor (kg/h)',v:eq.capacidade_vapor},{l:'Área de Superf. de Aquecimento (m²)',v:eq.area_aquecimento}]);
      y=row2(y,eq,[{l:'Combustível',v:eq.combustivel},{l:'Pressão de Projeto (kgf/cm²)',v:eq.pressao_projeto}]);
      y=row2(y,eq,[{l:'Material do Casco',v:eq.material},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
    }
    if(s(eq.tipo)==='tanque'){
      y=row2(y,eq,[{l:'Diâmetro (m)',v:eq.diametro},{l:'Altura (m)',v:eq.altura}]);
      y=row2(y,eq,[{l:'Volume (m³)',v:eq.volume},{l:'Tipo de Teto',v:eq.teto}]);
      y=row2(y,eq,[{l:'Material',v:eq.material},{l:'Revestimento',v:eq.revestimento}]);
      y=row2(y,eq,[{l:'Espessura de Parede (mm)',v:eq.espessura_parede},{l:'Possui Isolamento?',v:eq.possui_isolamento||eq.isolamento}]);
    }
    if(s(eq.tipo)==='vaso'){
      // vaso já tem diametro/comprimento/espessura/material acima no bloco genérico
    }
```

---

## BLOCO 5 — SEÇÃO 3: ADICIONAR possui_pressostato

Localizar após a linha de `Possui Válvula de Retenção?`:
```javascript
    y=row2(y,eq,[{l:'Possui Válvula de Retenção?',v:eq.possui_valvula_retencao},{l:(s(eq.tipo)==='caldeira'||s(eq.tipo)==='tanque')?'Possui Indicador de Nível?':'',v:(s(eq.tipo)==='caldeira'||s(eq.tipo)==='tanque')?eq.possui_indicador_nivel:''}]);
```
Inserir APÓS essa linha:
```javascript
    if(s(eq.possui_pressostato)) y=row2(y,eq,[{l:'Possui Pressostato?',v:eq.possui_pressostato},{l:'',v:''}]);
```

---

## BLOCO 6 — SEÇÃO 4: ADICIONAR documentos_ausentes E documentos_a_receber

Localizar o bloco da seção 4:
```javascript
    y=secTit(y,eq,'4. Documentação');
    y=row1(y,eq,'Status Documentação',eq.status_documentacao);
    y=row1(y,eq,'Documentos Presentes',eq.documentos_presentes);
```
Substituir por:
```javascript
    y=secTit(y,eq,'4. Documentação');
    y=row1(y,eq,'Status da Documentação',eq.status_documentacao);
    if(s(eq.documentos_presentes)) y=row1(y,eq,'Documentos Presentes',eq.documentos_presentes);
    if(s(eq.documentos_ausentes))  y=row1(y,eq,'Documentos Ausentes',eq.documentos_ausentes);
    if(s(eq.documentos_a_receber)) y=row1(y,eq,'Documentos a Receber',eq.documentos_a_receber);
```

---

## BLOCO 7 — SEÇÃO 6: ADICIONAR acao_nao_enquadramento

Localizar no bloco da seção 6:
```javascript
    if(s(eq.motivo_nao_enquadramento))y=row1(y,eq,'Motivo Não Enquadramento',eq.motivo_nao_enquadramento);
    if(s(eq.situacao_nr13))y=row1(y,eq,'Situação NR-13',eq.situacao_nr13);
```
Substituir por:
```javascript
    if(s(eq.motivo_nao_enquadramento)) y=row1(y,eq,'Motivo do Não Enquadramento',eq.motivo_nao_enquadramento);
    if(s(eq.acao_nao_enquadramento))   y=row1(y,eq,'Ação Recomendada',eq.acao_nao_enquadramento);
    if(s(eq.situacao_nr13))            y=row1(y,eq,'Situação NR-13',eq.situacao_nr13);
```

---

## BLOCO 8 — VERIFICAÇÃO FINAL (self-audit obrigatório)

```
□ row2 não trunca mais valores com .substring(0,35)
□ row2 labels longos não transbordam a célula (splitTextToSize aplicado)
□ 'Acesso por Espaço Confinado?' substituiu 'Espaço Confinado'
□ Seção 1: necessita_tag e descricao_equipamento aparecem no PDF
□ Seção 2: ja_inspecionado e ano_ultima_inspecao aparecem no PDF
□ Seção 2: tubulação mostra bitola e classe_pressao em vez de diametro genérico
□ Seção 2: caldeira mostra campos específicos (capacidade_vapor, area_aquecimento, etc.)
□ Seção 2: tanque mostra diametro/altura/volume/teto/revestimento
□ Seção 3: possui_pressostato aparece quando preenchido
□ Seção 4: documentos_ausentes e documentos_a_receber aparecem quando preenchidos
□ Seção 6: acao_nao_enquadramento aparece quando preenchida
□ Sidebar mostra 'GAS v1.17' (não v1.18)
□ Versão v1.19 em todas as ocorrências (título, sidebar, header, rodapé)
□ Nenhuma funcionalidade existente quebrada (login, coletas, CRUD, geração PDF)
```

---

## ENTREGA

- `ColectTap_Manager_v1_19.html` na raiz do repositório
