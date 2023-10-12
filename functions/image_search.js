import google from "googlethis"
import { SEARCH_ERR, SEARCH_SUCCESS, SEND_PERMISSION_ERR } from "../variables/constants.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
import { getChannelName, getImageFileExtension } from "./helpers/helpers.js";

export const handleImageSearch = async (interaction) => {
    const guild = interaction.guild;
    const channel = await guild.channels.cache.get(interaction.channelId);

    const searchTerms = interaction.options.getString("searchterms");
    const options = {
        page: 0, 
        safe: true,
        parse_ads: true,
        additional_params: {
            hl: "fi",
        }
    }

    try {
        const searchResults = await google.image(searchTerms, options);
        const image = searchResults[Math.floor(Math.random() * searchResults.length)];
        console.log(SEARCH_SUCCESS, JSON.stringify(image));

        if (!await canSendMessageToChannel(guild, channel)) {
            interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(interaction.channelId), ephemeral: true });
            return;
        }

        const extension = getImageFileExtension(image.url);
        const imageName = extension ? `${image.id}.${extension}` : `${image.id}.png`

        await interaction.reply({
            content: searchTerms,
            files: [{
                attachment: image.url,
                name: imageName,
            }]
        });
    } catch (err){
        console.error(SEARCH_ERR, err)
    }
};