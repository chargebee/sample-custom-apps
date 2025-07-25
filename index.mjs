import appMeta from "./app-meta.json" with { type: 'json' };
import { parseLambdaEvent, getEventType, validateEventRecord } from "./internal/utility.mjs";

/**
 * Main event handler for processing Chargebee marketplace events
 * 
 * This function serves as the entry point and handles the complete
 * event processing pipeline:
 * 1. Parses incoming events using internal utility functions
 * 2. Validates the parsed Chargebee event record
 * 3. Routes to the appropriate event handler based on event type
 * 4. Returns the handler's response
 * 
 * The function abstracts all infrastructure complexity and provides a clean
 * interface for processing Chargebee webhook events.
 * 
 * IMPORTANT: This file is part of the core infrastructure.
 * Users should not modify this file as it handles core event processing.
 * 
 * @param {Object} event - Event object from the hosting environment
 * @returns {Promise<any>} The result of processing the event
 */
export const handler = async (event) => {
  try {
    // Step 1: Parse event and extract Chargebee event record
    // This automatically detects the event source and parses accordingly
    const eventRecord = parseLambdaEvent(event);
    
    if (!eventRecord) {
      console.error('No event records found in incoming event');
      return;
    }
    
    // Step 2: Validate the parsed Chargebee event record
    // Ensures we have all required fields before processing
    if (!validateEventRecord(eventRecord)) {
      console.error('Invalid Chargebee event record received - missing required fields');
      return;
    }
    
    // Step 3: Extract event type for routing
    const eventType = getEventType(eventRecord);
    if (!eventType) {
      console.error('Could not extract event type from Chargebee event');
      return;
    }

    console.log(`Processing Chargebee event type: ${eventType}`);

    // Step 4: Route to appropriate handler based on event type
    // @ts-ignore
    const handlerPath = appMeta.eventHandlers[eventType];
    if (!handlerPath) {
      console.error(`No handler configured for event type: ${eventType}`);
      console.log(`Available handlers: ${Object.keys(appMeta.eventHandlers).join(', ')}`);
      return;
    }
    
    // Step 5: Dynamically import and execute the handler with the event record
    const handler = await import(`./${handlerPath}.mjs`);
    return handler.handle(eventRecord);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Event processing failed: ${errorMessage}`);
    throw error;
  }
};
