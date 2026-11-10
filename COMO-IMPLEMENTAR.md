# Versão mobile: como testar e como levar para o projeto principal

Esta pasta é uma cópia separada do `financas-singular`. Nada aqui mexe no seu projeto principal nem no GitHub: o envio de alterações para o GitHub está bloqueado nesta cópia.

## Como funciona

- Telas com até 767px de largura (celular) abrem a **versão mobile**. Telas maiores abrem o **desktop original, sem nenhuma mudança**.
- Usa os mesmos dados e as mesmas funções do Supabase que o desktop. Nada muda no banco.

### Telas
| Tela | O que tem |
|---|---|
| **Início** | Saldo e previsto, receitas e despesas, aviso de contas atrasadas (com botão de pagar), carrossel de dicas (taxa de poupança, maior gasto, fatura fechando, a receber), gráfico de entradas x saídas de 6 meses (tocar numa barra troca o mês), contas, cartões, próximas contas, gastos por categoria (tocar abre o Extrato filtrado) e últimos lançamentos |
| **Extrato** | Lista por dia com cabeçalho fixo, busca, filtros por tipo, conta, categoria e situação. **Deslizar →** marca pago/pendente, **deslizar ←** exclui. Os dois têm "Desfazer" |
| **Cartões** | Carrossel de cartões (lápis edita o cartão), fatura do mês com fechar, pagar, reabrir e desfazer, próximas 3 faturas e compras (deslizar ← exclui) |
| **Mais** | Card "Instalar o app", Metas, Investimentos, A Ponte, Ajustes |
| **A Ponte** | Saldo PJ → PF, total repassado no mês e no ano, novo repasse e histórico por mês |
| **Ajustes** | Contas, cartões e categorias (ícone, cor e subcategorias): criar, editar e excluir |

### Detalhes de app
- Menu fixo embaixo com **+** central: Despesa, Receita, Compra no cartão e Transferência.
- O **botão voltar do celular** fecha o painel aberto ou volta de tela, em vez de sair do app.
- Avisos rápidos depois de cada ação, vibração leve no Android e campos que não dão zoom no iPhone.
- **Instalável (PWA):** ícone na tela inicial, abre em tela cheia. Só funciona com **HTTPS** (depois do deploy, por exemplo na Vercel). No iPhone: Safari → Compartilhar → Adicionar à Tela de Início.

## Testar no seu computador

1. `npm run dev` com o seu `.env.local` de verdade.
   - Para testar só com **dados falsos**, use o `.env.local` desta pasta e rode antes `node ferramentas-teste/mock-supabase.mjs`.
2. No Chrome, aperte F12 e depois Ctrl+Shift+M para simular um celular.
3. Para testar no celular de verdade (no mesmo Wi-Fi): `http://IP-DO-PC:3000`.

## Levar para o projeto principal (só se gostar)

Copie para o projeto principal:

| Arquivo | O que é |
|---|---|
| `components/mobile/` (pasta inteira) | Toda a versão mobile (novo) |
| `app/page.js` | Escolhe entre mobile e desktop (+15 linhas) |
| `app/layout.tsx` | Ajuste de tela para iPhone/Android (+9 linhas) |
| `app/globals.css` | 2 classes utilitárias (+13 linhas) |
| `app/manifest.js`, `app/apple-icon.js`, `app/icons/` | App instalável e ícones (novos) |

**Não copie:** `.env.local`, `ferramentas-teste/`, `graphify-out/`, `.claude/`.

Nenhum arquivo do desktop (`components/*.js`), do `context/` ou do `utils/` foi alterado.

## Diferenças em relação ao desktop
- **Metas:** no mobile, contam só os gastos **do mês escolhido** (contas + cartão). No desktop, contam todos os gastos, de qualquer mês.
- **Excluir pelo gesto:** pagamentos de fatura e transferências não podem ser excluídos deslizando. A fatura se desfaz pela tela Cartões.
- **A Ponte:** o histórico mostra o lado do perfil escolhido no topo: saídas na PJ, entradas na PF.
