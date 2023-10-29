import google from "googlethis"
import { SEARCH_ERR, SEARCH_SUCCESS } from "../variables/constants.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
import { getImageFileExtension } from "./helpers/helpers.js";
import { findOneDocument } from "../database/mongodb_service.js";
import { configuration } from "../database/schemas/configuration_schema.js";

export const handleImageSearch = async (interaction) => {
    const guild = interaction.guild;
    const channel = await guild.channels.cache.get(interaction.channelId);
    const nsfwFilter = await findOneDocument(configuration, { guildId: guild.id }).then(result => {
        if (result.nsfwFilter !== null) return result.nsfwFilter;
        return true;
    });

    const searchTerms = interaction.options.getString("searchterms");
    const options = {
        page: 0, 
        safe: nsfwFilter,
        parse_ads: true,
        additional_params: {
            hl: "fi",
        }
    }

    try {
        //Get first 10 images for more optimal results
        const searchResults = (await google.image(searchTerms, options)).slice(0, 10);
        const image = searchResults[Math.floor(Math.random() * searchResults.length)];
        console.log(SEARCH_SUCCESS, JSON.stringify(image));

        if (!await canSendMessageToChannel(guild, channel, interaction)) return;

        const extension = getImageFileExtension(image.url);
        const imageName = extension ? `${image.id}.${extension}` : `${image.id}.png`

        await interaction.reply({
            content: searchTerms,
            files: [{
                attachment: image.url,
                name: nsfwFilter ? imageName : `SPOILER_${imageName}`,
            }]
        });
    } catch (err){
        console.error(SEARCH_ERR, err)
    }
};