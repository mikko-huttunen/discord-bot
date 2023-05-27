export const handleDiceRoll = (interaction) => {
    const diceRollEmbed = {
        color: 0xffa500,
        title: "🎲 Dice Roll 🎲",
        fields: []
    };
    const dice = interaction.options.getInteger("dice");
    const sides = interaction.options.getInteger("sides");
    let results = [];

    if ((!dice || dice === 1) && !sides) {
        diceRollEmbed.fields.push({
            name: "Results:",
            value: Math.floor(Math.random() * 6 + 1)
        });
        
        interaction.reply({ embeds: [diceRollEmbed] });
    }
        
    if (dice > 1 && !sides) {
        for (var i=0; i<dice; i++) {
            results.push(Math.floor(Math.random() * 6 + 1));
        }
        const calcResults = calculateDice(results);
        const chunk = sliceArray(results, 10);

        diceRollEmbed.fields.push({
            name: "Roll:",
            value: "Dice: " + dice
        }, {
            name: "Results:",
            value: chunk.join(",\n")
        }, {
            name: "Stats:",
            value: Object.entries(calcResults).map(value => value.join(": ")).join("\n")
        });

        interaction.reply({ embeds: [diceRollEmbed] });
    }

    if (!dice && sides) {
        diceRollEmbed.fields.push({
            name: "Roll:",
            value: "Sides: " + sides
        }, {
            name: "Results:",
            value: Math.floor(Math.random() * sides + 1)
        });
        
        interaction.reply({ embeds: [diceRollEmbed] });
    }

    if (dice && sides) {
        for (var j=0; j<dice; j++) {
            results.push(Math.floor(Math.random() * sides + 1));
        }
        const calcResults = calculateDice(results);
        const chunk = sliceArray(results, 10);

        diceRollEmbed.fields.push({
            name: "Roll:",
            value: "Dice: " + dice + ", sides: " + sides
        }, {
            name: "Dice:",
            value: chunk.join(",\n")
        }, {
            name: "Stats:",
            value: Object.entries(calcResults).map(value => value.join(": ")).join("\n")
        });

        interaction.reply({ embeds: [diceRollEmbed] });
    }
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