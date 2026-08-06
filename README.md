# Sample Custom Apps

This repository contains sample apps for building custom apps using the [chargebee-apps](https://www.npmjs.com/package/@chargebee/chargebee-apps) CLI.

## Quick start

1. Install the CLI:

```bash
npm install -g @chargebee/chargebee-apps
```

2. Choose a sample app directory.
3. Configure `.env` (and `iparams.local.json` for iparams-based apps).
4. Run locally:

```bash
chargebee-apps run <app_dir>
```

5. Open `http://localhost:15000` and trigger events using the provided `test_data`.
