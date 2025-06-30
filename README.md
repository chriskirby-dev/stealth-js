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
const options = {};

const stealth = new StealthJS(options);

stealth.load("http://chriskirby.me/stealth-script.js");

--OR--

stealth.loadToTag("http://chriskirby.me/stealth-script.js");
</script>
