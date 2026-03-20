# optional-numbers

A GitHub Pages ready web app to save phone numbers in browser cache (localStorage).

URL : https://nomansadiq11.github.io/optional-numbers/

## Features

- Enter name
- Select country code
- Enter phone number
- List all saved numbers
- Edit number
- Delete number
- Open WhatsApp from each saved number
- Export all saved numbers as CSV (button above list)

## How it works

- Data is saved in browser localStorage as a phone cache.
- WhatsApp opens in browser with a URL like:
- `https://api.whatsapp.com/send?phone=+97112345678`

## Run locally

Open `index.html` directly in your browser.

## Use as a mobile app (Android / iPhone)

You can install this website on your phone home screen and use it like an app.

### Android (Chrome)

1. Open the app URL in Chrome:
	`https://nomansadiq11.github.io/optional-numbers/`
2. Tap the 3-dot menu in Chrome.
3. Tap **Add to Home screen** or **Install app**.
4. Confirm install.
5. Open it from your home screen like a normal app.

### iPhone (Safari)

1. Open the app URL in Safari:
	`https://nomansadiq11.github.io/optional-numbers/`
2. Tap the **Share** button.
3. Tap **Add to Home Screen**.
4. Tap **Add**.
5. Open it from your home screen like a normal app.

### Important notes

- Your numbers are saved in browser localStorage on that phone.
- If you clear browser/site data, saved numbers will be removed.
- Data does not sync automatically between different devices.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Go to repository **Settings** -> **Pages**.
3. In **Build and deployment**, set:
4. Source: **Deploy from a branch**
5. Branch: **main** (or your default branch), folder: **/ (root)**
6. Save.
7. GitHub will provide your live Pages URL.
