require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, ComputeBudgetProgram } = require('@solana/web3.js');
// Note: If using Node 18+, fetch is native. For older versions, use node-fetch or axios.
// We'll assume Node 18+ or that the user installs a polyfill if needed.
const Blink = require('./models/Blink');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.set('trust proxy', true); // Trust proxy headers (like from ngrok)

// Actions Headers Middleware
// These headers are REQUIRED by the Solana Actions specification.
const ACTIONS_CORS_HEADERS = {
  'X-Action-Version': '1',
  'X-Blockchain-Ids': 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
};

// Custom Middleware to append headers to every response
app.use((req, res, next) => {
  res.set(ACTIONS_CORS_HEADERS);
  next();
});

// CORS Configuration (Critical for Blinks)
// We keep the standard cors middleware for general preflight handling, 
// but our custom middleware ensures the specific Action headers are always present.
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Encoding', 'Accept-Encoding'],
}));

    // Explicitly handle OPTIONS for preflight
    app.options('/api/actions/*', (req, res) => {
        res.set(ACTIONS_CORS_HEADERS);
        res.status(200).end();
    });

    // Explicitly handle CORS for the confirmation endpoint
    app.options('/api/actions/:id/confirm_raffle', (req, res) => {
        res.set(ACTIONS_CORS_HEADERS);
        res.status(200).end();
    });

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blink-builder')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Solana Connection
// Explicitly using Mainnet RPC.
// Note: We are overriding process.env.SOLANA_RPC here to prevent accidental Devnet connection.
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

console.log('----------------------------------------');
console.log(`[CONFIG] Active Solana RPC: ${SOLANA_RPC}`);
console.log(`[CONFIG] Network: Mainnet`);
console.log('----------------------------------------');

// --- Routes ---

// 1. GET /api/actions/:id - Metadata Endpoint
app.get('/api/actions/:id', async (req, res) => {
  try {
    const blink = await Blink.findById(req.params.id);
    if (!blink) {
      return res.status(404).json({ error: 'Blink not found' });
    }

    // Dynamically determine Base URL from request headers (Supports Ngrok/Localhost automatically)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'];
    const baseUrl = `${protocol}://${host}`;

    // Convert to Object to safely access settings
    const blinkObj = blink.toObject();
    const settings = blinkObj.settings || {};

    // Default single action
    let actions = [
        {
          label: blink.label, // Button text
          href: `${baseUrl}/api/actions/${blink._id}`, // Callback for POST
        }
    ];

    // Handle multiple buttons if defined in settings
    console.log(`[GET] Blink ID: ${blink._id}, Type: ${blink.type}`);
    console.log(`[GET] Settings Actions:`, settings.actions);

    if (settings.actions && Array.isArray(settings.actions) && settings.actions.length > 0) {
        console.log('[GET] Found multiple actions, mapping them...');
        actions = settings.actions.map(action => ({
            label: action.label,
            href: `${baseUrl}/api/actions/${blink._id}?value=${encodeURIComponent(action.value)}`
        }));
    } else {
        console.log('[GET] No custom actions found, using default.');
    }

    const response = {
      icon: blink.icon,
      title: blink.title,
      description: blink.description,
      label: blink.label,
      links: {
        actions: actions
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching blink:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. POST /api/actions/:id - Transaction Construction
app.post('/api/actions/:id', async (req, res) => {
  try {
    const { account } = req.body; // User's public key from wallet
    const queryValue = req.query.value; // Value from query param (e.g. amount or ticket count)

    if (!account) {
      return res.status(400).json({ error: 'Account is required' });
    }

    const blink = await Blink.findById(req.params.id);
    if (!blink) {
      return res.status(404).json({ error: 'Blink not found' });
    }

    const userPubkey = new PublicKey(account);
    let transaction = new Transaction();

    // Add a small priority fee to prevent timeouts on congested networks (even Devnet)
    // Increased to 100,000 microLamports (0.0001 SOL) to ensure inclusion
    // NOTE: For Swap, we handle this via Jupiter API directly. For others, we add it here.
    if (blink.type !== 'swap') {
        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 100000, 
            })
        );
    }

    let message = "Transaction Successful!";
    let nextAction = null;

    // Switch based on Blink Type
    console.log(`[DEBUG] Blink Type: ${blink.type}`);
    console.log(`[DEBUG] Blink Settings:`, blink.settings);
    console.log(`[DEBUG] Query Value:`, queryValue);

    switch (blink.type) {
      case 'donation': {
        const { recipient, amounts } = blink.settings;
        // Use query param amount if exists, else default amount
        let amount = 0.1;
        if (queryValue) {
            amount = parseFloat(queryValue);
        } else if (amounts && amounts.length > 0) {
            amount = amounts[0];
        }
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: new PublicKey(recipient),
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        );
        
        message = `Donated ${amount} SOL to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`;
        break;
      }

      case 'swap': {
        const { tokenMint } = blink.settings;
        // REAL Jupiter API Call
        console.log(`[SWAP] Fetching Swap Quote for ${tokenMint}`);
        
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        // Use query param amount (in SOL) if exists, default to 0.01 SOL
        // Jupiter expects amount in integer atomic units (lamports for SOL)
        let amountSol = 0.01;
        if (queryValue) {
            amountSol = parseFloat(queryValue);
        }
        const amountToSwap = Math.floor(amountSol * LAMPORTS_PER_SOL);
        
        // 1. Get Quote
        const quoteResponse = await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${SOL_MINT}&outputMint=${tokenMint}&amount=${amountToSwap}&slippageBps=50`);
        const quoteData = await quoteResponse.json();
        
        if (!quoteData || quoteData.error) {
            console.error('[SWAP] Quote Error:', quoteData);
            throw new Error('Failed to get quote from Jupiter');
        }

        console.log(`[SWAP] Got Quote. Out Amount: ${quoteData.outAmount}`);

        // 2. Get Swap Transaction
        const swapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: quoteData,
                userPublicKey: userPubkey.toString(),
                wrapAndUnwrapSol: true,
                // Jupiter handles priority fees if requested, or we can let wallet handle it. 
                // Setting a generic valid priority fee to ensure landing.
                prioritizationFeeLamports: 100000 
            })
        });
        const swapData = await swapResponse.json();
        
        if (!swapData || !swapData.swapTransaction) {
             console.error('[SWAP] Swap Error:', swapData);
             throw new Error('Failed to get swap transaction from Jupiter');
        }

        // Return immediately for Swap, bypassing the default transaction construction
        return res.json({
            transaction: swapData.swapTransaction,
            message: `Swapped ${amountSol} SOL for ${blink.settings.tokenSymbol || 'Token'}`,
        });
      }

      case 'reveal': {
        const { price, hiddenContent } = blink.settings;
        const creatorPubkey = new PublicKey(blink.creatorWallet);
        const lamports = Math.floor(price * LAMPORTS_PER_SOL);

        console.log(`[TX] Reveal Price: ${price} SOL`);
        console.log(`[TX] Lamports to transfer: ${lamports}`);
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: creatorPubkey,
            lamports: lamports,
          })
        );
        
        // NOTE: In the real world, this "next" action should be verified (e.g., check signature).
        // For this MVP, we return the content in the success message structure.
        // Current Blinks spec allows `links.next` which the client fetches after success.
        
        // We construct a "Next Action" object
        nextAction = {
            type: 'inline', // or 'post'
            action: {
                description: `Here is your hidden content: ${hiddenContent}`,
                icon: blink.icon,
                label: "Content Revealed",
                title: "Reveal Successful",
                disabled: true
            }
        };
        
        message = `Paid ${price} SOL! Revealing content...`;
        break;
      }

      case 'raffle': {
        const { ticketPrice } = blink.settings;
        const creatorPubkey = new PublicKey(blink.creatorWallet);
        
        // Determine ticket count and total price
        let ticketCount = 1;
        if (queryValue) {
            ticketCount = parseInt(queryValue) || 1;
        }
        const totalCost = ticketPrice * ticketCount;
        const lamports = Math.floor(totalCost * LAMPORTS_PER_SOL);

        console.log(`[RAFFLE] Ticket Price: ${ticketPrice} SOL, Count: ${ticketCount}`);
        console.log(`[RAFFLE] Total Lamports: ${lamports}`);
        console.log(`[RAFFLE] Creator/Recipient: ${creatorPubkey.toString()}`);
        console.log(`[RAFFLE] User/Sender: ${userPubkey.toString()}`);

        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPubkey,
                toPubkey: creatorPubkey,
                lamports: lamports,
            })
        );
        
        // Chain a next action to confirm the entry
        // Use absolute URL construction similar to other endpoints
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        // Important: "post" type requires "href" to be the endpoint.
        // When user confirms in wallet, Dialect/client will POST to this href.
        // If successful, it displays the message from that endpoint.
        nextAction = {
            type: 'post',
            href: `${baseUrl}/api/actions/${blink._id}/confirm_raffle`,
            label: 'Confirm Entry'
        };

        // This message is shown AFTER the transaction is confirmed, 
        // but BEFORE the user clicks the "Next Action" button (if manual) 
        // or as the transition state.
        message = `Transaction Confirmed! Buying ${ticketCount} ticket(s)...`;
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid Blink Type' });
    }

    // Set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    console.log(`[TX] Building transaction for ${blink.type}`);
    console.log(`[TX] Fee Payer: ${userPubkey.toString()}`);
    console.log(`[TX] Blockhash: ${blockhash}`);

    // Serialize transaction
    const payload = transaction.serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString('base64');
    
    console.log(`[TX] Transaction serialized successfully. Payload length: ${payload.length}`);
    console.log(`[TX] Sending response to client...`);

    // Return standard Action response
    const responsePayload = {
      transaction: payload,
      message: message,
    };

    if (nextAction) {
        responsePayload.links = { next: nextAction };
    }

    res.json(responsePayload);

  } catch (error) {
    console.error('Error processing action:', error);
    res.status(500).json({ error: 'Transaction generation failed', details: error.message });
  }
});

// 3. POST /api/actions/:id/confirm_raffle - Confirm Raffle Entry
app.post('/api/actions/:id/confirm_raffle', async (req, res) => {
    try {
        const { account, signature } = req.body;
        if (!account) {
            return res.status(400).json({ error: 'Account required' });
        }

        console.log(`[RAFFLE] Confirming entry for ${account}`);
        // Ideally: Verify signature on-chain here.
        
        const blink = await Blink.findByIdAndUpdate(req.params.id, {
            $push: { 'settings.entries': account }
        }, { new: true }); // Return updated doc

        res.json({
            type: "completed",
            title: "Raffle Entry Confirmed!",
            icon: blink.icon,
            label: "Done",
            description: `Your wallet ${account.slice(0, 4)}...${account.slice(-4)} has been entered into the raffle.`
        });
    } catch (error) {
        console.error('Error confirming raffle:', error);
        res.status(500).json({ error: 'Confirmation failed' });
    }
});

// 4. GET /api/blinks - Get Creator's Blinks
app.get('/api/blinks', async (req, res) => {
    try {
        const { creator } = req.query;
        if (!creator) {
            return res.status(400).json({ error: 'Creator wallet required' });
        }

        const blinks = await Blink.find({ creatorWallet: creator })
            .sort({ createdAt: -1 });

        // Add actionUrl to each blink for convenience
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        const enrichedBlinks = blinks.map(blink => ({
            ...blink.toObject(),
            actionUrl: `${baseUrl}/api/actions/${blink._id}`
        }));

        res.json(enrichedBlinks);
    } catch (error) {
        console.error('Error fetching creator blinks:', error);
        res.status(500).json({ error: 'Failed to fetch blinks' });
    }
});

// 5. DELETE /api/blinks/:id - Delete a Blink
app.delete('/api/blinks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { creator } = req.body; // Require creator public key to verify ownership

        if (!creator) {
            return res.status(400).json({ error: 'Creator wallet required for verification' });
        }

        const blink = await Blink.findById(id);
        if (!blink) {
            return res.status(404).json({ error: 'Blink not found' });
        }

        if (blink.creatorWallet !== creator) {
            return res.status(403).json({ error: 'Unauthorized to delete this Blink' });
        }

        await Blink.findByIdAndDelete(id);
        res.json({ message: 'Blink deleted successfully' });
    } catch (error) {
        console.error('Error deleting blink:', error);
        res.status(500).json({ error: 'Failed to delete blink' });
    }
});

// Helper for creating blinks (for testing/frontend usage)
app.post('/api/create', async (req, res) => {
    try {
        const newBlink = await Blink.create(req.body);
        
        // Dynamically determine Base URL
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        res.status(201).json({
            ...newBlink.toObject(),
            actionUrl: `${baseUrl}/api/actions/${newBlink._id}`
        });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create Blink', details: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Blink Engine running on port ${PORT}`);
});
