const axios = require("axios");

let simsim = "";

// Note : THIS CODE MADE BY SK HABIBULLA (GIVE CREDIT OTHERWISE EVERYONE FUCK YOU AT 300 KM SPEED)

const typing = async (api, threadID, ms = 3000) => {
	try {
		if (typeof api.sendTypingIndicator === "function") {
			await api.sendTypingIndicator(threadID, true);
			await new Promise(resolve => setTimeout(resolve, ms));
			await api.sendTypingIndicator(threadID, false);
		}
	} catch {}
};

function withTimeout(promise, ms, label) {
	return Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
		)
	]);
}

function sendMessageAsync(api, text, threadID, replyToID) {
	return new Promise((resolve, reject) => {
		const cb = (err, info) => (err ? reject(err) : resolve(info));
		if (replyToID) {
			api.sendMessage(text, threadID, cb, replyToID);
		} else {
			api.sendMessage(text, threadID, cb);
		}
	});
}

async function deliverSimsimiResponse({ api, event, query, senderName }) {
	const url = `\( {simsim}/simsimi?text= \){encodeURIComponent(query)}&senderName=\( {encodeURIComponent(senderName)}&threadID= \){encodeURIComponent(event.threadID)}&senderID=${encodeURIComponent(event.senderID)}`;

	try {
		if (typeof api.sendTypingIndicator === "function") await api.sendTypingIndicator(event.threadID, true);
	} catch {}

	let res;
	try {
		res = await axios.get(url);
	} finally {
		try {
			if (typeof api.sendTypingIndicator === "function") await api.sendTypingIndicator(event.threadID, false);
		} catch {}
	}

	const data = res.data || {};
	if (data.rateLimited) return;

	if (data.reaction && event.messageID) {
		withTimeout(
			api.setMessageReaction(data.reaction, event.messageID, () => {}, true),
			3000,
			"setMessageReaction"
		).catch(e => console.log("⚠️ Reaction send error:", e.message));
	}

	if (data.response) {
		try {
			await sendMessageAsync(api, data.response, event.threadID, event.messageID);
		} catch (e) {
			console.log("❌ sendMessage error:", JSON.stringify(e));
			try {
				await sendMessageAsync(api, data.response, event.threadID);
			} catch (e2) {
				console.log("❌ sendMessage failed after retry:", JSON.stringify(e2));
			}
		}
	}
}

module.exports = {
	config: {
		name: "baby",
		aliases: ["maria", "hippi"],
		version: "1.3.2",
		author: "rX UPDATED BY SK HABIBULLA",
		countDown: 0,
		role: 0,
		shortDescription: "AI auto teach chat",
		longDescription: "AI auto teach with Teach & List support + Typing effect",
		category: "chat",
		guide: "{pn}[query]\n{pn}list\n{pn}teach [Question] - [Reply]\n{pn}react [Question] - [Emoji]\n{pn}edit [Question] - [OldReply] - [NewReply]\n{pn}remove/rm [Question] - [Reply]\n{pn}msg [trigger]\n{pn}autoteach on/off"
	},

	async run({ api, event, args, usersData }) {
		// API load (onLoad er bodole)
		if (!simsim) {
			try {
				const res = await axios.get("https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json");
				if (res.data && res.data.mari) simsim = res.data.mari;
			} catch {}
		}

		if (!simsim) return api.sendMessage("❌ API not loaded yet.", event.threadID, event.messageID);

		const uid = event.senderID;
		const senderName = await usersData.getName(uid);
		const query = args.join(" ").toLowerCase();

		try {
			// ==========================
			//  autoteach on/off
			// ==========================
			if (args[0] === "autoteach") {
				const mode = args[1];
				if (!["on", "off"].includes(mode))
					return api.sendMessage("✅ Use: baby autoteach on/off", event.threadID, event.messageID);

				const status = mode === "on";
				const res = await axios.post(`${simsim}/setting`, { autoTeach: status, threadID: event.threadID });
				return api.sendMessage(`✅ ${res.data.message} (this thread only)`, event.threadID, event.messageID);
			}

			// ==========================
			//  list
			// ==========================
			if (args[0] === "list") {
				const res = await axios.get(`${simsim}/list`);
				return api.sendMessage(
					`╭─╼🌟 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬\n├ 📝 𝐓𝐞𝐚𝐜𝐡𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: ${res.data.totalQuestions}\n├ 📦 𝐒𝐭𝐨𝐫𝐞𝐝 𝐑𝐞𝐩𝐥𝐢𝐞𝐬: ${res.data.totalReplies}\n╰─╼👤 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐫𝐗 𝐀𝐛𝐝𝐮𝐥𝐥𝐚𝐡`,
					event.threadID,
					event.messageID
				);
			}

			// ==========================
			//  msg
			// ==========================
			if (args[0] === "msg") {
				let trigger = args.slice(1).join(" ").trim();
				if (!trigger) return api.sendMessage("❌ | Use: baby msg [trigger]", event.threadID, event.messageID);

				const res = await axios.get(`\( {simsim}/simsimi-list?ask= \){encodeURIComponent(trigger)}`);
				if (!res.data.replies || res.data.replies.length === 0)
					return api.sendMessage("❌ No replies found.", event.threadID, event.messageID);

				const formatted = res.data.replies.map((rep, i) => `➤ ${i + 1}. ${rep}`).join("\n");
				return api.sendMessage(
					`📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}\n📋 𝗧𝗼𝘁𝗮𝗹: \( {res.data.total}\n━━━━━━━━━━━━━━\n \){formatted}`,
					event.threadID,
					event.messageID
				);
			}

			// ==========================
			//  teach
			// ==========================
			if (args[0] === "teach") {
				const parts = query.replace("teach ", "").split(" - ");
				if (parts.length < 2)
					return api.sendMessage("❌ | Use: teach [Question] - [Reply]", event.threadID, event.messageID);

				const [ask, ans] = parts;
				const res = await axios.get(`\( {simsim}/teach?ask= \){encodeURIComponent(ask)}&ans=\( {encodeURIComponent(ans)}&senderID= \){uid}&senderName=${encodeURIComponent(senderName)}`);
				return api.sendMessage(`✅ ${res.data.message}`, event.threadID, event.messageID);
			}

			// ==========================
			//  react
			// ==========================
			if (args[0] === "react") {
				const rawQuery = args.slice(1).join(" ");
				const parts = rawQuery.split(" - ");
				if (parts.length < 2)
					return api.sendMessage("❌ | Use: react [Question] - [Emoji]", event.threadID, event.messageID);

				const [ask, emoji] = parts;
				if (!ask.trim() || !emoji.trim())
					return api.sendMessage("❌ | Use: react [Question] - [Emoji]", event.threadID, event.messageID);

				const res = await axios.get(`\( {simsim}/teachReact?ask= \){encodeURIComponent(ask)}&emoji=\( {encodeURIComponent(emoji)}&senderName= \){encodeURIComponent(senderName)}`);
				return api.sendMessage(`✅ ${res.data.message}`, event.threadID, event.messageID);
			}

			// ==========================
			//  edit
			// ==========================
			if (args[0] === "edit") {
				const parts = query.replace("edit ", "").split(" - ");
				if (parts.length < 3)
					return api.sendMessage("❌ | Use: edit [Question] - [OldReply] - [NewReply]", event.threadID, event.messageID);

				const [ask, oldR, newR] = parts;
				const res = await axios.get(`\( {simsim}/edit?ask= \){encodeURIComponent(ask)}&old=\( {encodeURIComponent(oldR)}&new= \){encodeURIComponent(newR)}`);
				return api.sendMessage(res.data.message, event.threadID, event.messageID);
			}

			// ==========================
			//  remove / rm
			// ==========================
			if (["remove", "rm"].includes(args[0])) {
				const parts = query.replace(/^(remove|rm)\s*/, "").split(" - ");
				if (parts.length < 2)
					return api.sendMessage("❌ | Use: remove [Question] - [Reply]", event.threadID, event.messageID);

				const [ask, ans] = parts;
				const res = await axios.get(`\( {simsim}/delete?ask= \){encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
				return api.sendMessage(res.data.message, event.threadID, event.messageID);
			}

			// ==========================
			//  empty command
			// ==========================
			if (!query) {
				const texts = ["Hey baby 💖", "Yes, I'm here 😘"];
				const reply = texts[Math.floor(Math.random() * texts.length)];
				return api.sendMessage(reply, event.threadID, event.messageID);
			}

			// ==========================
			//  normal chat
			// ==========================
			return await deliverSimsimiResponse({ api, event, query, senderName });

		} catch (e) {
			return api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
		}
	}
};
