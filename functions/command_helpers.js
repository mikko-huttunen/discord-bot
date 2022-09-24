const handleCommands = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    switch(msgToLowerCase) {
        case "!help":
        case "!commands":
            commands(msg);
            break;

        case "!help role":
        case "!commands role":
            roleCommands(msg);
            break;

        case "!help weekly":
        case "!commands weekly":
            eventCommands(msg);
            break;

        default:
            break;
    }
}

const commands = (msg) => {
    const commandEmbed = {
        color: 0xFFEA00,
        title: "Komennot",
        fields: [
            {
                name: "!commands role",
                value: "Rooli komennot",
            }, {
                name: "!commands weekly",
                value: "Weekly komennot",
            }, {
                name: "!image <keyword> | !kuva <hakusana>",
                value: "Satunnainen kuva annetulla hakusanalla",
            }
        ],
    };

    msg.channel.send({ embeds: [commandEmbed] });
};

const roleCommands = (msg) => {
    const roleEmbed = {
        color: 0xff0000,
        title: "Rooli komennot",
        fields: [
            {
                name: "!role me",
                value: "Näytä omat roolisi",
            }, {
                name: "!role list",
                value: "Näytä lista rooleista",
            }, {
                name: "!role + <roolin nimi>",
                value: "Lisää rooli itsellesi",
            }, {
                name: "!role - <roolin nimi>",
                value: "Poista rooli itseltäsi",
            }
        ],
    };

    msg.channel.send({ embeds: [roleEmbed] });
};

const eventCommands = (msg) => {
    const eventEmbed = {
        color: 0xBF40BF,
        title: "Weekly komennot",
        fields: [
            {
                name: "!weekly",
                value: "Tietoa weeklystä",
            }, {
                name: "!weekly players",
                value: "Lista weeklyyn osallistujista",
            }, {
                name: "!weekly +",
                value: "Ilmoittaudu weeklyyn",
            }, {
                name: "!weekly -",
                value: "Peru weeklyyn ilmoittautuminen",
            }
        ]
    };

    msg.channel.send({ embeds: [eventEmbed] });
}

module.exports = { handleCommands };