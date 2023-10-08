import google from "googlethis"
import { SEARCH_ERR, SEARCH_SUCCESS, SEND_PERMISSION_ERR } from "../variables/constants.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
import { getChannelName } from "./helpers/helpers.js";

export const handleImageSearch = async (interaction) => {
    const searchterms = interaction.options.getString("searchterms");
    const options = {
        page: 0, 
        safe: true,
        parse_ads: true,
        additional_params: {
            hl: "en",
        }
    }

    try {
        const searchResults = await google.image(searchterms, options);
        const image = searchResults[Math.floor(Math.random() * searchResults.length)];

        console.log(SEARCH_SUCCESS, JSON.stringify(image));
        if (!await canSendMessageToChannel(interaction.guild, interaction.channel)) {
            interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(interaction.channelId), ephemeral: true });
            return;
        }

        interaction.reply({
            content: "Search terms: " + searchterms,
            files: [{
                attachment: image.url,
                //TODO: Get image extension dynamically
                name: image.id + ".png"
            }]
        });
    } catch {
        interaction.reply({ content: SEARCH_ERR, ephemeral: true });
    }
};