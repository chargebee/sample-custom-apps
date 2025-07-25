/**
 * Internal utility functions for parsing event messages
 * This abstracts service-specific parsing and provides a clean interface
 * 
 * IMPORTANT: This file is part of the internal infrastructure.
 * Users should not modify this file as it handles core event processing.
 */

/**
 * Parse event and extract the first event record based on event source
 * @param {Object} event - Event object containing service records
 * @returns {import('../types.d.ts').EventRecord|null} First parsed event record or null if none found
 */
export const parseEvent = (event) => {
  // @ts-ignore
  const { Records } = event;
  
  if (!Records || Records.length === 0) {
    console.log('No records found in event');
    return null;
  }
  
  // Always process the first record
  const firstRecord = Records[0];
  const { EventSource, EventVersion } = firstRecord;
  
  // Log event metadata for debugging (internal use only)
  console.log(`EventSource: ${EventSource}`);
  console.log(`EventVersion: ${EventVersion}`);
  
  // Generic logic to determine service type and parse accordingly
  switch (EventSource) {
    case 'aws:sns':
      return parseSNSRecord(firstRecord);
      
    // Future support for other services can be added here
    // case 'aws:sqs':
    //   return parseSQSRecord(firstRecord);
      
    default:
      throw new Error(`Unsupported EventSource: ${EventSource}`);
  }
};

/**
 * Parse SNS record and extract the event data
 * @param {Object} snsRecord - SNS record from event
 * @returns {import('../types.d.ts').EventRecord} Parsed event record
 */
const parseSNSRecord = (snsRecord) => {
  // @ts-ignore
  const { Sns } = snsRecord;
  const { MessageId, Timestamp, Message, TopicArn } = Sns;
  
  // Log service metadata for debugging (internal use only)
  console.log(`SNS MessageId: ${MessageId}`);
  console.log(`SNS Timestamp: ${Timestamp}`);
  console.log(`SNS TopicArn: ${TopicArn}`);
  
  try {
    /** @type {import('../types.d.ts').EventRecord} */
    const parsedMessage = JSON.parse(Message);
    return parsedMessage;
  } catch (error) {
    console.error(`Failed to parse message JSON: ${error}`);
    throw error;
  }
};

/**
 * Validate if event record has required fields
 * @param {import('../types.d.ts').EventRecord} eventRecord - Parsed event record
 * @returns {boolean} Whether the event record is valid
 */
export const validateEvent = (eventRecord) => {
  return !!(eventRecord && 
         eventRecord.id && 
         eventRecord.event_type && 
         eventRecord.content);
}; 