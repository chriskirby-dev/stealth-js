class StealthJS {
    constructor(options = {}) {
        this.options = options;
    }

    async load(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fetch failed");
        let src = await res.text();
        this.deploy(this.obfuscate(src));
        url = null;
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

    initialize() {
        // Execute obfuscated code
        const container = document.createElement("script");
        container.type = "text/javascript";
        container.id = "stealth-js";
        this.container = container;
        document.head.appendChild(container);
    }
}

export default StealthJS;
