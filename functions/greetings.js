import { getBotNames } from "../data/bot_data.js";
import { getRandomCustomEmote } from "../data/emotes.js";

const greetingsFin = ["morjensta", "morjens", "moikka", "moro", "moi", "heippa", "hei", "terve", "tere", "päivää"];
const greetingsEn = ["hi", "greetings", "hello", "hey", "yo"];

export const greet = (msg) => {
    if (msg.author.bot) return;
    
    const msgToLowerCase = msg.content.toLowerCase();
    const msgGreeting = msgToLowerCase.split(" ")[0];
    const msgBotName = msgToLowerCase.split(" ")[1];
    const botNames = getBotNames();

    if (!msgBotName) return;
    
    if (greetingsFin.some(greet => greet === msgGreeting) && botNames.find(botName => botName === msgBotName)) {
        const message = greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
            " " +
            msg.author.username +
            "!" +
            getRandomCustomEmote(msg);

        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    }

    if (greetingsEn.some(greet => greet === msgGreeting) && botNames.find(botName => botName === msgBotName)) {
        const message = greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
            " " +
            msg.author.username +
            "!" +
            getRandomCustomEmote(msg);

        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    }
};