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
