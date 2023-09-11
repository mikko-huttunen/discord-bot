import * as dotenv from "dotenv";
dotenv.config();

import { Client, Events, Partials } from "discord.js";
import { initializeBot } from "./bot/bot.js";
import { setBotPresence } from "./bot/presence.js";
import { syncPollVotes } from "./functions/polls.js";
import { checkForTimedActions, checkIfPollReaction } from "./functions/helpers/checks.js";
import { handleJoinEvent, validateEvent } from "./functions/events.js";
import { greet } from "./functions/greetings.js";
import { generateMessage } from "./functions/welcome_message.js";
import { setDatabase } from "./database/database.js";
import { CMD_ERR, EVENT_BUTTON, EVENT_MODAL, MSG_FETCH_ERR, NEVER, USER_FETCH_ERR } from "./variables/constants.js";
import { deleteDocument, deleteManyDocuments } from "./database/database_service.js";
import { poll } from "./database/schemas/poll_schema.js";
import { event } from "./database/schemas/event_schema.js";
import { getMemberData } from "./functions/helpers/helpers.js";
import { vote } from "./database/schemas/vote_schema.js";

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
    //Ignore bot messages
    if (msg.author.bot) return;

    const msgToLowerCase = msg.content.toLowerCase();

    client.botNames.some(botName => msgToLowerCase.includes(botName)) ? greet(client, msg) : false;
});

client.on("messageDelete", async (msg) => {
    //If message was poll or event, delete them from database
    const deletedPoll = await deleteDocument(poll, { msgId: msg.id, repeat: NEVER });
    if (deletedPoll) {
        await deleteManyDocuments(vote, { msgId: deletedPoll.msgId });
        return;
    }

    const deletedEvent = await deleteDocument(event, { msgId: msg.id, repeat: NEVER });
    //TODO: Delete event attendees
});

client.on("messageReactionAdd", async (reaction, user) => {
    //If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error(MSG_FETCH_ERR, error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch();
		} catch (error) {
			console.error(USER_FETCH_ERR, error);
			return;
		}
    }

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    user = await getMemberData(user.id, reaction.message.guild);
    checkIfPollReaction(reaction, user, "add");
});

client.on("messageReactionRemove", async (reaction, user) => {
    //If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error(MSG_FETCH_ERR, error);
			return;
		}
	}

    if (user.partial) {
        try {
            await user.fetch();
		} catch (error) {
			console.error(USER_FETCH_ERR, error);
			return;
		}
    }

    if (user.id === client.user.id || !reaction.message.author.bot) return;

    user = await getMemberData(user.id, reaction.message.guild);
    checkIfPollReaction(reaction, user, "remove");
});

client.on("guildMemberAdd", async (member) => {
    generateMessage(member);
});

client.login(process.env.TOKEN);
