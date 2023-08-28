const coinHeads = "https://i.imgur.com/4xsT5U5.png";
const coinTails = "https://i.imgur.com/bH9n2z1.png";
const coinFlipEmbed = {
    color: 0xffa500
};

export const handleCoinFlip = (interaction) => {
    const random = Math.floor(Math.random() * 2);

    random === 0 ? 
        coinFlipEmbed.author = {
            name: "Heads",
            icon_url: coinHeads,
        } : 
        coinFlipEmbed.author = {
            name: "Tails",
            icon_url: coinTails,
        }

    interaction.reply({ embeds: [coinFlipEmbed] });
}