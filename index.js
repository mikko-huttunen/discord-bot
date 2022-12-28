import * as dotenv from "dotenv";
dotenv.config();

import { Client, Partials } from "discord.js";
import { handleEvents } from "./functions/events.js";
import { greet } from "./functions/greetings.js";
import { initialize, getBotNames, setBotPresence } from "./data/bot_data.js";
import { listCommands } from "./functions/list_commands.js";
import { handleRoleMessage } from "./functions/handle_roles.js";
import { generateMessage } from "./functions/welcome_message.js";
import { handleSearch } from "./functions/image_search.js";
import { checkForTimedMessages, handleTimedMessage } from "./functions/timed_message.js";
import { handlePoll } from "./functions/polls.js";

let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences", "GuildMessageReactions"],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on("ready", () => {
    initialize(client);
    botNames = getBotNames();
    setBotPresence(client);
    checkForTimedMessages(client);
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    botNames.some(botName => msgToLowerCase.includes(botName)) ? greet(msg) : false;
    msgToLowerCase.startsWith("!help") || msg.content.startsWith("!commands") ? listCommands(msg) : false;
    msgToLowerCase.startsWith("!role") ? handleRoleMessage(msg) : false;
    msgToLowerCase.startsWith("!weekly") ? handleEvents(msg) : false;
    msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await handleSearch(msg) : false;
    msgToLowerCase.startsWith("!timed") ? handleTimedMessage(msg, client) : false;
    msgToLowerCase.startsWith("!poll") ? handlePoll(msg, client) : false;
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.id === client.user.id) return;
    console.log(reaction);
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();

            // await poll.updateOne(
            //     { pollId },
            //     { $set: { msgId: pollMsg.id }}
            // ).then(response => {
            //     if (response) {
            //         console.log("Poll msgId added" + response);
            //     }
            // }).catch(err => {
            //     console.log(err);
            //     msg.reply("Sori nyt ei pysty...");
            // });
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	// Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	// The reaction is now also fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
});

client.on("guildMemberAdd", async (member) => {
    await generateMessage(member);
});

client.login(process.env.TOKEN);
