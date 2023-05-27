import { SlashCommandBuilder } from "discord.js";
import { handleCoinFlip } from "../functions/games/coinflip.js";
import { handleDiceRoll } from "../functions/games/diceroll.js";

export const coinFlipCommand = {
    data: new SlashCommandBuilder()
		.setName("coinflip")
		.setDescription("Heads or tails"),
	execute: async (interaction) => {
        handleCoinFlip(interaction);
    },
};

export const diceRollCommand = {
    data: new SlashCommandBuilder()
		.setName("roll")
		.setDescription("Roll a die")
        .addIntegerOption(option =>
            option.setName("dice")
                .setDescription("Amount of dice to roll (1-99)")
                .setMinValue(1)
                .setMaxValue(99))
        .addIntegerOption(option =>
            option.setName("sides")
                .setDescription("How many sides does the die have (2-99)")
                .setMinValue(2)
                .setMaxValue(99)),
	execute: async (interaction) => {
        handleDiceRoll(interaction);
    },
};