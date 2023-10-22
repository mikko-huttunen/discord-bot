import { canSendMessageToChannel } from "./helpers/checks.js";
import { getMemberData, getRandomCustomEmote } from "./helpers/helpers.js";

const greetingsFin = ["morjensta", "morjens", "moikka", "moro", "moi", "heippa", "hei", "terve", "tere"];
const greetingsEn = ["hi", "greetings", "hello", "hey", "yo"];

export const greet = async (client, msg) => {
    if (!await canSendMessageToChannel(msg.guild, msg.channel)) return;

    const msgToLowerCase = msg.content.toLowerCase();
    const msgGreeting = msgToLowerCase.split(" ")[0];
    const msgBotName = msgToLowerCase.split(" ")[1];

    if (!msgBotName) return;

    const guild = await client.guilds.cache.get(msg.guildId);
    const userData = await getMemberData(msg.author.id, guild);
    const user = userData.nickname ? userData.nickname : userData.user.username;
    
    if (greetingsFin.some(greet => greet === msgGreeting) && client.botNames.find(botName => botName === msgBotName)) {
        let message = `${greetingsFin[Math.floor(Math.random() * greetingsFin.length)]} ${user}! ${getRandomCustomEmote(msg)}`;
        //Capitalize first letter
        message = message.charAt(0).toUpperCase() + message.slice(1);

        msg.reply(message);
    }

    if (greetingsEn.some(greet => greet === msgGreeting) && client.botNames.find(botName => botName === msgBotName)) {
        let message = `${greetingsEn[Math.floor(Math.random() * greetingsEn.length)]} ${user}! ${getRandomCustomEmote(msg)}`;
        //Capitalize first letter
        message = message.charAt(0).toUpperCase() + message.slice(1);

        msg.reply(message);
    }
};