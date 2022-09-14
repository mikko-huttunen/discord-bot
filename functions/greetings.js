const botData = require("../data/bot_data");
const emotes = require("../data/emotes")

const greetingsFin = ["morjensta", "morjens", "moikka", "moro", "moi", "heippa", "hei", "terve", "tere", "päivää"];
const greetingsEn = ["hi", "greetings", "hello", "hey", "yo"];

const greet = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const msgGreeting = msgToLowerCase.split(" ")[0];
    const msgBotName = msgToLowerCase.split(" ")[1];
    const botNames = botData.getBotNames();

    if (!msgBotName) return;
    
    if (msgToLowerCase === greetingsFin.find(greet => greet === msgGreeting) + " " + botNames.find(botName => botName === msgBotName)) {
        const message = greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
            " " +
            msg.author.username +
            "!" +
            emotes.getRandomCustomEmote(msg);

        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    }

    if (msgToLowerCase === greetingsEn.find(greet => greet === msgGreeting) + " " + botNames.find(botName => botName === msgBotName)) {
        const message = greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
            " " +
            msg.author.username +
            "!" +
            emotes.getRandomCustomEmote(msg);

        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    }
};

module.exports = { greet };
