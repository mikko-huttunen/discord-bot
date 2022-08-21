const botData = require("./botData");
const emotes = require("./emotes")

const greetingsFin = ["hei", "moi", "moro", "morjens", "morjensta", "terve", "tere"];
const greetingsEn = ["hi", "hello", "greetings", "yo", "hi there"];

const greetCheck = (userName, msgData, msgToLowerCase) => {
    let greeting = "";

    if (msgToLowerCase === greetingsFin.find((greeting) => msgToLowerCase.startsWith(greeting)) + " " + botData.getBotName(msgToLowerCase)) {
        greeting = greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
            " " +
            userName +
            emotes.getRandomCustomEmote(msgData);
    } else if (msgToLowerCase === greetingsEn.find((greeting) => msgToLowerCase.startsWith(greeting)) + " " + botData.getBotName(msgToLowerCase)) {
        greeting = greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
            " " +
            userName +
            emotes.getRandomCustomEmote(msgData);
    }

    return greeting.charAt(0).toUpperCase() + greeting.slice(1);
};

module.exports = { greetingsFin, greetingsEn, greetCheck };
