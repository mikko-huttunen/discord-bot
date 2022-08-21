let botNames = [];

const getBotName = (msg) => {
    const botName = botNames.find((name) => msg.includes(name));
    return botName;
};

module.exports = { botNames, getBotName };
