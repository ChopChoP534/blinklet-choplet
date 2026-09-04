# Blinklet

A no-code builder for [Solana Actions](https://solana.com/docs/advanced/actions) (Blinks) — shareable links that unfurl into interactive transaction buttons on X and any other Blink-aware client.

Build a donation link, a token swap, a pay-to-reveal drop, or a raffle from a form, then share the URL. No contract deployment, no frontend work.

## Contents

- [How it works](#how-it-works)
- [Blink types](#blink-types)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [API](#api)
- [Project structure](#project-structure)
- [Deployment notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

## How it works

1. **Connect** a Phantom or Solflare wallet — this is the identity that owns the Blink.
2. **Create** a Blink from a template and configure up to three action buttons.
3. **Share** the returned URL. A Blink client fetches the Action metadata, renders the buttons, and posts back to build an unsigned transaction that the viewer signs in their own wallet.

The server never holds keys and never signs. It builds unsigned transactions; every transfer is signed client-side by the person taking the action.

## Blink types

| Type | What it does |
| --- | --- |
| **Donation** | Collects SOL to a fixed recipient, with preset amount buttons |
| **Token Swap** | Swaps SOL for any SPL token, routed through the [Jupiter](https://jup.ag) aggregator |
| **Pay-to-Reveal** | Charges SOL, then reveals hidden content inline after payment confirms |
| **Raffle** | Sells tickets and records entrant wallets; the creator draws off-chain |

> The raffle winner is drawn off-chain by the creator. That caveat is appended to every raffle description automatically — entrants are trusting the creator, not the chain.

## Tech stack

**Backend** — TypeScript, Express, MongoDB (Mongoose), Winston with daily log rotation, `@solana/web3.js`, Jupiter swap API.

**Frontend** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Solana Wallet Adapter, Sonner.

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB, local or hosted
- A Solana RPC endpoint (the public mainnet endpoint is heavily rate-limited; use a dedicated provider for anything real)

### Install

```bash
git clone https://github.com/your-username/blinklet.git
cd blinklet
npm run install:all
```

### Configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in at minimum `MONGO_URI` and `SOLANA_RPC_URL` in `backend/.env`. See [Configuration](#configuration).

### Run

```bash
npm run dev
```

Backend on `http://localhost:3001`, frontend on `http://localhost:3000`, both with hot reload.

## Configuration

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/blink-builder` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_NETWORK` | Network identifier | `mainnet` |
| `SOLANA_BLOCKCHAIN_ID` | CAIP-2 chain ID sent in the `X-Blockchain-Ids` header | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `*` |
| `PRIORITY_FEE_MICRO_LAMPORTS` | Compute unit price for built transactions | `100000` |
| `JUPITER_QUOTE_API_URL` | Jupiter quote endpoint | `https://lite-api.jup.ag/swap/v1/quote` |
| `JUPITER_SWAP_API_URL` | Jupiter swap endpoint | `https://lite-api.jup.ag/swap/v1/swap` |
| `JUPITER_SLIPPAGE_BPS` | Swap slippage tolerance, in basis points | `50` |
| `LOG_LEVEL` | `error`, `warn`, `info`, or `debug` | `info` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_SHARE_BASE_URL` | Public origin used to build shareable Blink URLs | `http://localhost:3000` |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | Comma-separated origins allowed for server actions | `localhost:3000` |

Both `.env` files are gitignored. Never commit real credentials — `MONGO_URI` in particular usually carries a password.

## Scripts

Run from the repository root:

| Script | Description |
| --- | --- |
| `npm run dev` | Start backend and frontend together with hot reload |
| `npm run build` | Compile the backend and produce a production frontend build |
| `npm start` | Run both production servers |
| `npm run lint` | Lint the frontend |
| `npm run type-check` | Type-check both packages |
| `npm run format` | Format with Prettier |
| `npm run install:all` | Install root, backend, and frontend dependencies |

## API

All routes are served by the backend.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/actions/:id` | Action metadata — title, icon, description, and buttons |
| `POST` | `/api/actions/:id` | Builds an unsigned transaction for the given account |
| `POST` | `/api/actions/:id/confirm_raffle` | Records a raffle entry after payment confirms |
| `POST` | `/api/create` | Creates a Blink |
| `GET` | `/api/blinks?creator=<wallet>` | Lists a creator's Blinks |
| `DELETE` | `/api/blinks/:id` | Deletes a Blink, verifying creator ownership |

The `GET`/`POST` pair on `/api/actions/:id` implements the Solana Actions specification, including the `X-Action-Version` and `X-Blockchain-Ids` headers required by Blink clients.

## Project structure

```
backend/
  src/
    config/        Environment-backed configuration
    middleware/    Request validation and centralized error handling
    models/        Mongoose schemas
    services/      Blink storage, transaction building, Jupiter integration
    types/         Shared TypeScript types
    utils/         Logger and request helpers
    server.ts      Express app and routes
frontend/
  src/
    app/           App Router pages, plus the actions.json route
    components/    Wizard, dashboard, interactive Blink renderer
    config/        Public runtime configuration
    lib/           Shared helpers
```

## Deployment notes

- **Register your domain with Dialect.** Blink clients only unfurl links from domains on the [Dialect registry](https://docs.dialect.to/blinks); until you are registered, your links render as plain URLs.
- **`actions.json` maps your public paths to the API.** It is served from the frontend at `/actions.json` and derives the API path from `NEXT_PUBLIC_API_URL`.
- **Tighten CORS.** `CORS_ALLOWED_ORIGINS=*` is convenient locally; set explicit origins in production.
- **Use a dedicated RPC.** The public mainnet endpoint will rate-limit a live Blink quickly.
- **`next start` honors `PORT`.** Set it if you are not serving on 3000.

## Security

- Every Solana address is validated before it reaches a transaction builder.
- Blink payloads are validated per type in middleware before they are persisted.
- Deletes verify that the requesting wallet is the creator.
- Errors are logged with structure and returned without internal detail.
- Transactions are returned unsigned and signed only by the end user's wallet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and pull request guidelines.

## License

[MIT](LICENSE) — built by [Choplet Studios](https://choplet.dev/).
