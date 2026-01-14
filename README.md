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

Quick start (local-only mode):
1. Install: `npm install`
2. Start: `npm start`
3. Open: `http://localhost:3000/merch.html`

Notes:
- Products are served locally from `assets/products.json` and no external Printify calls are made by default (privacy-focused).
- Orders are stored locally in `orders/` and are only viewable via the admin endpoints when `ADMIN_TOKEN` is set (see `.env.example`).
- Optional: configure `SENDGRID_API_KEY` and `EMAIL_FROM` to enable confirmation emails (only sent if the buyer requests a confirmation). See `.env.example` for variable names.

Admin endpoints (protected):
- GET /admin/orders (requires header `Authorization: Bearer <ADMIN_TOKEN>`)
- GET /admin/orders/:id (requires header `Authorization: Bearer <ADMIN_TOKEN>`)

Run a quick local smoke test (after starting the server):

npm run smoke

> Private keys and tokens should never be committed to the repo. If you set an admin token, keep it secret and rotate if it is exposed.
