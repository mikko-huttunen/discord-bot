const { EmbedBuilder } = require("discord.js");

let eventEmbed = new EmbedBuilder().setColor(0xBF40BF);

const getInfo = (msg) => {
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
            value: "Paikan päällä kolme taulutelevisiota ja yksi putkitelevisio \nPelien ja konsolien tuominen on kävijöiden vastuulla \nLisätietoa **#jyväskylä**-kanavalla \nLisätietoa weeklyn vastuuhenkilöiltä (**Rush, Duppaduulix, Mallu**)."
        });
        msg.channel.send({ embeds: [eventEmbed] });
}

module.exports = { getInfo };