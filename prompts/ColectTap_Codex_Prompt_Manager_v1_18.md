# PROMPT CODEX — ColectTap Manager v1.18
## Correções no gerador de PDF do Manager

---

## PASSO 0 — LEITURA OBRIGATÓRIA

Leia integralmente ANTES de escrever qualquer linha:
- `src/ColectTap_Manager_v1_17.html`

Arquivo de saída: `output/ColectTap_Manager_v1_18.html`

---

## REGRAS GERAIS

- Partir do `src/ColectTap_Manager_v1_17.html` e aplicar apenas as correções abaixo
- Bump de versão: todas as ocorrências de `"v1.17"` → `"v1.18"`
- Não reescrever do zero — cirúrgico
- Entrega 100% funcional e autossuficiente

---

## BLOCO 1 — TÍTULO DA CAPA: "INSPEÇÃO PERIÓDICA" → "LEVANTAMENTO DE CAMPO"

Localizar:
```javascript
doc.text('INSPEÇÃO PERIÓDICA', PW/2, cnpj?82:76, {align:'center'});
```
Substituir por:
```javascript
doc.text('LEVANTAMENTO DE CAMPO', PW/2, cnpj?82:76, {align:'center'});
```

---

## BLOCO 2 — FOTO DA CAPA: CORRIGIR DISTORÇÃO DE ASPECT-RATIO

Localizar o bloco completo de cálculo e desenho da foto da capa:
```javascript
      try {
        const props = doc.getImageProperties('data:' + fotoCapa.mimeType + ';base64,' + fotoCapa.base64);
        if (props && props.width && props.height) {
          const ratio = props.height / props.width;
          imgH = Math.min(MAX_IMG_H, CW * ratio);
          imgH = Math.max(40, imgH);
        }
      } catch(e) {}
      const imgYAdj = imgY + (MAX_IMG_H - imgH) / 2;
      try {
        const mt = (fotoCapa.mimeType||'').toUpperCase().includes('PNG') ? 'PNG' : 'JPEG';
        doc.addImage('data:'+fotoCapa.mimeType+';base64,'+fotoCapa.base64, mt, ML, imgYAdj, CW, imgH);
      } catch(e) { doc.setFillColor(220,230,245); doc.rect(ML,imgY,CW,MAX_IMG_H,'F'); }
```

Substituir por:
```javascript
      let imgW = CW;
      try {
        const props = doc.getImageProperties('data:' + fotoCapa.mimeType + ';base64,' + fotoCapa.base64);
        if (props && props.width && props.height) {
          const ratio = props.height / props.width; // h/w
          // Tentar encaixar na largura total
          imgH = CW * ratio;
          if (imgH > MAX_IMG_H) {
            // Altura excede limite: reduzir largura proporcionalmente
            imgH = MAX_IMG_H;
            imgW = MAX_IMG_H / ratio;
          }
          imgH = Math.max(40, imgH);
          imgW = Math.max(40, imgW);
        }
      } catch(e) {}
      const imgXAdj = ML + (CW - imgW) / 2;
      const imgYAdj = imgY + (MAX_IMG_H - imgH) / 2;
      try {
        const mt = (fotoCapa.mimeType||'').toUpperCase().includes('PNG') ? 'PNG' : 'JPEG';
        doc.addImage('data:'+fotoCapa.mimeType+';base64,'+fotoCapa.base64, mt, imgXAdj, imgYAdj, imgW, imgH);
      } catch(e) { doc.setFillColor(220,230,245); doc.rect(ML,imgY,CW,MAX_IMG_H,'F'); }
```

---

## BLOCO 3 — row1: VALOR ALINHADO À ESQUERDA (abaixo do label)

Localizar `function row1(y,eq,l,v)`:
```javascript
  function row1(y,eq,l,v) {
    y=ck(y,10,eq);
    doc.setFillColor(...REL_LGRAY);doc.rect(ML,y,CW,9,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...REL_TEXT2);
    doc.text(ltx(String(l||'')).toUpperCase(),ML+2,y+3.5);
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...REL_DARK);
    const lines=doc.splitTextToSize(ltx(String(v||'—')),CW-60);
    doc.text(lines[0]||'—',ML+60,y+8);return y+11;
  }
```

Substituir por:
```javascript
  function row1(y,eq,l,v) {
    const val = ltx(String(v||'—'));
    const lines = doc.splitTextToSize(val, CW-4);
    const cellH = Math.max(11, lines.length * 5 + 6);
    y = ck(y, cellH, eq);
    doc.setFillColor(...REL_LGRAY); doc.rect(ML, y, CW, cellH, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...REL_TEXT2);
    doc.text(ltx(String(l||'')).toUpperCase(), ML+2, y+3.5);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...REL_DARK);
    lines.forEach((line, i) => doc.text(line, ML+2, y+8+(i*5)));
    return y + cellH;
  }
```

---

## BLOCO 4 — LABELS ABREVIADOS: TODAS AS SUBSTITUIÇÕES

Dentro de `gerarConteudoEquip`, aplicar as seguintes substituições de string exata nos objetos `{l:'...'}`:

### Seção 1 — Identificação
| De | Para |
|----|------|
| `'Número Equip.'` | `'Número do Equipamento'` |
| `'Ano Fabricação'` | `'Ano de Fabricação'` |
| `'Código Projeto'` | `'Código de Projeto'` |

### Seção 2 — Dados de Projeto e Pressão
| De | Para |
|----|------|
| `'P. Trabalho (kgf/cm²)'` | `'Pressão de Trabalho (kgf/cm²)'` |
| `'P. Teste (kgf/cm²)'` | `'Pressão de Teste Hidrostático (kgf/cm²)'` |
| `'Esp. Parede (mm)'` | `'Espessura de Parede (mm)'` |
| `'Cap. Vapor (kg/h)'` | `'Capacidade de Vapor (kg/h)'` |
| `'Área Aquecimento'` | `'Área de Superf. de Aquecimento (m²)'` |
| `'P. Projeto'` | `'Pressão de Projeto (kgf/cm²)'` |

### Seção 3 — Dispositivos de Segurança
| De | Para |
|----|------|
| `'Manômetro'` | `'Possui Manômetro?'` |
| `'Man. Calibrado'` | `'Manômetro Calibrado?'` |
| `'Cert. Manômetro'` | `'Número de Certificado do Manômetro'` |
| `'Venc. Calibração'` | `'Vencimento da Calibração'` |
| `'PSV / Válv. Seg.'` | `'Possui PSV / Válvula de Segurança?'` |
| `'PSV Calibrada'` | `'PSV Calibrada?'` |
| `'Cert. PSV'` | `'Número de Certificado da PSV'` |
| `'PA da PSV'` | `'Pressão de Ajuste/Abertura da PSV (kgf/cm²)'` |
| `'Venc. Calibração PSV'` | `'Vencimento da Calibração da PSV'` |
| `'Purgador'` | `'Possui Purgador?'` |
| `'DCBI'` | `'Possui DCBI?'` |
| `'Válv. Retenção'` | `'Possui Válvula de Retenção?'` |

### Seção 5 — Segurança do Trabalho
| De | Para |
|----|------|
| `'Trab. em Altura'` | `'Requer Trabalho em Altura?'` |
| `'Necessita TH'` | `'Necessita Teste Hidrostático?'` |
| `'Andaime'` | `'Requer Uso de Andaime?'` |

### Seção 7 — Observações e Pendências (labels inline nos blocos `doc.text`)
| De | Para |
|----|------|
| `'Obs. Gerais:'` | `'Observações Gerais:'` |
| `'Obs. Inspetor:'` | `'Recomendações do Inspetor:'` |
| `'Risco Observado:'` | `'Risco Observado:'` ← manter |

---

## BLOCO 5 — ind_nivel: APENAS CALDEIRA E TANQUE

Localizar:
```javascript
    y=row2(y,eq,[{l:'Válv. Retenção',v:eq.possui_valvula_retencao},{l:'Ind. Nível',v:eq.possui_indicador_nivel}]);
```
(após aplicar Bloco 4, o label já será `'Possui Válvula de Retenção?'`)

Substituir por:
```javascript
    y=row2(y,eq,[{l:'Possui Válvula de Retenção?',v:eq.possui_valvula_retencao},{l:(s(eq.tipo)==='caldeira'||s(eq.tipo)==='tanque')?'Possui Indicador de Nível?':'',v:(s(eq.tipo)==='caldeira'||s(eq.tipo)==='tanque')?eq.possui_indicador_nivel:''}]);
```

---

## BLOCO 6 — VERIFICAÇÃO FINAL (self-audit obrigatório)

```
□ Título da capa é "LEVANTAMENTO DE CAMPO" (não "INSPEÇÃO PERIÓDICA")
□ Foto da capa não distorce: largura reduz proporcionalmente quando altura excede MAX_IMG_H
□ row1 exibe valor alinhado à esquerda, abaixo do label (não a 60mm do margem)
□ row1 expande altura da célula para texto longo (não trunca)
□ Todos os labels abreviados expandidos conforme tabelas do Bloco 4
□ Ind. Nível aparece APENAS para caldeira e tanque
□ "Recomendações do Inspetor:" substituiu "Obs. Inspetor:"
□ "Observações Gerais:" substituiu "Obs. Gerais:"
□ Versão atualizada para v1.18 em todas as ocorrências
□ Nenhuma funcionalidade existente quebrada (login, coletas, CRUD, Relatórios)
```

---

## ENTREGA

- `output/ColectTap_Manager_v1_18.html`
