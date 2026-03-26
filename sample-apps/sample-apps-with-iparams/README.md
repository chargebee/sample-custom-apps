# Serverless Node.js App Template With iParams

This is a serverless Node.js application template that demonstrates how to build and test serverless functions with event-driven architecture and iParams-based configuration. This template provides a foundation for creating scalable serverless applications with built-in testing capabilities and configurable parameters.

## Features

- **Event-Driven Architecture**: Configure multiple event handlers in `manifest.json`
- **iParams Support**: Define app configuration schema in `iparams.json` and provide local values in `iparams.local.json`
- **Handler Functions**: Implement your business logic in `handler.js`
- **Test Data**: Sample event data for local development and testing
- **Local Testing UI**: Interactive web interface to test your handlers
- **Logging**: Built-in logging system for debugging and monitoring

## How It Works

1. **Event Configuration**: The `manifest.json` file maps event types to their corresponding handler functions
2. **Handler Implementation**: Each event type has its handler function in `handler.js`
3. **iParams Configuration**: Define parameter schema in `iparams.json` and provide local values in `iparams.local.json`
4. **Test Data**: Sample JSON files in `test_data/` folder match your event names (e.g., `onCustomerCreate.json`)
5. **Local Testing**: Use the CLI tool to start a local testing server with a web UI
6. **Interactive Testing**: Select event types from the dropdown and click "Test Data" to execute handlers
7. **Real-time Logs**: View execution logs directly in your terminal

## Quick Start

1. **Create your app**: `apps create <app_directory>`
2. **Navigate to app**: `cd <app_directory>`
3. **Configure parameters** (optional): You can set the values for the system env vars in the `.env` file if required ([supported system env vars](#environment-variables-system-provided)). For other config, define iparams in `iparams.json` and provide values in `iparams.local.json` (local) or through the web UI (production). See [Installation Parameters (iParams)](#installation-parameters-iparams) for details.
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
├── .env                # Environment variables (API keys, site domain)
├── iparams.json        # Parameter definitions (schema)
├── iparams.local.json  # Parameter values for local testing
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

The handler function must be exported from `handler/handler.js`. Each handler receives a single `payload` argument with `payload.event` (the webhook event) and `payload.iparams` (installation parameters):

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

### Environment Variables (system-provided)

The CLI exposes **only these three** variables via `process.env`; no other environment variables are available to your handlers:

| Variable | Description |
|----------|-------------|
| `MKPLC_CB_READ_ONLY_API` | Chargebee read-only API key |
| `MKPLC_CB_READ_WRITE_API` | Chargebee read-write API key |
| `MKPLC_SITE_DOMAIN` | Chargebee site domain |

- **Production:** The system provides these values at runtime. You do not configure them in production.
- **Local development:** You must provide these values in the `.env` file so your handlers can run locally.

**Other configuration** (API keys, secrets, custom settings) must use [Iparams](#installation-parameters-iparams)—either through the marketplace UI or via `iparams.json` and `iparams.local.json`.

#### Setting up .env for local development

1. **Open the `.env` file** in your project root.
2. **Replace only the placeholder values** for the three variables above. Do not add new env vars—only these three are supported, and the `.env` file is **not packaged** with your app. Any other variables you add in `.env` will not be available when the app runs in production.

```env
MKPLC_CB_READ_ONLY_API=your_read_only_api_key_here
MKPLC_CB_READ_WRITE_API=your_read_write_api_key_here
MKPLC_SITE_DOMAIN=yousite123
```

#### Using these variables in your handlers

```javascript
// handler/handler.js – only these three vars are available from process.env
const readOnlyApiKey = process.env.MKPLC_CB_READ_ONLY_API;
const readWriteApiKey = process.env.MKPLC_CB_READ_WRITE_API;
const siteDomain = process.env.MKPLC_SITE_DOMAIN;
```

#### Security notes

- **Never commit real API keys** to version control.
- Replace the placeholder values in `.env` with your actual values only for local testing.

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


## Installation Parameters (Iparams)

Installation parameters allow you to configure your serverless application with user-provided values that can be used in your handler functions. These parameters are defined in `iparams.json` and their values are provided in `iparams.local.json` (for local testing) or through the marketplace UI (for production).

### Overview

Installation parameters provide a way to:
- **Configure your app**: Allow users to customize your application behavior
- **Store credentials**: Securely store API keys, secrets, and configuration values
- **Provide defaults**: Set sensible default values that users can override
- **Validate inputs**: Ensure users provide valid values for required parameters

### File Structure

- **`iparams.json`**: Defines the iparams (schema) - what parameters your app accepts
- **`iparams.local.json`**: Contains the actual parameter values for local testing

### Defining Parameters (iparams.json)

The `iparams.json` file is an array of parameter definitions. Each parameter definition is an object with the following fields:

#### Parameter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the parameter (used as key in inputs). Must be 1-50 characters, start with a letter or underscore, and contain only alphanumeric characters, underscores, and hyphens. Cannot contain spaces. |
| `display_name` | string | Yes | Human-readable name shown in the UI. Maximum 50 characters. |
| `description` | string | Yes | Description of what the parameter is used for. Maximum 250 characters. |
| `type` | string | Yes | Data type of the parameter. See [Supported Types](#supported-parameter-types) below. |
| `required` | boolean | No | Whether the parameter is required. Defaults to `false` if not specified. **Note**: If a parameter has a `default` value, setting `required: true` has no practical effect since the default will always be used. |
| `default` | varies | No | Default value for the parameter. If present and not `null`, must be a valid value for the parameter type. |
| `options` | string[] | Conditional | Required for `DROPDOWN` and `MULTISELECT_DROPDOWN` types. Array of valid option values. |


### Supported Parameter Types

#### 1. `TEXT`

**Purpose**: Use for API keys, names, descriptions, or any string value.

**Input**: String values (maximum 500 characters)

**Example:**
```json
{
  "name": "api_key",
  "display_name": "API Key",
  "description": "Your API key for external service",
  "type": "TEXT",
  "required": true
}
```

#### 2. `SECRET`

**Purpose**: Use for sensitive data like passwords or API secrets. Values are stored encrypted. **Cannot have a default value** for security reasons.

**Input**: String values (same as text, but treated as sensitive data)

**Example:**
```json
{
  "name": "api_secret",
  "display_name": "API Secret",
  "description": "Your API secret key",
  "type": "SECRET",
  "required": true
}
```

#### 3. `URL`

**Purpose**: Use for webhook URLs, API endpoints, or any URL value.

**Input**: Valid URL strings (maximum 250 characters)

**Example:**
```json
{
  "name": "webhook_url",
  "display_name": "Webhook URL",
  "description": "URL for webhook notifications",
  "type": "URL",
  "required": true
}
```

#### 4. `NUMBER`

**Purpose**: Use for counts, percentages, timeouts, or any numeric configuration.

**Input**: Numbers (integers or decimals)

**Example:**
```json
{
  "name": "max_retries",
  "display_name": "Max Retries",
  "description": "Maximum number of retry attempts",
  "type": "NUMBER",
  "required": false
}
```

#### 5. `BOOLEAN`

**Purpose**: Use for feature flags, enable/disable toggles, or any yes/no configuration.

**Input**: Boolean values (`true` or `false`)

**Example:**
```json
{
  "name": "enable_notifications",
  "display_name": "Enable Notifications",
  "description": "Enable email notifications",
  "type": "BOOLEAN",
  "required": false
}
```

#### 6. `DROPDOWN`

**Purpose**: Use when you want users to choose one value from a fixed set of choices.

**Input**: One string value from the `options` array (maximum 250 characters per option)

**Example:**
```json
{
  "name": "environment",
  "display_name": "Environment",
  "description": "Select the environment",
  "type": "DROPDOWN",
  "required": true,
  "default": "production",
  "options": ["development", "staging", "production"]
}
```

#### 7. `MULTISELECT_DROPDOWN`

**Purpose**: Use when users need to select one or more values from a fixed set of choices.

**Input**: Array of strings, where each string is from the `options` array (maximum 500 characters per option)

**Example:**
```json
{
  "name": "regions",
  "display_name": "Regions",
  "description": "Select regions where the service is available",
  "type": "MULTISELECT_DROPDOWN",
  "required": false,
  "default": ["US", "EU"],
  "options": ["US", "EU", "APAC", "LATAM", "MEA"]
}
```

#### 8. `DATE`

**Purpose**: Use for expiry dates, start dates, or any date-based configuration.

**Input**: Date strings in `YYYY-MM-DD` format (e.g., `2025-12-31`)

**Example:**
```json
{
  "name": "expiry_date",
  "display_name": "Expiry Date",
  "description": "Expiration date for the subscription",
  "type": "DATE",
  "required": false,
  "default": "2025-12-31"
}
```

### Important Notes About Default Values

1. **Default values are always applied**: If a parameter has a `default` value (and it's not `null`), that default will be used whenever the user doesn't provide a value, regardless of whether the parameter is `required` or not.

2. **`required: true` with `default` has no practical meaning**: If a parameter has both `required: true` and a `default` value, the default will always be used when no value is provided, so the parameter will never be "missing". Setting `required: true` in this case doesn't add any validation benefit.

3. **When to use `required: true`**: Only use `required: true` when you want to **force** the user to provide a value and you don't have a default. This ensures the parameter will fail validation if not provided.

4. **When to use `default`**: Use `default` when you want to provide a sensible fallback value that users can override if needed. This is especially useful for optional parameters.



### Providing Parameter Values

#### For Local Testing (iparams.local.json)

You can provide values in the `iparams.local.json` file in your app directory, or use the web UI. Here's an example of the file format:

```json
{
  "external_api_key": "test-api-key-12345",
  "external_api_secret": "test-secret-key",
  "external_api_url": "https://api.test.example.com",
  "default_currency": "EUR",
  "regions": ["US", "APAC"],
  "additional_fee_percent": 5.5,
  "enable_feature_x": true,
  "expiry_date": "2026-12-31"
}
```



#### Using the Web UI

When you run `apps run`, a web interface is available at `http://localhost:15000` with tabs:

1. **"Iparams" Tab**: 
   - Edit the `iparams.json` iparams
   - Define all your parameters with their types, descriptions, and defaults
   - Click "Edit" to enable editing, then "Save Iparams" to save changes

2. **"Iparams Inputs" Tab**:
   - View parameters in a form or JSON view
   - Provide values for your parameters
   - Values are saved to `iparams.local.json`
   - Default values are automatically loaded and displayed
   - Click "Switch to JSON" to toggle between form view and JSON view
   - Click "Edit" to enable editing, then "Save Inputs" to save your values


### Using Parameters in Your Handlers

Each handler receives a single `payload` argument. Use `payload.event` for the webhook event and `payload.iparams` for installation parameters:

```javascript
// handler/handler.js
module.exports = {
  customerCreateHandler: function(
    /** @type {import('../types/types.d.ts').HandlerPayload} */payload
  ) {
    const iparams = payload.iparams;

    // Access parameter values
    const apiKey = iparams.external_api_key;
    const apiUrl = iparams.external_api_url;
    const currency = iparams.default_currency;
    const regions = iparams.regions; // Array for MULTISELECT_DROPDOWN
    
    console.log('API Key:', apiKey);
    console.log('API URL:', apiUrl);
    console.log('Currency:', currency);
    console.log('Regions:', regions);
    
    // Use parameters in your logic
    if (iparams.enable_feature_x) {
      console.log('Feature X is enabled');
    }
    
    // Make API calls using parameters
    const axios = require('axios');
    axios.post(`${apiUrl}/customers`, {
      apiKey: apiKey,
      currency: currency,
      regions: regions
    });
  }
};
```

### Complete Example

Here's a complete `iparams.json` example with all parameter types:

```json
[
  {
    "name": "external_api_key",
    "display_name": "External API Key",
    "description": "API key for external service integration",
    "type": "TEXT",
    "required": true
  },
  {
    "name": "external_api_secret",
    "display_name": "External API Secret",
    "description": "Secret for external service",
    "type": "SECRET",
    "required": true
  },
  {
    "name": "external_api_url",
    "display_name": "External API URL",
    "description": "Base URL for external API",
    "type": "URL",
    "default": "https://api.example.com"
  },
  {
    "name": "default_currency",
    "display_name": "Default Currency",
    "description": "Default currency code for transactions",
    "type": "DROPDOWN",
    "default": "USD",
    "options": ["USD", "EUR", "GBP", "INR"]
  },
  {
    "name": "regions",
    "display_name": "Regions",
    "description": "Select regions where the service is available",
    "type": "MULTISELECT_DROPDOWN",
    "default": ["US", "EU"],
    "options": ["US", "EU", "APAC", "LATAM", "MEA"]
  },
  {
    "name": "additional_fee_percent",
    "display_name": "Additional Fee (%)",
    "description": "Additional fee percentage to be applied",
    "type": "NUMBER",
    "required": true
  },
  {
    "name": "enable_feature_x",
    "display_name": "Enable Feature X",
    "description": "Enable advanced feature X",
    "type": "BOOLEAN",
    "default": false
  },
  {
    "name": "expiry_date",
    "display_name": "Expiry Date",
    "description": "Expiration date for the subscription",
    "type": "DATE",
    "default": "2025-12-31"
  }
]
```