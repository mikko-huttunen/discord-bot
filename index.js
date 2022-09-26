import * as dotenv from "dotenv";
dotenv.config();

import { Client, PermissionsBitField } from "discord.js";
import { handleEvents } from "./functions/events.js";
import { greet } from "./functions/greetings.js";
import { initialize, getBotNames } from "./data/bot_data.js";
import { listCommands } from "./functions/list_commands.js";
import { handleRoleMessage } from "./functions/handle_roles.js";
import { generateMessage } from "./functions/welcome_message.js";
import { handleSearch } from "./functions/image_search.js";
import { checkForTimedMessages, handleTimedMessage } from "./functions/timed_message.js";

let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
});

client.on("ready", () => {
    initialize(client);
    botNames = getBotNames();
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
});

client.on("guildMemberAdd", async (member) => {
    await generateMessage(member);
});

client.login(process.env.TOKEN);
