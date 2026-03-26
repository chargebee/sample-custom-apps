# Serverless Node.js App Template

This is a serverless Node.js application template that demonstrates how to build and test serverless functions with event-driven architecture. This template provides a foundation for creating scalable serverless applications with built-in testing capabilities.

## Features

- **Event-Driven Architecture**: Configure multiple event handlers in `manifest.json`
- **Handler Functions**: Implement your business logic in `handler.js`
- **Test Data**: Sample event data for local development and testing
- **Local Testing UI**: Interactive web interface to test your handlers
- **Logging**: Built-in logging system for debugging and monitoring

## How It Works

1. **Event Configuration**: The `manifest.json` file maps event types to their corresponding handler functions
2. **Handler Implementation**: Each event type has its handler function in `handler.js`
3. **Test Data**: Sample JSON files in `test_data/` folder match your event names (e.g., `onCustomerCreate.json`)
4. **Local Testing**: Use the CLI tool to start a local testing server with a web UI
5. **Interactive Testing**: Select event types from the dropdown and click "Test Data" to execute handlers
6. **Real-time Logs**: View execution logs directly in your terminal

## Quick Start

1. **Create your app**: `apps create <app_directory>`
2. **Navigate to app**: `cd <app_directory>`
3. **Configure API keys** (optional): Edit `.env` file and replace placeholder values with your Chargebee API keys
4. **Start local server**: `apps run <app_directory>`
5. **Open browser**: Visit `http://localhost:15000`
6. **Test handlers**: Select an event type and click "Test Data"
7. **View logs**: Check your terminal for execution output
8. **Package your app**: `apps package <app_directory>`

## Project Structure

```
├── handler/handler.js  # Main serverless function handler
├── test_data/          # Test data directory
├── types/types.d.ts    # Recognised types that can be used as JSDoc inside handler function
├── .env                # Environment variables (API keys)
├── jsconfig.json       # JS config for dev
├── manifest.json       # Project configuration
└── README.md           # Read me file
```

## Configuration

### Manifest.json

The `manifest.json` file is the core configuration file for your serverless application. It defines:

1. **Event Handlers**: Maps Chargebee webhook events to your handler functions
2. **Application Metadata**: Basic information about your application
3. **Dependencies**: Custom npm packages your application requires

#### Basic Structure

```json
{
  "name": "my-marketplace-app",
  "version": "1.0.0",
  "description": "A custom marketplace application",
  "events": {
    "customer_created": {
      "handler": "customerCreateHandler"
    },
    "subscription_created": {
      "handler": "subscriptionCreatedHandler"
    },
    "invoice_generated": {
      "handler": "invoiceGeneratedHandler"
    }
  },
  "dependencies": {
    "lodash": "^4.17.21",
    "axios": "^1.6.0"
  }
}
```

#### Event Handler Configuration

Each event in the `events` object maps a Chargebee webhook event to a handler function:

```json
{
  "events": {
    "customer_created": {
      "handler": "customerCreateHandler"
    }
  }
}
```

The handler function must be exported from `handler/handler.js`. Each handler receives a single `payload` argument; use `payload.event` to access the event data:

```javascript
// handler/handler.js
module.exports = {
  customerCreateHandler: function(/** @type {import('../types/types.d.ts').HandlerPayload} */payload) {
    // Your business logic here
    console.log('Customer created:', payload.event.content.customer.email);
    
    // Example: Send welcome email
    const customerEmail = payload.event.content.customer.email;
    const customerName = payload.event.content.customer.first_name;
    
    // You can use custom dependencies here
    const moment = require('moment');
    const welcomeMessage = `Welcome ${customerName}! You joined on ${moment().format('MMMM Do YYYY')}`;
    
    console.log(welcomeMessage);
  }
};
```

#### Custom Dependencies

You can add custom npm packages to your application by including them in the `dependencies` section:

```json
{
  "dependencies": {
    "lodash": "^4.17.21",
    "axios": "^1.6.0",
    "uuid": "^9.0.0"
  }
}
```

Then use them in your handler functions:

```javascript
// handler/handler.js
const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  customerCreateHandler: function(/** @type {import('../types/types.d.ts').HandlerPayload} */payload) {
    // Use lodash for data manipulation
    const customerData = _.pick(payload.event.content.customer, ['email', 'first_name', 'last_name']);
    
    // Generate unique ID
    const customerId = uuidv4();
    
    // Make HTTP requests
    axios.post('https://api.example.com/customers', {
      id: customerId,
      ...customerData,
      created_at: moment().toISOString()
    }).then(response => {
      console.log('Customer synced to external system:', response.data);
    }).catch(error => {
      console.error('Failed to sync customer:', error.message);
    });
  },
  
  subscriptionCreatedHandler: function(/** @type {import('../types/types.d.ts').HandlerPayload} */payload) {
    // Use moment for date formatting
    const subscriptionDate = moment(payload.event.content.subscription.created_at * 1000);
    const formattedDate = subscriptionDate.format('MMMM Do YYYY, h:mm:ss a');
    
    console.log(`New subscription created on ${formattedDate}`);
    
    // Use lodash for data validation
    const requiredFields = ['id', 'customer_id', 'plan_id'];
    const missingFields = _.difference(requiredFields, Object.keys(payload.event.content.subscription));
    
    if (missingFields.length > 0) {
      console.warn('Missing subscription fields:', missingFields);
    }
  }
};
```

#### Supported Event Types
Marketplace supports all the event types that are provided in the Chargebee's [documentation](https://apidocs.chargebee.com/docs/api/events#event_types).

### Environment Variables

The CLI exposes **only these three** variables via `process.env`; no other environment variables are available to your handlers:

| Variable | Description |
|----------|-------------|
| `MKPLC_CB_READ_ONLY_API` | Chargebee read-only API key |
| `MKPLC_CB_READ_WRITE_API` | Chargebee read-write API key |
| `MKPLC_SITE_DOMAIN` | Chargebee site domain |

- **Production:** The system provides these values at runtime. You do not configure them in production.
- **Local development:** You must provide these values in the `.env` file so your handlers can run locally.

#### Setting up .env for local development

1. **Open the `.env` file** in your project root
2. **Replace the placeholder values** with your actual Chargebee API keys:

```env
# Replace these with your actual Chargebee API keys
MKPLC_CB_READ_ONLY_API=your_read_only_api_key_here
MKPLC_CB_READ_WRITE_API=your_read_write_api_key_here
MKPLC_SITE_DOMAIN=yousite123
```

#### Using these variables in your handlers

Access them through the `process.env` object in your handler functions:

```javascript
// handler/handler.js
module.exports = {
  customerCreateHandler: async function(/** @type {import('../types/types.d.ts').HandlerPayload} */payload) {
    // Access your API keys
    const readOnlyApiKey = process.env.MKPLC_CB_READ_ONLY_API;
    const readWriteApiKey = process.env.MKPLC_CB_READ_WRITE_API;

    if (!readOnlyApiKey || !readWriteApiKey) {
      console.error('API keys not configured. Please check your .env file.');
      return;
    }

    // Use the API keys for Chargebee API calls
    console.log('Using API keys for Chargebee integration');

    const Chargebee = require('chargebee');
    const chargebee = new Chargebee({
      site: process.env.MKPLC_SITE_DOMAIN,
      apiKey: process.env.MKPLC_CB_READ_ONLY_API
    });

    const result = await chargebee.customer.retrieve(payload.event.content.customer.id);
    console.log(result.customer);
  }
};
```

#### Security Notes

- **Never commit real API keys** to version control
- The `.env` file in this template contains placeholder values
- Replace the placeholder values with your actual API keys before testing
- Keep your API keys secure and don't share them publicly

## Local Testing

Use the CLI tool to test your functions locally with an interactive web interface:

```bash
# Start the testing server on a specific port
apps run <app_directory> --port <port>
# Example:
apps run ./sample_app_v0 --port 16000

# Open http://localhost:16000 in your browser
# Select event types from the dropdown and click "Test Data" to execute handlers
# View real-time logs in your terminal
```

## Testing

Test data files are located in the `test_data/` directory. Each file is named after its corresponding event type (e.g., `customer_created.json`, `customer_updated.json`). These JSON files contain sample event data that you can use to test your handlers during local development.

The test data structure should match the expected input format for your handler functions. You can modify these files to test different scenarios or add new test data files for additional event types.

## Packaging

The package command bundles your serverless application into a zip file for deployment.

### Basic Usage

```bash
# Package with default name (app directory name)
apps package <app_directory>

# Package with custom name
apps package <app_directory> --name my-app-v1.0.0
```

### Examples

```bash
# Package current directory
apps package .

# Package specific directory
apps package ./my-app

# Package with versioned name
apps package ./my-app --name my-app-v1.0.0
```