import * as dotenv from "dotenv";
import videoSearch from "youtube-search";
import { NO_RESULTS, SEARCH_ERR, SEARCH_SUCCESS, SEND_PERMISSION_ERR } from "../variables/constants.js";
import { getChannelName } from "./helpers/helpers.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
dotenv.config();

export const handleVideoSearch = async (interaction) => {
    const searchterms = interaction.options.getString("searchterms");
    const options = {
        maxResults: 1,
        key: process.env.YOUTUBE_API_KEY,
        type: "video"
    };
    
    if (!await canSendMessageToChannel(interaction.guild, interaction.channel)) {
        interaction.reply({ 
            content: SEND_PERMISSION_ERR + getChannelName(interaction.channelId),
            ephemeral: true 
        });
        return;
    }

    await videoSearch(searchterms, options, async function(err, results) {
        if (err) {
            interaction.reply({
                content: SEARCH_ERR,
                ephemeral: true 
            });
            return;
        }

        if (results.length <= 0) {
            console.log(NO_RESULTS, searchterms);
            interaction.reply({
                content: NO_RESULTS + searchterms,
                ephemeral: true
            });
            return;
        }

        const video = results[0];
        console.log(SEARCH_SUCCESS, JSON.stringify(video));
        await interaction.reply({
            content: `${searchterms}\n${video.link}`,
            ephemeral: false
        });
    });
};
