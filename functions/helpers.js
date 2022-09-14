const handleHelp = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    switch(msgToLowerCase) {
        case "!help":
            helper(msg);
            break;

        case "!help role":
            roleHelper(msg);
            break;

        case "!help weekly":
            eventHelper(msg);
            break;

        default:
            break;
    }
}

const helper = (msg) => {
    const helpEmbed = {
        color: 0xFFEA00,
        title: "Komennot",
        fields: [
            {
                name: "!help role",
                value: "Rooli komennot",
            }, {
                name: "!help weekly",
                value: "Weekly komennot",
            }, {
                name: "!image <hakusana>",
                value: "Satunnainen kuva annetulla hakusanalla",
            }
        ],
    };

    msg.channel.send({ embeds: [helpEmbed] });
};

const roleHelper = (msg) => {
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

const eventHelper = (msg) => {
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

module.exports = { handleHelp };