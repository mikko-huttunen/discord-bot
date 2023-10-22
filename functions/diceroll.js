import { canSendMessageToChannel } from "./helpers/checks.js";
import { getUnicodeEmoji } from "./helpers/helpers.js";

export const handleDiceRoll = async (interaction) => {
    const dice = interaction.options.getInteger("dice") ? interaction.options.getInteger("dice") : 1;
    const sides = interaction.options.getInteger("sides") ? interaction.options.getInteger("sides") : 6;
    const results = [];

    for (var i = 0; i < dice; i++) {
        results.push(Math.floor(Math.random() * sides + 1));
    }

    const calcResults = calculateDice(results);
    const chunk = sliceArray(results, 10);

    const diceRollEmbed = {
        color: 0xffa500,
        title: `${getUnicodeEmoji("1F3B2")} Dice Roll`,
        fields: [{
            name: "Roll:",
            value: `Dice: ${dice}, sides: ${sides}`
        }, {
            name: "Results:",
            value: chunk.join(",\n")
        }]
    }; 
    
    if (dice > 1) {
        diceRollEmbed.fields.push({
            name: "Stats:",
            value: Object.entries(calcResults).map(value => value.join(": ")).join("\n")
        });
    }

    if (!await canSendMessageToChannel(interaction.guild, interaction.channel, interaction)) return;

    interaction.reply({ embeds: [diceRollEmbed] });
}

const calculateDice = (results) => {
    let total = 0;

    results.forEach(dice => {
        total = total + dice;
    });

    const max = Math.max(...results);
    const min = Math.min(...results);
    const average = (total / results.length).toFixed(2);
    const most = getMostFrequent(results);

    return {
        Total: total,
        Max: max,
        Min: min,
        Avg: average,
        "Most (largest)": most
    }
}

const sliceArray = (arr, chunkSize) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk.join(", "));
    }
    return res;
}

const getMostFrequent = (arr) => {
    const hashmap = arr.reduce( (acc, val) => {
        acc[val] = (acc[val] || 0 ) + 1
        return acc
    }, {})
    return Object.keys(hashmap).reduce((a, b) => {
        if (hashmap[a] > hashmap[b]) return a;
        else return b;
    })
}