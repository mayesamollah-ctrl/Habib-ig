const axios = require("axios");
const simsim = "https://simsimi-api-tjb1.onrender.com";

module.exports = {
  config: {
    name: "baby",
    aliases: ["hippi", "bot", "bby", "Baby", "Bot", "BBY"],
    version: "2.0.1",
    author: "rX |moded by Sk Habibulla",
    countDown: 0,
    role: 0,
    shortDescription: "Cute AI Baby Chatbot (Auto Teach + Reply)",
    longDescription: "Talk & Chat with Emotion — Auto teach enabled.",
    category: "box chat",
    guide: {
      en: "{pn} [message]\n{pn} teach [Question] - [Answer]\n{pn} list"
    }
  },

  // ─────────────── MAIN COMMAND ───────────────
  onStart: async function ({ api, event, args, message, usersData }) {
    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID) || "Baby";
    const query = args.join(" ").trim().toLowerCase();
    const threadID = event.threadID;
    const messageID = event.messageID;

    try {
      if (!query) {
        const ran = ["Bolo baby 💖", "Hea baby 😚"];
        const r = ran[Math.floor(Math.random() * ran.length)];
        return message.reply(r, (err, info) => {
          if (!err && info?.messageID) {
            global.ST.onReply.set(info.messageID, {
              commandName: "baby",
              author: senderID
            });
          }
        });
      }

      // ─── Teach command ───
      if (args[0] === "teach") {
        const parts = query.replace("teach ", "").split(" - ");
        if (parts.length < 2)
          return message.reply("Use: baby teach [Question] - [Reply]");
        
        const [ask, ans] = parts;
        const res = await axios.get(
          `\( {simsim}/teach?ask= \){encodeURIComponent(ask)}&ans=\( {encodeURIComponent(ans)}&senderName= \){encodeURIComponent(senderName)}`
        );
        return message.reply(res.data.message || "Learned successfully!");
      }

      // ─── List command ───
      if (args[0] === "list") {
        const res = await axios.get(`${simsim}/list`);
        if (res.data.code === 200)
          return message.reply(
            `♾ Total Questions: ${res.data.totalQuestions}\n★ Replies: ${res.data.totalReplies}\n👑 Author: ${res.data.author}`
          );
        else
          return message.reply(`Error: ${res.data.message || "Failed to fetch list"}`);
      }

      // ─── Normal chat ───
      const res = await axios.get(
        `\( {simsim}/simsimi?text= \){encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`
      );
      
      const responses = Array.isArray(res.data.response)
        ? res.data.response
        : [res.data.response];

      if (!responses || responses.length === 0 || !responses[0]) {
        console.log(`🤖 Auto-teaching new phrase: "${query}"`);
        await axios.get(
          `\( {simsim}/teach?ask= \){encodeURIComponent(query)}&ans=\( {encodeURIComponent("hmm baby 😚 (auto learned)")}&senderName= \){encodeURIComponent(senderName)}`
        );
        return message.reply("hmm baby 😚");
      }

      for (const reply of responses) {
        await new Promise((resolve) => {
          message.reply(reply, (err, info) => {
            if (!err && info?.messageID) {
              global.ST.onReply.set(info.messageID, {
                commandName: "baby",
                author: senderID
              });
            }
            resolve();
          });
        });
      }

    } catch (err) {
      console.error("❌ Baby main error:", err);
      message.reply(`Error in baby command: ${err.message}`);
    }
  },

  // ─────────────── HANDLE REPLY ───────────────
  onReply: async function ({ api, event, Reply, message, usersData }) {
    const senderName = await usersData.getName(event.senderID) || "Baby";
    const replyText = event.body ? event.body.trim().toLowerCase() : "";

    try {
      if (!replyText) return;

      const res = await axios.get(
        `\( {simsim}/simsimi?text= \){encodeURIComponent(replyText)}&senderName=${encodeURIComponent(senderName)}`
      );
      
      const responses = Array.isArray(res.data.response)
        ? res.data.response
        : [res.data.response];

      // যদি SimSimi কিছু না পায়, auto-teach করে
      if (!responses || responses.length === 0 || !responses[0]) {
        console.log(`🧠 Auto-teaching new reply: "${replyText}"`);
        await axios.get(
          `\( {simsim}/teach?ask= \){encodeURIComponent(replyText)}&ans=\( {encodeURIComponent("hmm baby 😚 (auto learned)")}&senderName= \){encodeURIComponent(senderName)}`
        );
        return message.reply("hmm baby 😚");
      }

      for (const reply of responses) {
        await new Promise((resolve) => {
          message.reply(reply, (err, info) => {
            if (!err && info?.messageID) {
              global.ST.onReply.set(info.messageID, {
                commandName: "baby",
                author: event.senderID
              });
            }
            resolve();
          });
        });
      }

    } catch (err) {
      console.error("❌ Baby reply error:", err);
      message.reply(`Error in baby reply: ${err.message}`);
    }
  }
};
