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
import { handleTimedMessage } from "./functions/timed_message.js";
import { deletePollByMsg, getPollsByMsg, handlePoll, syncPollVotesOnStartUp } from "./functions/polls.js";
import { addReaction, checkForTimedActions, checkReactions, reactions, removedReactions, removeReaction } from "./data/checks.js";

let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences", "GuildMessageReactions"],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on("ready", async () => {
    await initialize(client);
    botNames = getBotNames();
    setBotPresence(client);
    await syncPollVotesOnStartUp(client);
    await checkForTimedActions(client);
    await checkReactions();
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    botNames.some(botName => msgToLowerCase.includes(botName)) ? greet(msg) : false;
    if (msgToLowerCase.startsWith("!")) {
        msgToLowerCase.startsWith("!help") || msg.content.startsWith("!commands") ? listCommands(msg) : false;
        msgToLowerCase.startsWith("!role") ? handleRoleMessage(msg) : false;
        msgToLowerCase.startsWith("!weekly") ? handleEvents(msg) : false;
        msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await handleSearch(msg) : false;
        msgToLowerCase.startsWith("!timed") ? handleTimedMessage(msg, client) : false;
        msgToLowerCase.startsWith("!poll") ? handlePoll(msg, client) : false;
    }
});

client.on("messageDelete", async (msg) => {
    const wasPoll = await getPollsByMsg(msg);

    if (wasPoll.length) {
        deletePollByMsg(msg.id);
    }
})

client.on("messageReactionAdd", async (reaction, user) => {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    reactions.push({user, reaction});
    addReaction(reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    removedReactions.push({user, reaction});
    removeReaction(reaction, user);
});

client.on("guildMemberAdd", async (member) => {
    await generateMessage(member);
});

client.login(process.env.TOKEN);
