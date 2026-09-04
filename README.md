# Blinklet Choplet

A production-ready no-code platform for creating Solana Actions (Blinks) - onchain interactions that can be embedded anywhere on the internet.

## Features

- **Create Multiple Blink Types**
  - **Donation**: Collect SOL donations with customizable amounts
  - **Token Swap**: Enable SOL to SPL token swaps via Jupiter aggregator
  - **Pay-to-Reveal**: Sell hidden content or exclusive links
  - **Raffle**: Host onchain raffles with participant tracking

- **Professional Dashboard**: Manage all your Blinks in one place
- **Multi-Action Support**: Configure up to 3 custom action buttons per Blink

## Tech Stack

### Backend
- **TypeScript**: Strict type safety and modern JavaScript features
- **Express.js**: Fast, minimalist web framework
- **MongoDB + Mongoose**: Document database with ODM
- **Winston**: Professional logging with daily log rotation
- **Solana Web3.js**: Blockchain interaction library
- **Jupiter API**: Token swap aggregation

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe frontend development
- **Tailwind CSS 4**: Utility-first styling
- **Solana Wallet Adapter**: Seamless wallet connections
- **Framer Motion**: Smooth animations
- **Sonner**: Toast notifications

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud)
- Solana RPC endpoint (mainnet or devnet)
- Domain verified by [Dialect](https://docs.dialect.to/blinks)

## Installation

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure your environment variables (see Configuration section below).

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Update with your backend API URL and share base URL.

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/blink-builder` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_NETWORK` | Network identifier | `mainnet` |
| `SOLANA_BLOCKCHAIN_ID` | Blockchain ID for Actions spec | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `*` |
| `PRIORITY_FEE_MICRO_LAMPORTS` | Transaction priority fee | `100000` |
| `JUPITER_QUOTE_API_URL` | Jupiter quote endpoint | `https://lite-api.jup.ag/swap/v1/quote` |
| `JUPITER_SWAP_API_URL` | Jupiter swap endpoint | `https://lite-api.jup.ag/swap/v1/swap` |
| `JUPITER_SLIPPAGE_BPS` | Swap slippage tolerance (basis points) | `50` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_SHARE_BASE_URL` | Frontend share URL | `http://localhost:3000` |

## Development

### Start Backend Development Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001` with hot reload enabled.

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`.

### Type Checking

```bash
cd backend
npm run type-check
```

### Build for Production

```bash
cd backend
npm run build
npm start
```

```bash
cd frontend
npm run build
npm start
```

## Security Features

- **Request Validation**: All inputs validated before processing
- **Wallet Verification**: Ownership verification for sensitive operations
- **Solana Address Validation**: Prevents invalid address errors
- **Transaction Signing**: All transactions signed by user wallet
- **Error Handling**: Safe error messages without sensitive data leakage
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Isolation**: Sensitive data in environment variables

## License

MIT License

---

Built by Choplet Studios
