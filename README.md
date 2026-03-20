# optional-numbers

A GitHub Pages ready web app to save phone numbers in browser cache (localStorage).

## Features

- Two input fields only:
- Select country code
- Enter phone number
- List all saved numbers
- Edit number
- Delete number
- Open WhatsApp from each saved number

## How it works

- Data is saved in browser localStorage as a phone cache.
- WhatsApp opens in browser with a URL like:
- `https://api.whatsapp.com/send?phone=+97112345678`

## Run locally

Open `index.html` directly in your browser.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Go to repository **Settings** -> **Pages**.
3. In **Build and deployment**, set:
4. Source: **Deploy from a branch**
5. Branch: **main** (or your default branch), folder: **/ (root)**
6. Save.
7. GitHub will provide your live Pages URL.
