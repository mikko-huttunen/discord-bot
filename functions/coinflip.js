import { SEND_PERMISSION_ERR } from "../variables/constants.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
import { getChannelName } from "./helpers/helpers.js";

const coinHeads = "https://i.imgur.com/4xsT5U5.png";
const coinTails = "https://i.imgur.com/bH9n2z1.png";

export const handleCoinFlip = async (interaction) => {
    const random = Math.floor(Math.random() * 2);

    const result = () => {
        if (random === 0) {
            return {
                name: "Heads",
                icon_url: coinHeads,
            };
        }
        
        return {
            name: "Tails",
            icon_url: coinTails,
        };
    };

    const coinFlipEmbed = {
        color: 0xffa500,
        author: result()
    };

    if (!await canSendMessageToChannel(interaction.guild, interaction.channel)) {
        interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(interaction.channel.id), ephemeral: true });
        return;
    }

    interaction.reply({ embeds: [coinFlipEmbed] });
}