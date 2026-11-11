# OrçaZap

Sistema web para prestadores de serviço criarem, enviarem e acompanharem orçamentos de forma simples e profissional.

**Acesse o sistema:** https://orcazap-seven.vercel.app

## O que o OrçaZap faz

- **Orçamentos completos:** vários itens, quantidades, valores, validade e observações
- **Status de acompanhamento:** Pendente, Aprovado e Recusado
- **PDF profissional:** com os dados da sua empresa no cabeçalho
- **Envio por WhatsApp:** mensagem pronta com o resumo do orçamento
- **Cadastro de clientes e serviços:** com preços para reaproveitar nos orçamentos
- **Dashboard:** totais por status, orçamentos do mês e taxa de aprovação
- **Planos e licenças:** Teste, Básico, Profissional e Empresa, com limite mensal de orçamentos
- **Painel de administração:** gestão de usuários, licenças, planos e histórico de alterações

## Tecnologias

- **Front-end:** React, Vite, React Router
- **Back-end:** Supabase (PostgreSQL, autenticação, funções no banco)
- **Segurança:** Row Level Security (RLS) para isolar os dados de cada usuário
- **PDF:** jsPDF e jsPDF-AutoTable
- **Hospedagem:** Vercel


   Use apenas a chave pública (publishable). Nunca coloque chaves secretas no front-end.

3. Inicie o projeto:

   ```bash
   npm run dev
   ```

## Autor

Desenvolvido por **Elvis Guski** — Cachoeirinha, RS.

## Licença

Veja o arquivo [LICENSE](LICENSE).
# Assinaturas Mercado Pago

O projeto inclui um fluxo de assinatura mensal do plano `profissional` por R$ 24,90. A licença
só é ativada após uma notificação de pagamento recorrente aprovado, validada pela assinatura
secreta do Mercado Pago e conferida novamente na API do provedor.

## Preparação para publicar

1. Execute `supabase/migrations/202611110001_assinaturas_mercadopago.sql` no SQL Editor do
   projeto Supabase. A migração cria as tabelas privadas de vínculo/idempotência e uma função
   que só aceita chamadas com a role `service_role`.
2. Cadastre estas variáveis de ambiente no projeto Vercel:
   - `APP_URL`: URL pública do OrçaZap, sem barra final.
   - `SUPABASE_URL`: URL do projeto Supabase.
   - `SUPABASE_ANON_KEY`: chave pública do Supabase, somente para validar a sessão do cliente.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave secreta de servidor. Nunca use prefixo `VITE_` nem a
     exponha no navegador.
   - `MERCADOPAGO_ACCESS_TOKEN`: Access Token de produção do Mercado Pago.
   - `MERCADOPAGO_WEBHOOK_SECRET`: segredo de assinatura de Webhooks da aplicação Mercado Pago.
3. Configure no Mercado Pago o webhook `https://SEU-DOMINIO/api/mercadopago-webhook` com os
   eventos **Planos e assinaturas** (`subscription_preapproval` e
   `subscription_authorized_payment`).
4. Publique o projeto na Vercel e faça uma compra de ponta a ponta em ambiente de teste antes
   de divulgar o checkout de produção.

O checkout exige que o cliente tenha criado uma conta e esteja conectado ao OrçaZap. O Mercado
Pago hospeda a coleta dos dados de pagamento; o OrçaZap não recebe nem armazena dados do cartão.
O preço está definido no servidor em `api/checkout.js`; atualize também o texto exibido em
`src/components/Layout.jsx` quando mudar o valor.
