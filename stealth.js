/**
 * TODO: Add a cipher key option to Encode using a cyber.
 */

class StealthJS {
    constructor(options = {}) {
        this.options = options;
        this.initialize();
    }

    storageKey(url) {
        return `${this.storagePrefix}:${url}`;
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
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);

        return new TextDecoder().decode(plainBuffer);
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
        // Obfuscation: remove comments, minify, encode strings
        src = src.replace(/\/\/.*$/gm, "");
        src = src.replace(/\/\*[\s\S]*?\*\//g, "");
        src = src.replace(/\s+/g, " ");
        src = src.replace(
            /(['"`])((?:\\\1|.)*?)\1/g,
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
        new Function(obfuscated)();
        obfuscated = null;
        //this.container.innerHTML += obfuscated;
    }

    loadViaIframe(url) {
        return new Promise((resolve, reject) => {
            let iframe = document.getElementById(this.iframeId);
            const key = this.storageKey(url);

            const messageHandler = async (e) => {
                if (!e.data || e.data.type !== "stealthjs_payload") return;
                if (e.origin !== this.iframeOrigin) return;
                if (e.data.url !== url) return;

                window.removeEventListener("message", messageHandler);
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                }

                try {
                    const cipherBytes = this.base64ToBytes(e.data.payload);
                    let decrypted = await this.decryptAES(cipherBytes, this.cipherKey);
                    decrypted = this.obfuscate(decrypted);
                    this.deploy(decrypted);
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

                const params = new URLSearchParams({
                    url,
                    storagePrefix: this.storagePrefix
                });
                iframe.src = (this.options.iframeUrl || "stealth-iframe.html") + "?" + params.toString();

                document.body.appendChild(iframe);
            }

            setTimeout(() => {
                window.removeEventListener("message", messageHandler);
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                }
                reject(new Error("StealthJS iframe timeout"));
            }, this.options.timeout || 10000);
        });
    }

    initialize() {
        const { options } = this;
        this.cipherKey = options.cipherKey || null;
        this.iframeOrigin = options.iframeOrigin || window.location.origin;
        this.storagePrefix = options.storagePrefix || "__stealthjs_cache__"; // prefix for localStorage keys
        this.iframeId = "stealthjs-fetch-iframe";
    }
}

export default StealthJS;
