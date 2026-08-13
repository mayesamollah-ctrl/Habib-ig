const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "file",
		aliases: ["files"],
		version: "1.0",
		author: "♡┋Habibᥫ᭡",
		countDown: 5,
		role: 0,
		shortDescription: "Send bot script",
		longDescription: "Send bot specified file",
		category: "𝗢𝗪𝗡𝗘𝗥",
		guide: "{pn} file name. Ex: {pn} filename"
	},

	run: async function ({ message, args, api, event }) {
		// devUsers from config.json act as the owner/permission list
		const permission = ["80054943614"]; // replace with your devUsers/adminBot IDs

		if (!permission.includes(event.senderID)) {
			return message.reply("You don't have permission to use this command.");
		}

		const fileName = args[0];
		if (!fileName) {
			return message.reply("Please provide a file name.");
		}

		// Prevent path traversal (../../something.js)
		const safeName = path.basename(fileName);
		const filePath = path.join(__dirname, `${safeName}.js`);

		if (!fs.existsSync(filePath)) {
			return message.reply(`File not found: ${safeName}.js`);
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');

		// Most nkx-fca / IG fca forks expose a message.reply or api.sendMessage
		// with (threadID, content) or (content, threadID) — verify against your lib.
		try {
			await message.reply(fileContent);
		} catch (err) {
			// Fallback if message.reply doesn't exist in this fork
			await api.sendMessage(event.threadID, { body: fileContent });
		}
	}
};
