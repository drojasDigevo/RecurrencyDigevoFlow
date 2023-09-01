const { ServiceBusClient } = require("@azure/service-bus");

function createBusSender() {
    const sbClient = new ServiceBusClient(process.env.BUS_CONNECTION_STRING)
    const sender = sbClient.createSender(process.env.BUS_QUEUE_NAME)
    return { sbClient, sender }
}

exports.scheduleMessage = async function(serviceBusMessage, scheduledEnqueueTimeUtc) {
    console.log("[BUS] SendMessage", scheduledEnqueueTimeUtc, serviceBusMessage)
    const { sbClient, sender } = createBusSender()
    try {
        const scheduledMessage = await sender.scheduleMessages(serviceBusMessage, scheduledEnqueueTimeUtc)
        return scheduledMessage[0]
    } catch (error) {
        console.error("[BUS]", error);
    } finally {
        await sender.close()
        await sbClient.close()
    }
}

exports.cancelScheduledMessage = async function(sequenceNumber) {
    console.log("[BUS] CancelScheduledMessage", sequenceNumber)
    const { sbClient, sender } = createBusSender()
    try {
        await sender.cancelScheduledMessages(sequenceNumber)
    } catch (error) {
        console.error("[BUS]", error);
    } finally {
        await sender.close()
        await sbClient.close()
    }
}

exports.sendBatchOfMessages = async function(serviceBusMessages) {
    console.log("[BUS] SendBatchOfMessages", serviceBusMessages.length)
    const { sbClient, sender } = createBusSender()
    try {
        let batch = await sender.createMessageBatch();
        for (let i = 0; i < serviceBusMessages.length; i++) {
            if (!batch.tryAddMessage(serviceBusMessages[i])) {
                await sender.sendMessages(batch);
                batch = await sender.createMessageBatch();
                if (!batch.tryAddMessage(serviceBusMessages[i])) {
                    throw new Error("Message too big to fit in a batch");
                }
            }
        }
        await sender.sendMessages(batch);
    } catch (error) {
        console.error("[BUS]", error);
    } finally {
        await sender.close()
        await sbClient.close()
    }
}