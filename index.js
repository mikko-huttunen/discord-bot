import * as dotenv from "dotenv";
dotenv.config();

import { Client } from "discord.js";
import { handleEvents } from "./functions/events.js";
import { greet } from "./functions/greetings.js";
import { initialize, getBotNames, setBotPresence } from "./data/bot_data.js";
import { listCommands } from "./functions/list_commands.js";
import { handleRoleMessage } from "./functions/handle_roles.js";
import { generateMessage } from "./functions/welcome_message.js";
import { handleSearch } from "./functions/image_search.js";
import { checkForTimedMessages, handleTimedMessage } from "./functions/timed_message.js";
import { handleCoinFlip } from "./functions/coinflip.js";
import { handleDiceRoll } from "./functions/diceroll.js";

let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
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
    msgToLowerCase.startsWith("!help") || msgToLowerCase.startsWith("!commands") ? listCommands(msg) : false;
    msgToLowerCase.startsWith("!role") ? handleRoleMessage(msg) : false;
    msgToLowerCase.startsWith("!weekly") ? handleEvents(msg) : false;
    msgToLowerCase.startsWith("!image") || msgToLowerCase.startsWith("!kuva") ? await handleSearch(msg) : false;
    msgToLowerCase.startsWith("!timed") ? handleTimedMessage(msg, client) : false;
    msgToLowerCase.startsWith("!coinflip") || msgToLowerCase.startsWith("!cf") ? handleCoinFlip(msg) : false;
    msgToLowerCase.startsWith("!roll") ? handleDiceRoll(msg) : false;
});

client.on("guildMemberAdd", async (member) => {
    await generateMessage(member);
});

client.login(process.env.TOKEN);
