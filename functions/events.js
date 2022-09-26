import { EmbedBuilder } from "@discordjs/builders";
import { weeklyParticipants } from "../models/weekly_participant_schema.js";

let participants;

export const handleEvents = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    
    getParticipants().then(data => {
        if (data.length) {
            participants = data.map(participant => participant.nickname ? participant.nickname : participant.user).join(", ") + " (Osallistu komennolla **!weekly +**)";
        } else participants = "Ole ensimmäinen komennolla **!weekly +**";

        switch(msgToLowerCase) {
            case "!weekly players":
            case "!weekly osallistujat":
                showParticipants(msg);
                break;

            case "!weekly +":
                if (msg.author.bot) break;
                addParticipant(msg);
                break;

            case "!weekly -":
                if (msg.author.bot) break;
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
    const thumbnail = "https://i.imgur.com/WtLxcC7.png";

    eventEmbed
        .setTitle("Weekly")
        .setThumbnail(thumbnail)
        .addFields({
            name: "Missä?",
            value: "Veturitallit Jyväskylä \nVeturitallinkatu 6 \nPääovesta sisään (soita ovikelloa)",
        }, {
            name: "Milloin?",
            value: "Maanantaisin 16:00-20:00",
        }, {
            name: "Mitä?",
            value: "Smash (Ultimate, Melee) \nGuilty Gear \nKing of Fighters \nStreet Fighter \nFlesh and Blood TCG \nyms."
        }, {
            name: "Muuta",
            value: "Paikan päällä kolme taulutelevisiota ja yksi putkitelevisio. \nPelien ja konsolien tuominen on kävijöiden vastuulla. \nLisätietoa <#574509192862236673>-kanavalla. \nLisätietoa weeklyn vastuuhenkilöiltä (**Rush, Duppaduulix, Mallu**)."
        }, {
            name: "Osallistujat",
            value: `${participants}`
        }
    );

    if (msg.author.bot) {
        msg.edit({ 
            content: "",
            embeds: [eventEmbed] });
    } else {
        msg.channel.send({ embeds: [eventEmbed] });
    }
};

const addParticipant = async (msg) => {
    await weeklyParticipants.findOneAndUpdate(
        { user: msg.author.username + "#" + msg.author.discriminator },
        { $setOnInsert: { 
            user: msg.author.username + "#" + msg.author.discriminator,
            nickname: msg.member.displayName 
        }},
        { upsert: true }
    ).then(response => {
        if (response) {
            console.log(response);
            msg.reply("Olet jo ilmoittautunut weeklyyn!");
        } else {
            msg.react("✅");
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
};

const removeParticipant = async (msg) => {
    await weeklyParticipants.findOneAndDelete(
        { user: msg.author.username + "#" + msg.author.discriminator },
    ).then(response => {
        if (response) {
            console.log(response);
            msg.react("✅");
            msg.react("<:kitano:345334502576488448>"); //Hardcoded value
        } else {
            msg.reply("Et ole vielä ilmoittautunut weeklyyn!");
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
};

const getParticipants = async () => {
    return await weeklyParticipants.find(
        {},
        { _id: 0, user: 1, nickname: 1}
    ).lean();
};

export const showParticipants = async (msg) => {
    await getParticipants().then(data => {
        if (data.length) {
            participants = data.map(participant => participant.nickname ? participant.nickname : participant.user).join(", ");
        } else participants = "-";
    });

    if (msg.author.bot) {
        msg.edit("Osallistujat: " + participants);
    } else {
        msg.reply("Osallistujat: " + participants);
    }
};