module.exports = {
  config: {
    name: "unsend",
    aliases: ["r", "delete"],
    version: "1.0",
    author: "ST | Moded by Sk Habibulla 💝",
    countDown: 2,
    role: 0,
    shortDescription: "Unsend bot messages",
    longDescription: "Reply to a bot message and use this command to unsend it",
    category: "utility",
    guide: {
      en: "{pn} - Reply to a bot message to unsend it"
    }
  },

  run: async function ({ message, event, api }) {
    try {
      if (!event.messageReply) {
        return message.reply('Please reply to a bot message that you want to unsend.');
      }

      const botUserId = global.ST.client?.state?.cookieUserId;
      const repliedSenderID = event.messageReply.senderID;
      
      if (repliedSenderID !== botUserId && String(repliedSenderID) !== String(botUserId)) {
        return message.reply('I can only unsend my own messages. Please reply to one of my messages.');
      }

      const messageIdToUnsend = event.messageReply.messageID;
      
      if (!messageIdToUnsend) {
        return message.reply('Could not find the message ID to unsend.');
      }

      await message.unsend(messageIdToUnsend);
      
    } catch (e) {
      console.error('Unsend error:', e.message);
      return message.reply(`Could not unsend message: ${e.message}`);
    }
  }
};
