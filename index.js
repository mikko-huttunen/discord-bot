import * as dotenv from "dotenv";
dotenv.config();

import { Client, Events, Partials } from "discord.js";
import { bot, initializeBot } from "./bot/bot.js";
import { setBotPresence } from "./bot/presence.js";
import { syncPollVotes } from "./functions/polls/polls.js";
import { checkForTimedActions, checkReaction } from "./functions/helpers/checks.js";
import { validateTimedMessage } from "./functions/timed_messages/timed_message.js";
import { handleJoinEvent, validateEvent } from "./functions/events/events.js";
import { greet } from "./functions/misc/greetings.js";
import { handleImageSearch } from "./functions/media/image_search.js";
import { handleVideoSearch } from "./functions/media/video_search.js";
import { handleCoinFlip } from "./functions/games/coinflip.js";
import { handleDiceRoll } from "./functions/games/diceroll.js";
import { deletePollByMsg, getPollByMsg } from "./functions/polls/data/services/poll_service.js";
import { deleteEventByMsg, getEventByMsg } from "./functions/events/data/services/event_service.js";
import { generateMessage } from "./functions/misc/welcome_message.js";
import { setDatabase } from "./bot/database.js";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers",
        "DirectMessages", "GuildPresences", "GuildMessageReactions"],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

client.on("ready", async () => {
    await initializeBot(client);
    await setDatabase();
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

    bot.names.some(botName => msgToLowerCase.includes(botName)) ? greet(msg) : false;
    if (msgToLowerCase.startsWith("!")) {
        msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await handleImageSearch(msg) : false;
        msgToLowerCase.startsWith("!video") || msg.content.startsWith("!video") ? handleVideoSearch(msg) : false;
        msgToLowerCase.startsWith("!cf") ? handleCoinFlip(msg) : false;
        msgToLowerCase.startsWith("!roll") ? handleDiceRoll(msg) : false;
    }
});

client.on("messageDelete", async (msg) => {
    const wasPoll = await getPollByMsg(msg);
    const wasEvent = await getEventByMsg(msg);

    if (wasPoll) {
        deletePollByMsg(msg.id);
    }

    if (wasEvent) {
        deleteEventByMsg(msg.id).then(response => {
            console.log("Event deleted:");
            console.log(response);
        }).catch(err => {
            console.error(err);
        });
    }
});

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
