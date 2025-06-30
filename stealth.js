/**
 * StealthJS: Dynamic script loader with optional AES-GCM decryption, obfuscation,
 * and inline iframe blob loading. Supports per-URL caching and runtime execution.
 * Now includes optional license check, expiration, and encryption utility support.
 */

class StealthJS {
    constructor(options = {}) {
        this.options = options;
        this.initialize();
    }

    storageKey(url) {
        return `${this.storagePrefix}:${btoa(url)}`;
    }

    async load(url) {
        if (this.cipherKey) {
            await this.loadViaIframe(url);
        } else {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed");
            let src = await res.text();
            this.deploy(this.obfuscate(src));
        }
    }

    async decryptAES(cipherBytes, password) {
        const salt = cipherBytes.slice(0, 16);
        const iv = cipherBytes.slice(16, 28);
        const data = cipherBytes.slice(28);

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        const plaintext = new TextDecoder().decode(plainBuffer);

        if (this.checkLicense && !this.checkLicense()) {
            throw new Error("License check failed");
        }

        if (this.expireTime && Date.now() > this.expireTime) {
            throw new Error("Script has expired");
        }

        return plaintext;
    }

    base64ToBytes(b64) {
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }
        return bytes;
    }

    obfuscate(src) {
        src = src.replace(/\/\/.*$/gm, "");
        src = src.replace(/\/\*[\s\S]*?\*\//g, "");
        src = src.replace(/\s+/g, " ");
        src = src.replace(
            /(['\"`])((?:\\\1|.)*?)\1/g,
            (m, q, s) =>
                "(" +
                s
                    .split("")
                    .map((c) => `String.fromCharCode(${c.charCodeAt(0)})`)
                    .join("+") +
                ")"
        );
        return src;
    }

    deploy(obfuscated) {
        const f = new Function("", obfuscated);
        f();
    }

    loadViaIframe(url) {
        return new Promise((resolve, reject) => {
            const key = this.storageKey(url);
            let iframe = document.getElementById(this.iframeId);
            let iframeURL;
            let removed = false;

            const cleanup = () => {
                if (iframe && !removed) {
                    removed = true;
                    URL.revokeObjectURL(iframeURL);
                    iframe.remove();
                }
            };

            const messageHandler = async (e) => {
                if (!e.data || e.data.url !== url) return;
                if (e.origin !== this.iframeOrigin) return;

                if (e.data.type === "stealthjs_error") {
                    cleanup();
                    window.removeEventListener("message", messageHandler);
                    return reject(new Error(e.data.message));
                }

                if (e.data.type !== "stealthjs_payload") return;

                window.removeEventListener("message", messageHandler);
                cleanup();

                try {
                    const cipherBytes = this.base64ToBytes(e.data.payload);
                    const decrypted = await this.decryptAES(cipherBytes, this.cipherKey);
                    const obfuscated = this.obfuscate(decrypted);
                    this.deploy(obfuscated);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            window.addEventListener("message", messageHandler);

            if (!iframe) {
                iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.id = this.iframeId;

                iframeURL = this.createInlineIframe(url, key);
                iframe.src = iframeURL;

                document.body.appendChild(iframe);
            }

            setTimeout(() => {
                window.removeEventListener("message", messageHandler);
                cleanup();
                reject(new Error("StealthJS iframe timeout"));
            }, this.options.timeout || 10000);
        });
    }

    createInlineIframe(url, storageKey) {
        const code = `
    <!DOCTYPE html>
    <html>
    <body>
    <script>
      (async () => {
        const url = ${JSON.stringify(url)};
        const storageKey = ${JSON.stringify(storageKey)};
        try {
          if (!localStorage.getItem(storageKey)) {
            const res = await fetch(url);
            const text = await res.text();
            localStorage.setItem(storageKey, text);
            location.reload();
            return;
          }
          parent.postMessage({
            type: 'stealthjs_payload',
            url: url,
            payload: localStorage.getItem(storageKey)
          }, '*');
        } catch (e) {
          parent.postMessage({
            type: 'stealthjs_error',
            url: url,
            message: e.message
          }, '*');
        }
      })();
    <\/script>
    </body>
    </html>
  `.trim();

        const blob = new Blob([code], { type: "text/html" });
        const iframeURL = URL.createObjectURL(blob);
        return iframeURL;
    }

    initialize() {
        const { options } = this;
        this.cipherKey = options.cipherKey || null;
        this.iframeOrigin = options.iframeOrigin || window.location.origin;
        this.storagePrefix = options.storagePrefix || "__stealthjs_cache__";
        this.iframeId = "stealthjs-fetch-iframe";
        this.debug = options.debug || false;
        this.expireTime = options.expireTime || null;
        this.checkLicense = typeof options.checkLicense === "function" ? options.checkLicense : null;
    }
}

export default StealthJS;

/**
 * ==========================
 * Example Usage Scenarios:
 * ==========================
 *
 * 1. Basic Obfuscated Load (no encryption):
 *    const loader = new StealthJS();
 *    loader.load('script.js');
 *
 * 2. Encrypted Load (AES-GCM):
 *    const loader = new StealthJS({ cipherKey: 'mySecretPassword' });
 *    loader.load('encrypted.js');
 *
 * 3. Encrypted Load + License + Expiration:
 *    const loader = new StealthJS({
 *      cipherKey: 'mySecretPassword',
 *      expireTime: Date.now() + 86400000, // 1 day
 *      checkLicense: () => localStorage.getItem('myLicenseKey') === 'VALID'
 *    });
 *    loader.load('locked-script.js');
 *
 * 4. Enable Debug Logging:
 *    const loader = new StealthJS({ debug: true });
 *    loader.load('script.js');
 */
