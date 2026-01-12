# Sami.dev Website

This repository hosts the source code and assets for the _Sami.dev_ site—a personal website built using HTML and JavaScript.

---

## 🔐 Issue & Redaction Rules

When you open an issue, follow these steps:

1. **Every issue must reference a related number or identifier.**  
   Examples:  
   - Commit hash (`abc1234`)  
   - Pull request number (`#42`)  
   - Line number (`line 120 in index.js`)  
   - Feature ID (`F-07`)  

   > ❗ Issues without a clear reference will be closed.

2. **Add the correct tag(s) to your issue title.**  
   Available tags (you can add more if needed):  
   - `ISL` → Contains sensitive info that may need redaction.  
   - `IRE` → Requires immediate review or urgent attention.  
   - `DOC` → Documentation-related.  
   - `BUG` → Code bug.  
   - `UIX` → UI/UX improvement.  
   - `PERF` → Performance issue.  

   *Example*: `Navbar not loading (BUG, IRE)`

3. **Explain the issue clearly in the description.**  
   - Why it exists.  
   - What needs fixing/redaction/urgent review.  
   - Which reference number it relates to.  

4. **After the issue is resolved:**  
   - Remove or update the tag(s).  
   - Leave a closing comment such as:  
     - “Redacted / closed” (for ISL)  
     - “Resolved / closed” (for others)  
   - Close the issue.

---

## 📋 Why this matters

- Keeps all issues **traceable**.  
- Helps maintainers prioritize (`IRE` urgent, `ISL` sensitive, etc.).  
- Keeps the repository **clean, professional, and secure**.  

---

## ✅ Quick Checklist (before submitting an issue)

- [ ] I added a **reference number** (commit, PR, line, or feature ID).  
- [ ] I used the correct **tag(s)** in the issue title.  
- [ ] I explained **what, why, and where** in the description.  
- [ ] I understand maintainers may redact or close my issue if rules aren’t followed.

      
📌 Note: After creating an issue, please also create a Pull Request using the PR template to propose changes or fixes.

---

## License

This project is under a **MIT License with Attribution**.  
See the [License file](LICENSE.md) for full details.  

---

## Contact

For questions, reach out: **samisingh988@gmail.com**  

---

## Merch (local)

A simple Merch page is available at `/merch.html`.

Quick start:
1. Install: `npm install`
2. Set env vars: `export PRINTIFY_TOKEN=YOUR_TOKEN` and `export SHOP_ID=12345`
   - Optional: `export BACKGROUND_IMAGE=https://example.com/your-background.jpg`
   - Optional: `export SAFE_MODE=1` to bypass the real-order confirmation (useful for tests)
3. Start: `npm start`
4. Open: `http://localhost:3000/merch.html`

Test your token (read-only):

curl http://localhost:3000/api/printify/test

Run a quick local smoke test (after starting the server):

npm run smoke

> The server reads the `PRINTIFY_TOKEN` from environment variables. Do not commit it to the repository; rotate the token after testing.
