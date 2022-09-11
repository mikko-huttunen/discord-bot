const botData = require("../data/bot_data");
const emotes = require("../data/emotes")

const greetingsFin = ["morjensta", "morjens", "moikka", "moro", "moi", "heippa", "hei", "terve", "tere", "päivää"];
const greetingsEn = ["hi there", "hi", "greetings", "hello", "hey", "yo"];

const greet = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    let message = "";

    switch(msgToLowerCase) {
        case botData.getBotNames(msgToLowerCase) +
            " " +
            greetingsFin.find(greeting => greeting === msgToLowerCase.split(" ")[1]):
        case greetingsFin.find(greeting => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotNames(msgToLowerCase):
                message = greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
                " " +
                msg.author.username +
                "!" +
                emotes.getRandomCustomEmote(msg);
                msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
                break;

        case botData.getBotNames(msgToLowerCase) +
            " " +
            greetingsEn.find(greeting => greeting === msgToLowerCase.split(" ")[1]):
        case greetingsEn.find(greeting => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotNames(msgToLowerCase):
                message = greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
                " " +
                msg.author.username +
                "!" +
                emotes.getRandomCustomEmote(msg);
                msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
                break;

        default:
            break;
    }
};

module.exports = { greetingsFin, greetingsEn, greet };
