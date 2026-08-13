# Painel Agro ES

Portal em Next.js com cotações físicas da CCCV e Incaper, clima do Espírito Santo, Radar IA e gerenciamento dinâmico de anúncios.

## Painel administrativo

O endereço `/admin` permite cadastrar, editar, ativar, desativar e excluir anúncios. Cada anúncio contém empresa, chamada, imagem, WhatsApp ou URL, posição e período de exibição.

As imagens são armazenadas no Vercel Blob e os registros em Postgres compatível com Neon. Se o banco ainda não estiver configurado ou estiver temporariamente indisponível, o banner original da Tesla continua aparecendo automaticamente.

## Configuração na Vercel

Crie/conecte um banco Neon Postgres e um Vercel Blob público ao projeto. Depois cadastre estas variáveis de ambiente em Production e Preview:

- `DATABASE_URL`, `STORAGE_URL` ou `POSTGRES_URL`: conexão fornecida pelo Neon;
- `ADS_BLOB_READ_WRITE_TOKEN`: token da conexão Vercel Blob usada pelos anúncios;
- `ADMIN_PASSWORD`: senha exclusiva do painel;
- `ADMIN_SESSION_SECRET`: texto aleatório longo, com no mínimo 32 caracteres;
- `OPENAI_API_KEY`: mantém o Radar IA existente;
- `OPENAI_MODEL`: opcional;
- `OPEN_METEO_API_KEY`: opcional, conforme o plano utilizado.

O banco cria a tabela `ads` automaticamente no primeiro acesso. O mesmo esquema está documentado em `db/schema.sql`.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Copie `.env.example` para `.env.local` e preencha apenas localmente. Nunca envie segredos ao repositório ou ao frontend.

## Preparação para B3

`lib/b3.js` contém o contrato para uma fonte futura licenciada de cotações B3. A interface pública já aceita `changePct` e mostra alta em verde, baixa em vermelho e estabilidade em cinza, sem substituir as fontes físicas existentes.
