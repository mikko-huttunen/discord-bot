const botData = require("./botData");
const emotes = require("./emotes")

const greetingsFin = ["morjensta", "morjens", "moikka", "moro", "moi", "heippa", "hei", "terve", "tere"];
const greetingsEn = ["hi", "hello", "greetings", "yo", "hi there"];

const greet = (userName, msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    let message = "";

    switch(msgToLowerCase) {
        
        case botData.getBotName(msgToLowerCase) +
            " " +
            greetingsFin.find(greeting => greeting === msgToLowerCase.split(" ")[1]):
        case greetingsFin.find(greeting => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotName(msgToLowerCase):
                message = greetingsFin[Math.floor(Math.random() * greetingsFin.length)] +
                " " +
                userName +
                "!" +
                emotes.getRandomCustomEmote(msg);
                msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
                break;

        case botData.getBotName(msgToLowerCase) +
            " " +
            greetingsEn.find(greeting => greeting === msgToLowerCase.split(" ")[1]):
        case greetingsEn.find(greeting => msgToLowerCase.startsWith(greeting)) +
            " " +
            botData.getBotName(msgToLowerCase):
                message = greetingsEn[Math.floor(Math.random() * greetingsEn.length)] +
                " " +
                userName +
                "!" +
                emotes.getRandomCustomEmote(msg);
                msg.reply(message.charAt(0).toUpperCase() + message.slice(1));
                break;
    }
};

module.exports = { greetingsFin, greetingsEn, greet };
