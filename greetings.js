const botData = require("./botData");
const emotes = require("./emotes")

const greetingsFin = ["hei", "moi", "moro", "morjens", "morjensta", "terve", "tere"];
const greetingsEn = ["hi", "hello", "greetings", "yo", "hi there"];

const greet = (userName, msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    let message = "";

    if (
        msgToLowerCase ===
        greetingsFin.find((greeting) => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotName(msgToLowerCase)
    ) {
        message =
            greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
            " " +
            userName +
            emotes.getRandomCustomEmote(msg);
        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    } else if (
        msgToLowerCase ===
        greetingsEn.find((greeting) => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotName(msgToLowerCase)
    ) {
        message =
            greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
            " " +
            userName +
            emotes.getRandomCustomEmote(msg);
        msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
    }

    return;
};

module.exports = { greetingsFin, greetingsEn, greet };
