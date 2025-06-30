<img src="https://raw.githubusercontent.com/chriskirby-dev/stealth-js/master/assets/stealth-js-logo.svg" style="max-width: 100%; height: auto;" />

# StealthJS


> A high-security JavaScript loader that fetches, encrypts, caches, obfuscates, and executes scripts dynamically — with optional license protection, expiration logic, and zero network traceability.

---

## 🔒 What Is It?

**StealthJS** is a stealth-focused loader for running obfuscated and/or encrypted JavaScript files in the browser **without exposing source code** to the network tab or developer tools. It optionally stores encrypted files in `localStorage` and decrypts them at runtime using `AES-GCM` with PBKDF2 and IV.

It is optimized to **dramatically speed up subsequent loads** by caching encrypted scripts by their source URL.

---

## ✨ Features

- ✅ Per-URL **localStorage** caching for **instant repeat loads**  
- ✅ **AES-GCM** decryption with salt, IV, and PBKDF2 (client-side only)  
- ✅ **Runtime obfuscation** (encodes all strings and strips comments)  
- ✅ Inline iframe **blob sandbox** execution to avoid browser request logs  
- ✅ Optional **license check** and **script expiration**  
- ✅ Works with both encrypted and plaintext JS  
- ✅ Zero dependencies, pure ES6  

---

## 🚀 Usage

### 1. Load Plain Obfuscated Script

import StealthJS from './stealth.js';

const loader = new StealthJS();

loader.load('script.js');

### 2. Load AES-GCM Encrypted Script

const loader = new StealthJS({
  cipherKey: 'mySecretPassword'
});

loader.load('secure.js');

### 3. Add License Check and Expiration

const loader = new StealthJS({
  cipherKey: 'mySecretPassword',
  expireTime: Date.now() + 3600 * 1000, // 1 hour from now
  checkLicense: () => localStorage.getItem('licenseKey') === 'VALID'
});

loader.load('locked.js');

### 4. Enable Debug Logging

const loader = new StealthJS({
  debug: true
});
loader.load('some.js');

---

## ⚡ Load-Time Optimization

StealthJS uses **persistent caching** to store the obfuscated/encrypted version of the script by URL. After the **first load**, it fetches directly from `localStorage` rather than the network — allowing for **blazing-fast page refreshes and nearly zero load delay** on repeat visits.

This makes StealthJS ideal for:

- Low-latency web apps  
- Code delivery in environments with weak connectivity  
- Protecting premium features that must load instantly  

---

## 🔐 Security Architecture

| Feature           | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| AES-GCM          | 256-bit encryption using a PBKDF2-derived key from your password            |
| IV + Salt        | 16-byte salt and 12-byte IV embedded in encrypted payloads                 |
| Blob iframe      | Prevents JS source from showing in DevTools → Network                      |
| Obfuscation      | Runtime code mangling (comment stripping, string encoding)                 |
| License Check    | Optional function callback for verifying license keys or domains           |
| Expiration       | Optional time-limited loading to kill expired payloads                     |
| Cache Boost      | Avoids re-fetching code; uses fast localStorage loading on future loads    |

---

## 📦 File Structure (for encryption workflows)

You can use a companion Node.js CLI (coming soon) to:

📁 /encrypted  
├── secure-app.js     ← Encrypted using AES-GCM  
📁 /src  
├── stealth.js        ← StealthJS loader  

---

## 📌 Requirements

- Works in all modern browsers (Chrome, Edge, Firefox, Safari)  
- Requires JS `import` support (use `<script type="module">`)  

---

## ⚠️ Disclaimer

This tool increases **obfuscation and resistance**, but no method can make JavaScript 100% secure on the client. It is best used to deter casual reverse engineering and code reuse.

---

## 📖 License

MIT License © Chris Kirby - Kirby Creative
