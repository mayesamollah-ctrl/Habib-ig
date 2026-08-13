module.exports = {
	config: {
		name: "tagall",
		aliases: ["tagall", "gt"],
		version: "1.0",
		author: "〲MAMUNツ࿐",
		countDown: 5,
		role: 0,
		shortDescription: "Tag all members",
		longDescription: "Mention every member in the current thread",
		category: "𝗚𝗥𝗢𝗨𝗣",
		guide: "{pn} <message>\n{pn} — tags everyone with a default message if no text given"
	},

	run: async function ({ message, args, api, event, threadsData }) {
		const threadID = event.threadID;

		// Fetch thread info — adjust method name per your fca lib's docs
		const threadInfo = await api.getThreadInfo(threadID);
		const members = threadInfo.userInfo || threadInfo.participantIDs || [];

		if (!members.length) {
			return message.reply("Couldn't find any members to tag in this thread.");
		}

		const customText = args.join(" ") || "Attention everyone!";

		let body = customText + "\n\n";
		const mentions = [];
		let offset = body.length;

		for (const member of members) {
			const id = member.id || member;
			const name = member.name || "Member";
			const tagText = `@${name} `;

			mentions.push({
				tag: tagText.trim(),
				id: id,
				fromIndex: offset
			});

			body += tagText;
			offset = body.length;
		}

		try {
			await api.sendMessage({ body, mentions }, threadID);
		} catch (err) {
			// fallback if mentions aren't supported the same way
			await message.reply(body);
		}
	}
};
