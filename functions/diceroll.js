export const handleDiceRoll = (msg) => {
    const diceRollEmbed = {
        color: 0xffa500,
        title: "🎲 Dice Roll 🎲",
        fields: []
    };
    const msgToLowerCase = msg.content.toLowerCase();
    const msgParams = msgToLowerCase.split(" ");

    if (msgParams[0] !== "!roll") return;

    if (msgParams.length > 2) {
        msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
        return;
    }

    const diceAttr = msgParams[1];
    let results = [];

    if (diceAttr) {
        if (diceAttr.split("d").length - 1 > 1) {
            msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
            return;
        }

        const dice = diceAttr.split("d")[0] ? diceAttr.split(/(?<=d)/)[0] : diceAttr;
        const sides = diceAttr.split("d")[1] ? diceAttr.split("d")[1] : "";
        const diceCount = dice.split("d")[0];

        const regExp = /^\d+$/;
        if (!regExp.test(diceAttr.split("d")[0])) {
            msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
            return;
        }

        if (diceCount > 99 || (sides && sides > 99)) {
            msg.reply("Noppia ja silmälukuja voi olla maksimissaan 99!");
            return;
        } else if (diceCount <= 0 || sides && sides <= 1) {
            msg.reply("Noppien ja silmälukujen täytyy olla suurempi kuin 1!");
            return;
        }

        if (!dice && !sides) {
            msg.reply("Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
            return;
        }
        
        if (dice && !sides) {
            if (dice.endsWith("d")) {
                if (diceCount && !isNaN(diceCount)) {
                    if (diceCount > 1) {
                        for (var i=0; i<diceCount; i++) {
                            results.push(Math.floor(Math.random() * 6 + 1));
                        }
                        const calcResults = calculateDice(results);
                        const chunk = sliceArray(results, 10);

                        diceRollEmbed.fields.push({
                            name: "Dice:",
                            value: chunk.join("\n")
                        }, {
                            name: "Stats:",
                            value: Object.entries(calcResults).map(value => value.join(": ")).join("\n")
                        });

                        msg.channel.send({ embeds: [diceRollEmbed] });
                    } else {
                        diceRollEmbed.fields.push({
                            name: "Dice:",
                            value: Math.floor(Math.random() * 6 + 1)
                        });
    
                        msg.channel.send({ embeds: [diceRollEmbed] })
                    }
                } else {
                    msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
                    return;
                }
            }

            if (!dice.endsWith("d") && isNaN(dice)) {
                msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
                return;
            }
            
            if (!isNaN(dice)) {
                diceRollEmbed.fields.push({
                    name: "Dice:",
                    value: Math.floor(Math.random() * dice + 1)
                });

                msg.channel.send({ embeds: [diceRollEmbed] })
            }
        }

        if (dice && sides) {
            if (dice.endsWith("d")) {
                if (isNaN(diceCount) || isNaN(sides)) {
                    msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
                    return;
                }
                
                if (!isNaN(diceCount) && !isNaN(sides)) {
                    for (var i=0; i<diceCount; i++) {
                        results.push(Math.floor(Math.random() * sides + 1));
                    }
                    const calcResults = calculateDice(results);
                    const chunk = sliceArray(results, 10);

                    diceRollEmbed.fields.push({
                        name: "Dice:",
                        value: chunk.join("\n")
                    }, {
                        name: "Stats:",
                        value: Object.entries(calcResults).map(value => value.join(": ")).join("\n")
                    });

                    msg.channel.send({ embeds: [diceRollEmbed] })
                }
            } else {
                msg.reply("Nopan arvot ovat virheellisiä! Anna nopan arvo esim. !roll 20 tai useampi noppa esim. !roll 2d10");
                return;
            }
        }
    } else if (msgParams[0] === "!roll") {
        diceRollEmbed.fields.push({
            name: "Dice:",
            value: Math.floor(Math.random() * 6 + 1)
        });
        
        msg.channel.send({ embeds: [diceRollEmbed] })
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