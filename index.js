import * as dotenv from "dotenv";
dotenv.config();

import { Client, Events, Partials } from "discord.js";
import { greet } from "./functions/greetings.js";
import { initialize, getBotNames, setBotPresence } from "./data/bot_data.js";
import { generateMessage } from "./functions/welcome_message.js";
import { handleImageSearch } from "./functions/image_search.js";
import { validateTimedMessage } from "./functions/timed_message.js";
import { deletePollByMsg, getPollsByMsg, syncPollVotes } from "./functions/polls.js";
import { checkForTimedActions, checkReaction } from "./data/checks.js";
import { handleVideoSearch } from "./functions/video_search.js";
import { handleCoinFlip } from "./functions/coinflip.js";
import { handleDiceRoll } from "./functions/diceroll.js";
import { deleteEventByMsg, getEventsByMsg, handleJoinEvent, validateEvent } from "./functions/events.js";

let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers",
        "DirectMessages", "GuildPresences", "GuildMessageReactions"],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

client.on("ready", async () => {
    await initialize(client);
    botNames = getBotNames();
    setBotPresence(client);
    await syncPollVotes(client);
    await checkForTimedActions(client);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error("No command matching" + interaction.commandName + "was found.");
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "timed-message-modal") {
            validateTimedMessage(interaction);
        }
        
        if (interaction.customId === "event-modal") {
            validateEvent(interaction);
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "event-button") {
            handleJoinEvent(interaction);
        }
    }
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    botNames.some(botName => msgToLowerCase.includes(botName)) ? greet(msg) : false;
    if (msgToLowerCase.startsWith("!")) {
        msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await handleImageSearch(msg) : false;
        msgToLowerCase.startsWith("!video") || msg.content.startsWith("!video") ? handleVideoSearch(msg) : false;
        msgToLowerCase.startsWith("!cf") ? handleCoinFlip(msg) : false;
        msgToLowerCase.startsWith("!roll") ? handleDiceRoll(msg) : false;
    }
});

client.on("messageDelete", async (msg) => {
    const wasPoll = await getPollsByMsg(msg);
    const wasEvent = await getEventsByMsg(msg);

    if (wasPoll) {
        deletePollByMsg(msg.id);
    }

    if (wasEvent) {
        deleteEventByMsg(msg.id);
    }
})

client.on("messageReactionAdd", async (reaction, user) => {
    let reactionData = reaction;
    let userData = user;
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch()
                .then(r => reactionData = r);
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch()
                .then(u => userData = u);
		} catch (error) {
			console.error('Something went wrong when fetching user:', error);
			return;
		}
    }

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    checkReaction(reactionData, userData);
});

client.on('messageReactionRemove', async (reaction, user) => {
    let reactionData = reaction;
    let userData = user;
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch()
                .then(r => reactionData = r);
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch()
                .then(u => userData = u);
		} catch (error) {
			console.error('Something went wrong when fetching user:', error);
			return;
		}
    }

    if (userData.id === client.user.id || !reactionData.message.author.bot) return;

    checkReaction(reactionData, userData);
});

client.on("guildMemberAdd", async (member) => {
    await generateMessage(member);
});

client.login(process.env.TOKEN);
