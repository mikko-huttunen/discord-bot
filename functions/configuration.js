import { clientId } from "../bot/bot.js";
import { findOneDocument, updateDocument } from "../database/mongodb_service.js";
import { configuration } from "../database/schemas/configuration_schema.js";
import { canSendMessageToChannel } from "./helpers/checks.js";
import { getChannelName, getUnicodeEmoji } from "./helpers/helpers.js";
import { getGuildRoleData } from "./roles.js";

export const changeConfiguration = async (interaction) => {
    const guildRoles = await getGuildRoleData(interaction.guild);
    const botRole = guildRoles.find(role => role.tags?.botId === clientId);
    const defaultRole = interaction.options.getRole("default-role");
    const welcomeMessageChannel = interaction.options.getChannel("welcome-message-channel");

    let configurationData = {
        defaultRoleId: defaultRole?.id,
        defaultRoleName: defaultRole?.name,
        displayWelcomeMessage: interaction.options.getBoolean("display-welcome-message"),
        welcomeMessageChannel: welcomeMessageChannel ? welcomeMessageChannel : null,
        nsfwFilter: interaction.options.getBoolean("nsfw-filter")
    };

    if (defaultRole?.name === "@everyone" || defaultRole?.rawPosition > botRole.position || defaultRole?.tags?.botId) {
        interaction.reply({
            content: `**${defaultRole.name}** cannot be set as default role...`,
            ephemeral: true
        });
        return;
    }

    if (welcomeMessageChannel && !await canSendMessageToChannel(interaction.guild, welcomeMessageChannel, interaction)) return;

    // eslint-disable-next-line no-unused-vars
    configurationData = Object.fromEntries(Object.entries(configurationData).filter(([_, v]) => v != null));

    if (!Object.values(configurationData).every(prop => prop === null)) {
        configurationData.guildId = interaction.guild.id;
        const updated = await updateDocument(configuration, { guildId: interaction.guild.id }, configurationData);
        await interaction.reply({
            content: "Configuration saved successfully!" + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
        console.log("Configuration changed for guild: " + interaction.guild.id, JSON.stringify(updated));
        return;
    }

    configurationData = await findOneDocument(configuration, { guildId: interaction.guild.id });

    const configurationEmbed = {
        color: 0x808080,
        title: `${getUnicodeEmoji("1F527")} Configuration`,
        fields: [{
            name: "Default role",
            value: configurationData?.defaultRoleId ? configurationData.defaultRoleName : "Not set"
        }, {
            name: "Display welcome message",
            value: configurationData?.displayWelcomeMessage == null ? "ON" : (configurationData.displayWelcomeMessage ? "ON" : "OFF")
        }, {
            name: "Welcome message channel",
            value: configurationData?.welcomeMessageChannel ? 
                getChannelName(configurationData.welcomeMessageChannel) :
                getChannelName(interaction.guild.channels.cache.filter(c => c.type === 0).find(x => x.position == 0).id)
        }, {
            name: "Image search NSFW filter",
            value: configurationData?.nsfwFilter == null ? "ON" : (configurationData.nsfwFilter ? "ON" : "OFF")
        }],
    };

    await interaction.reply({ 
        embeds: [configurationEmbed],
        ephemeral: true
    });
};