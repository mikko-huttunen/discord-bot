import { SlashCommandBuilder } from "discord.js";
import { handleImageSearch } from "../functions/image_search.js";
import { handleVideoSearch } from "../functions/video_search.js";

export const pictureCommand = {
    data: new SlashCommandBuilder()
		.setName("image")
		.setDescription("Get random image based on keywords")
        .addStringOption(option =>
            option.setName("searchterms")
                .setDescription("Search terms")
                .setMinLength(1)
                .setMaxLength(50)
                .setRequired(true)),
	execute: async (interaction) => {
        handleImageSearch(interaction);
    },
};

export const videoCommand = {
    data: new SlashCommandBuilder()
		.setName("video")
		.setDescription("Get video based on keywords")
        .addStringOption(option =>
            option.setName("searchterms")
                .setDescription("Search terms")
                .setMinLength(1)
                .setMaxLength(50)
                .setRequired(true)),
	execute: async (interaction) => {
        handleVideoSearch(interaction);
    },
};