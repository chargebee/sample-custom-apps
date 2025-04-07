import appMeta from "./app-meta.json" with { type: 'json' };

const handler = async (event) => {
  for (const record of event.Records) {
    try {
      console.log(`messageId : ${record.Sns.MessageId}`);
      console.log(`timestamp : ${record.Sns.Timestamp}`);
      const message = record.Sns.Message;
      const messageAttributes = record.Sns.MessageAttributes;
      const parsedMessage = JSON.parse(message);
      const eventType = getEventType(parsedMessage);
      const domain = getDomain(messageAttributes);

      if (!eventType || !domain) {
        console.error(`Couldn't get the Event Type or Domain`);
        continue;
      }

      console.log(`eventType : ${eventType}`);
      console.log(`domain : ${domain}`);

      const handlerPath = appMeta.eventHandlers[eventType];
      if (!handlerPath) {
        console.error(`No Handler found for Event Type ${eventType}`);
        continue;
      }
      const handler = await import(`./${handlerPath}.mjs`);
      return handler.handle(parsedMessage, domain);
    } catch (error) {
      console.error(`Processing failed : ${error}`);
      throw error;
    }
  }
};

const getEventType = (parsedMessage) => {
  const eventType = parsedMessage?.event_type || null;
  return eventType;
};

const getDomain = (messageAttributes) => {
  const domain = messageAttributes.domain? messageAttributes.domain.Value : null;
  return domain;
};

export default handler;
