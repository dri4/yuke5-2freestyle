Security & deployment notes
===========================

1) Keep secrets out of the repo
 - Never commit `.env` to GitHub. Use `.env.example` as a template (already added).
 - `.gitignore` already ignores `.env` and `.env.*`.

2) Where to store environment variables when deploying
 - Netlify: Site settings -> Build & deploy -> Environment -> Environment variables. Add the keys from `.env.example` there.
 - Vercel: Project -> Settings -> Environment Variables. Add the keys there.
 - GitHub Actions: Use repository Secrets (Settings -> Secrets -> Actions). In deploy workflows reference them as `${{ secrets.MY_SECRET }}`.

3) Discord webhook handling
 - Keep the webhook value in an environment variable (DISCORD_WEBHOOK_URL) and never paste it into code or client-side files.
 - The server endpoint posts to the webhook; the webhook will not be visible to users unless you accidentally commit it.

4) Email sending with ProtonMail
 - Proton Mail does not provide a public SMTP API for free accounts. If you have Proton's Bridge or SMTP credentials, you may configure `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`.
 - Recommended alternative: Use a transactional email provider (SendGrid, Mailgun, Postmark). They provide API keys that are simple to store in environment variables.

5) GitHub visibility & private repo
 - If you plan to push to GitHub and want to avoid exposing the source publicly, set the repository to private.
 - On Netlify, you can connect a private repo or deploy by pushing via the Netlify CLI with environment variables set.

6) Rotating webhooks/keys
 - If your webhook is ever accidentally exposed, rotate it immediately (create a new webhook in Discord and update DISCORD_WEBHOOK_URL in your environment).

7) Netlify Functions
 - If you deploy the frontend on Netlify you can also add the contact endpoint as a Netlify Function. The code in `netlify/functions/contact.ts` reads `DISCORD_WEBHOOK_URL` and `SENDGRID_API_KEY` from environment variables.
 - Set these values in Netlify: Site -> Site settings -> Build & deploy -> Environment -> Environment variables. Netlify functions automatically get these environment variables at build/runtime.
 - Keep the webhook and API keys in Netlify's environment UI and never paste them into the repository.

