import { handler } from "../index.mjs";
import { parseEvent, validateEvent } from "../internal/utility.mjs";
// @ts-ignore
import { jest } from "@jest/globals";

// Mock console.log and console.error
// @ts-ignore
const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
// @ts-ignore
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

// Mock appMeta
jest.unstable_mockModule("../app-meta.json", () => ({
  default: {
    eventHandlers: {
      customer_created: "handlers/customer",
      subscription_created: "handlers/subscription",
    },
  },
}));


describe("handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should process valid Chargebee event successfully", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          EventVersion: "1.0",
          Sns: {
            MessageId: "123",
            Timestamp: "2025-03-12T12:00:00Z",
            Message: JSON.stringify({
              id: "evt_123",
              event_type: "customer_created",
              content: { customer: { id: "cust_123" } },
              api_version: "v2",
              object: "event",
              occurred_at: 1647123456,
              source: "webhook",
              webhook_status: "succeeded",
              webhooks: []
            }),
            TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
          },
        },
      ],
    };

    // @ts-ignore
    const result = await handler(mockEvent);
    
    expect(console.log).toHaveBeenCalledWith("EventSource: aws:sns");
    expect(console.log).toHaveBeenCalledWith("EventVersion: 1.0");
    expect(console.log).toHaveBeenCalledWith("SNS MessageId: 123");
    expect(console.log).toHaveBeenCalledWith("SNS Timestamp: 2025-03-12T12:00:00Z");
    expect(console.log).toHaveBeenCalledWith("SNS TopicArn: arn:aws:sns:us-east-1:123456789012:test-topic");
    expect(console.log).toHaveBeenCalledWith("Processing Chargebee event type: customer_created");
  });

  test("should return undefined when no event records found", async () => {
    const mockEvent = {
      Records: [],
    };

    const result = await handler(mockEvent);
    
    expect(console.log).toHaveBeenCalledWith("No records found in event");
    expect(console.error).toHaveBeenCalledWith("No event records found in incoming event");
    expect(result).toBeUndefined();
  });

  test("should return undefined when event record is null", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          Sns: {
            MessageId: "123",
            Message: "{}",
          },
        },
      ],
    };

    const result = await handler(mockEvent);
    
    expect(console.error).toHaveBeenCalledWith("Invalid Chargebee event record received - missing required fields");
    expect(result).toBeUndefined();
  });

  test("should return undefined when event record is invalid", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          Sns: {
            MessageId: "123",
            Message: JSON.stringify({
              id: "evt_123",
              // missing event_type and content
            }),
          },
        },
      ],
    };

    const result = await handler(mockEvent);
    
    expect(console.error).toHaveBeenCalledWith("Invalid Chargebee event record received - missing required fields");
    expect(result).toBeUndefined();
  });

  test("should return undefined when event type is missing", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          Sns: {
            MessageId: "123",
            Message: JSON.stringify({
              id: "evt_123",
              content: { customer: { id: "cust_123" } },
              // missing event_type
            }),
          },
        },
      ],
    };

    const result = await handler(mockEvent);
    
    expect(console.error).toHaveBeenCalledWith("Invalid Chargebee event record received - missing required fields");
    expect(result).toBeUndefined();
  });

  test("should return undefined when no handler is configured for event type", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          Sns: {
            MessageId: "123",
            Message: JSON.stringify({
              id: "evt_123",
              event_type: "unknown_event",
              content: { customer: { id: "cust_123" } },
              api_version: "v2",
              object: "event",
              occurred_at: 1647123456,
              source: "webhook",
              webhook_status: "succeeded",
              webhooks: []
            }),
          },
        },
      ],
    };

    const result = await handler(mockEvent);
    
    expect(console.error).toHaveBeenCalledWith("No handler configured for event type: unknown_event");
    expect(result).toBeUndefined();
  });

  test("should throw error for unsupported event source", async () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sqs", // unsupported
          Sns: {
            MessageId: "123",
            Message: "{}",
          },
        },
      ],
    };

    await expect(handler(mockEvent)).rejects.toThrow("Unsupported EventSource: aws:sqs");
  });
});

describe("utility functions", () => {
  test("parseLambdaEvent should parse SNS record correctly", () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sns",
          Sns: {
            MessageId: "123",
            Message: JSON.stringify({
              id: "evt_123",
              event_type: "customer_created",
              content: { customer: { id: "cust_123" } },
              api_version: "v2",
              object: "event",
              occurred_at: 1647123456,
              source: "webhook",
              webhook_status: "succeeded",
              webhooks: []
            }),
          },
        },
      ],
    };

    const result = parseEvent(mockEvent);
    
    expect(result).toEqual({
      id: "evt_123",
      event_type: "customer_created",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    });
  });

  test("parseLambdaEvent should return null for empty records", () => {
    const mockEvent = {
      Records: [],
    };

    const result = parseEvent(mockEvent);
    
    expect(result).toBeNull();
  });

  test("parseLambdaEvent should throw for unsupported event source", () => {
    const mockEvent = {
      Records: [
        {
          EventSource: "aws:sqs",
          Sns: {
            MessageId: "123",
            Message: "{}",
          },
        },
      ],
    };

    expect(() => parseEvent(mockEvent)).toThrow("Unsupported EventSource: aws:sqs");
  });

  test("eventRecord.event_type should extract event type correctly", () => {
    const eventRecord = {
      id: "evt_123",
      event_type: "customer_created",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    const result = eventRecord.event_type;
    
    expect(result).toBe("customer_created");
  });

  test("eventRecord.event_type should return undefined for missing event type", () => {
    const eventRecord = {
      id: "evt_123",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    // @ts-ignore
    const result = eventRecord.event_type;
    
    expect(result).toBeUndefined();
  });

  test("validateEventRecord should return true for valid record", () => {
    const eventRecord = {
      id: "evt_123",
      event_type: "customer_created",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    // @ts-ignore
    const result = validateEvent(eventRecord);
    
    expect(result).toBe(true);
  });

  test("validateEventRecord should return false for null record", () => {
    // @ts-ignore
    const result = validateEvent(null);
    
    expect(result).toBe(false);
  });

  test("validateEventRecord should return false for missing id", () => {
    const eventRecord = {
      event_type: "customer_created",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    // @ts-ignore
    const result = validateEvent(eventRecord);
    
    expect(result).toBe(false);
  });

  test("validateEventRecord should return false for missing event_type", () => {
    const eventRecord = {
      id: "evt_123",
      content: { customer: { id: "cust_123" } },
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    // @ts-ignore
    const result = validateEvent(eventRecord);
    
    expect(result).toBe(false);
  });

  test("validateEventRecord should return false for missing content", () => {
    const eventRecord = {
      id: "evt_123",
      event_type: "customer_created",
      api_version: "v2",
      object: "event",
      occurred_at: 1647123456,
      source: "webhook",
      webhook_status: "succeeded",
      webhooks: []
    };

    // @ts-ignore
    const result = validateEvent(eventRecord);
    
    expect(result).toBe(false);
  });
});