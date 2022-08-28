require("dotenv").config();

let botNames = [];
let botGuild = null;
let botObject = null;
let botRole = null;

const getBotName = (msg) => {
    const botName = botNames.find((name) => msg.includes(name));
    return botName;
};

module.exports = { botNames, botGuild, botObject, botRole, getBotName };
