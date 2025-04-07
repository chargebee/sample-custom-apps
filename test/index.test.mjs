import { jest } from "@jest/globals";
import handler from "../index.mjs";

// Mock console.log and console.error
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

// Mock appMeta
jest.unstable_mockModule("../app-meta.json", () => ({
  default: {
    eventHandlers: {
      dummyEvent: "dummyEventHandler",
    },
  },
}));

describe("handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should log an error when event type or domain is missing", async () => {
    const mockEvent = {
      Records: [
        {
          Sns: {
            MessageId: "123",
            Timestamp: "2025-03-12T12:00:00Z",
            Message: JSON.stringify({}),
            MessageAttributes: {},
          },
        },
      ],
    };

    await handler(mockEvent);
    expect(console.error).toHaveBeenCalledWith(
      "Couldn't get the Event Type or Domain"
    );
  });

  test("should log an error when no handler is found for event type", async () => {
    const mockEvent = {
      Records: [
        {
          Sns: {
            MessageId: "123",
            Timestamp: "2025-03-12T12:00:00Z",
            Message: JSON.stringify({ event_type: "unknown" }),
            MessageAttributes: { domain: { Value: "dummydomain-test" } },
          },
        },
      ],
    };

    await handler(mockEvent);
    expect(console.error).toHaveBeenCalledWith(
      "No Handler found for Event Type unknown"
    );
  });

  test("should throw an error when an exception occurs", async () => {
    const mockEvent = {
      Records: [
        {
          Sns: {
            MessageId: "123",
            Timestamp: "2025-03-12T12:00:00Z",
            Message: "{invalidJson", // JSON.parse will throw an error
            MessageAttributes: { domain: { Value: "dummydomain-test" } },
          },
        },
      ],
    };

    await expect(handler(mockEvent)).rejects.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Processing failed/)
    );
  });
});
