# B.Tech Maker registration sheet

The Early Access form now sends registrations directly to a Google Apps Script Web App. That script appends a row to one Google Sheet; no Netlify function, database, browser storage, OAuth token, or Sheet ID is exposed in the frontend.

## 1. Prepare the existing Sheet

1. Open the Google Sheet that you want to use as the central registration database. Create a new Sheet only if you do not already have one.
2. In that sheet, select **Extensions → Apps Script**. This creates a script bound to that Sheet, so the code never needs a Sheet ID in the website.
3. Replace the starter `Code.gs` with [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
4. In the Apps Script editor, select `setupRegistrationSheet` and click **Run**. Complete Google's one-time authorization prompt. The script creates a `Registrations` tab and these headings:

   `Registration ID`, `Submission Date`, `Submission Time`, `Full Name`, `Course`, `Branch`, `Contact Number`, `Email Address`, `Suggestions / Feedback`.

   If the existing `Registrations` tab already contains data, do not overwrite it. Make its first-row headings match the list above before running the setup function.

5. Set the Sheet timezone to **Asia/Kolkata** in **File → Settings** if that is the desired reporting timezone.

## 2. Configure the permitted website origin

In the Apps Script editor, open **Project Settings → Script properties** and add:

| Property | Value |
| --- | --- |
| `ALLOWED_ORIGIN` | The exact public site origin, for example `https://your-site.netlify.app` |
| `TURNSTILE_SECRET_KEY` | The private secret key for the same Cloudflare Turnstile widget as `VITE_TURNSTILE_SITE_KEY` |

Do not include a trailing slash or route. The Apps Script response uses this exact value when confirming a successful write to the parent website.

Keep `TURNSTILE_SECRET_KEY` in Apps Script Script properties only. It verifies every short-lived browser token server-side before the script can append a row; it must never be added to `.env.local`, Netlify, or frontend code.

For local testing only, set it to the exact Vite origin shown in your browser, such as `http://localhost:5174`. Change it back to the public HTTPS origin before testing or publishing the deployed site.

## 3. Deploy as a Web App

1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to **Me**. This lets the script write only to the owner’s bound Sheet; visitors receive no spreadsheet permission.
4. Set access to **Anyone** / **Anyone with the link**, selecting the least permissive option that still permits anonymous visitors to submit the public form. A public registration form normally requires anonymous access; some Workspace administrators may restrict this option.
5. Authorize the spreadsheet scope and click **Deploy**.
6. Copy the production URL ending in `/exec`. Do **not** use the `/dev` test URL: Google limits that URL to script editors.

The endpoint URL is public because browsers need to reach it. It is not a credential. Keep the Sheet private, share it only with administrators, and never put a Google OAuth token, a service-account key, or a Sheet ID in the frontend or deployment variables.

## 4. Connect the frontend

Set this build-time environment variable locally in `.env.local` and in the hosting provider’s environment settings:

```dotenv
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Redeploy the site after changing the variable. Vite embeds `VITE_` variables at build time. The registration UI remains unchanged: it validates fields, disables the button while saving, and shows success only after the script confirms the row was appended.

When updating `Code.gs` after an initial deployment, save the code and select **Deploy → Manage deployments → Edit**. Choose **New version**, then click **Deploy**. The `/exec` URL stays the same.

## 5. Verify with multiple registrations

After deployment, submit at least three different sample registrations from the deployed site. Confirm in the `Registrations` tab that:

1. Each submission is a separate row, with a unique registration ID in column A.
2. Rows appear at the bottom of the `Registrations` tab and no earlier entry is overwritten.
3. All nine fields are present, including separate submission date and time values.
4. Repeated or concurrent submissions do not replace an earlier row.

The script uses `LockService.getScriptLock()` during the append operation, then flushes the Sheet before it sends success. This serializes concurrent writes so registrations append safely. It also validates the Turnstile token on the server before saving. Google documents that web apps are deployed from **Deploy → New deployment**, and that a web app can execute as the deployer; `LockService` is designed to prevent concurrent access to shared resources. [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service), and [Cloudflare Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
