# Marketplace Sample Apps

This repository contains example serverless marketplace apps.

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