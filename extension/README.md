# Better SRM Portal — Browser Extension (Firefox Android, Firefox & Chrome)

A lightweight **Manifest V3** browser extension that makes the official SRMIST Student Portal (`https://sp.srmist.edu.in/*`) cleanly mobile-responsive with a modern bottom navigation bar—while keeping SRM's official login, CAPTCHA, and security 100% native.

## Test Locally in Firefox (10 Seconds)
1. Open **Firefox** on your laptop and go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `extension/manifest.json`.
3. Open `https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp` and press `Ctrl + Shift + M` (Responsive Design Mode) to preview the mobile UI + bottom bar!

## Test Locally in Chrome / Edge
1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/` folder.

## Publish for All SRM Students (Production)
### Firefox Add-ons (Works on Firefox for Android + Desktop — Free)
1. Zip the contents inside `extension/` (`manifest.json` at the root of the zip).
2. Go to [addons.mozilla.org/developers](https://addons.mozilla.org/developers/) → **Submit a New Add-on** → upload the `.zip`.
3. Make sure **Android** and **Desktop** are both checked.
4. Once approved, share the 1-tap Mozilla Add-ons link with students!

### Chrome Web Store (Desktop Chrome / Edge / Brave — \$5 one-time)
1. Upload the same `.zip` at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
