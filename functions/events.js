const { EmbedBuilder } = require("discord.js");
const participant = require("../schemas/participant_schema.ts");

let participants;

const handleEvents = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    
    getParticipants().then(data => {
        if (data.length) {
            participants = data.map(participant => participant.nickname ? participant.nickname : participant.user).join(", ");
        } else participants = "-";

        switch(msgToLowerCase) {
            case "!weekly +":
                addParticipant(msg);
                break;

            case "!weekly -":
                removeParticipant(msg);
                break;

            case "!weekly":
                getInfo(msg);
                break;

            default:
                break;
        }
    });
};

const getInfo = (msg) => {
    let eventEmbed = new EmbedBuilder().setColor(0xBF40BF);

    eventEmbed
        .setTitle("Weekly")
        .addFields({
            name: "Missä?",
            value: "Veturitallit Jyväskylä \nVeturitallinkatu 6 \nPääovesta sisään (soita ovikelloa)",
        }, {
            name: "Milloin?",
            value: "Maanantaisin 16:00-20:00",
        }, {
            name: "Mitä?",
            value: "Smash (Ultimate, Melee) \nGuilty Gear \nKing of Fighters \nStreet Fighter \nFlesh and Blood \nyms."
        }, {
            name: "Muuta",
            value: "Paikan päällä kolme taulutelevisiota ja yksi putkitelevisio. \nPelien ja konsolien tuominen on kävijöiden vastuulla. \nLisätietoa **#jyväskylä**-kanavalla. \nLisätietoa weeklyn vastuuhenkilöiltä (**Rush, Duppaduulix, Mallu**)."
        }, {
            name: "Osallistujat",
            value: `${participants}`
        }
    );

    msg.channel.send({ embeds: [eventEmbed] });
};

const addParticipant = async (msg) => {
    await participant.findOneAndUpdate(
        { user: msg.author.username + "#" + msg.author.discriminator },
        { $setOnInsert: { 
            user: msg.author.username + "#" + msg.author.discriminator,
            nickname: msg.member.displayName 
        }},
        { upsert: true }
    ).then(response => {
        if (response) {
            console.log(response);
            msg.reply("Olet jo ilmoittaunut weeklyyn!");
        } else {
            msg.react("👍");
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
};

const removeParticipant = async (msg) => {
    await participant.findOneAndDelete(
        { user: msg.author.username + "#" + msg.author.discriminator },
    ).then(response => {
        if (response) {
            console.log(response);
            msg.react("👍");
        } else {
            msg.reply("Et ole vielä ilmoittaunut weeklyyn!")
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
};

const getParticipants = async () => {
    return await participant.find(
        {},
        { _id: 0, user: 1, nickname: 1}
    ).lean();
};

const showParticipants = async (msg) => {
    await getParticipants().then(data => {
        if (data.length) {
            participants = data.map(participant => participant.nickname ? participant.nickname : participant.user).join(", ");
        } else participants = "-";
    });

    msg.reply("Osallistujat: " + participants);
};

module.exports = { handleEvents, showParticipants };