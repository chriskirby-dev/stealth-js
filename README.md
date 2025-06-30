# stealth-js
StealthJS: In-Memory JavaScript Loader with Runtime Obfuscation

🕵️‍♂️ A lightweight, dependency-free JavaScript loader that fetches remote JS files, obfuscates them in-memory, and executes them without leaving visible traces in browser DevTools.

---

## 🔍 What It Does

- Fetches JavaScript from a remote URL
- Obfuscates the source code at runtime:
  - Removes comments
  - Minifies whitespace
  - Encodes string literals as `String.fromCharCode(...)`
- Executes the obfuscated code using the `Function` constructor
- Wipes all traces from memory after execution
- Never attaches a `<script>` tag or creates visible artifacts in the DOM

---

## 🛠 Use Case

Perfect for:

- Hiding intellectual property in frontend deployments
- Lightweight DRM mechanisms
- Obfuscation as a deterrent for source code reuse
- Loading scripts that should not be exposed in the browser's "Sources" or "Network" tabs

---

## 🚀 How to Use

1. Clone or copy this repo
2. Replace the example script URL with your own JavaScript file URL

```html
<script>
(() => {
  const stealthLoad = async url => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      let src = await res.text();

      // Obfuscation: remove comments, minify, encode strings
      src = src.replace(/\/\/.*$/gm, '');
      src = src.replace(/\/\*[\s\S]*?\*\//g, '');
      src = src.replace(/\s+/g, ' ');
      src = src.replace(/(['"`])((?:\\\1|.)*?)\1/g, (m, q, s) =>
        '(' + s.split('').map(c => `String.fromCharCode(${c.charCodeAt(0)})`).join('+') + ')'
      );

      // Execute obfuscated code
      new Function(src)();

      // Self-destruct
      src = null;
      url = null;
    } catch (e) {
      console.error("Stealth loader failed:", e);
    }
  };

  stealthLoad('https://example.com/your-script.js'); // <- Replace this
})();
</script>
