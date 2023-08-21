import * as dotenv from "dotenv";
dotenv.config();

import { Client, Events, Partials } from "discord.js";
import { initializeBot } from "./bot/bot.js";
import { setBotPresence } from "./bot/presence.js";
import { syncPollVotes } from "./functions/polls/polls.js";
import { canSendMessageToChannel, checkForTimedActions, checkReaction } from "./functions/helpers/checks.js";
import { validateTimedMessage } from "./functions/timed_messages/timed_message.js";
import { handleJoinEvent, validateEvent } from "./functions/events/events.js";
import { greet } from "./functions/misc/greetings.js";
import { generateMessage } from "./functions/misc/welcome_message.js";
import { setDatabase } from "./bot/database.js";
import { deletePollByMsg, getPollByMsg } from "./functions/polls/services/poll_service.js";
import { deleteEventByMsg, getEventByMsg } from "./functions/events/services/event_service.js";
import { CMD_ERR, EVENT_BUTTON, EVENT_MODAL, MSG_FETCH_ERR, TIMED_MESSAGE_MODAL, USER_FETCH_ERR } from "./variables/constants.js";
import { getMemberData } from "./functions/helpers/helpers.js";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers",
        "DirectMessages", "GuildPresences", "GuildMessageReactions"],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

client.on("ready", async () => {
    await setDatabase();
    await initializeBot(client);
    await setBotPresence(client);
    await syncPollVotes(client);
    await checkForTimedActions(client);
    console.log(client);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error("No command matching " + interaction.commandName + " was found.");
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: CMD_ERR, ephemeral: true });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === TIMED_MESSAGE_MODAL) {
            validateTimedMessage(interaction);
        }
        
        if (interaction.customId === EVENT_MODAL) {
            validateEvent(interaction);
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === EVENT_BUTTON) {
            handleJoinEvent(interaction);
        }
    }
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const msgToLowerCase = msg.content.toLowerCase();

    if (!await canSendMessageToChannel(msg.guild, msg.channel)) return;
    client.botNames.some(botName => msgToLowerCase.includes(botName)) ? greet(client, msg) : false;
});

client.on("messageDelete", async (msg) => {
    const wasPoll = await getPollByMsg(msg);
    const wasEvent = await getEventByMsg(msg);

    if (wasPoll) {
        deletePollByMsg(msg.id);
    }

    if (wasEvent) {
        deleteEventByMsg(msg.id);
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
			console.error(MSG_FETCH_ERR, error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch()
                .then(u => userData = u);
		} catch (error) {
			console.error(USER_FETCH_ERR, error);
			return;
		}
    }

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    userData = await getMemberData(userData.id, reactionData.message.guild);
    checkReaction(reactionData, userData);
});

client.on("messageReactionRemove", async (reaction, user) => {
    let reactionData = reaction;
    let userData = user;

    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch()
                .then(r => reactionData = r);
		} catch (error) {
			console.error(MSG_FETCH_ERR, error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch()
                .then(u => userData = u);
		} catch (error) {
			console.error(USER_FETCH_ERR, error);
			return;
		}
    }

    if (userData.id === client.user.id || !reactionData.message.author.bot) return;

    userData = await getMemberData(userData.id, reactionData.message.guild);
    checkReaction(reactionData, userData);
});

client.on("guildMemberAdd", async (member) => {
    generateMessage(member);
});

client.login(process.env.TOKEN);
