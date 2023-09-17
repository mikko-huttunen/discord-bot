import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, EMPTY, ERROR_REPLY, ID, ISO_8601_24, MAX_SCHEDULED_MESSAGES, MONTHLY, NO_CHANNEL, NO_GUILD, NO_RECORDS, SCHEDULED_MESSAGE_MODAL, SEND_PERMISSION_ERR, WEEKLY, YEARLY } from "../variables/constants.js";
import { canCreateNew, generateId, getChannelName, getMemberData, getUnicodeEmoji } from "./helpers/helpers.js";
import { deleteDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { scheduledMessage } from "../database/schemas/scheduled_message_schema.js";

export const createScheduledMessage = async (interaction) => {
    const channel = interaction.options.getChannel(CHANNEL);

    if (!await canCreateNew(scheduledMessage, interaction.user.id, interaction.guild.id)) {
        interaction.reply({ content: MAX_SCHEDULED_MESSAGES, ephemeral: true });
        return;
    }

    if (!await canSendMessageToChannel(interaction.guild, channel)) {
        interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
        return;
    }

    scheduledMessageModal(interaction);

    const filter = i => {
        return i.user.id === interaction.user.id;
    };

    const modalSubmit = interaction.awaitModalSubmit({ time: 300_000, filter });
    const userDateTime = modalSubmit.fields.getTextInputValue("dateTimeInput");
    const userRepeat = modalSubmit.fields.getTextInputValue("repeatInput").toLowerCase();

    const scheduledMessageData = {
        id: generateId(),
        author: modalSubmit.user.id,
        message: modalSubmit.fields.getTextInputValue("messageInput"),
        dateTime: moment(userDateTime, DAY_MONTH_YEAR_24).format(ISO_8601_24),
        repeat: userRepeat,
        guildId: modalSubmit.guild.id,
        channelId: channel.id
    };

    if (!isValidDateAndRepetition(interaction, scheduledMessageData.dateTime, userRepeat)) return;

    const inserted = await insertDocuments(scheduledMessage, scheduledMessageData);

    if (!inserted) {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    }

    interaction.reply({ 
        content: "New scheduled message created successfully! " + getUnicodeEmoji("1F44D"),
        ephemeral: true
    });
};

export const listScheduledMessages = async (interaction) => {
    const query = {
        author: interaction.user.id,
        guildId: interaction.guild.id
    };
    const scheduledMessages = await getDocuments(scheduledMessage, query);
    
    if (scheduledMessages === "error") {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    } else if (scheduledMessages.length === 0) {
        interaction.reply({ content: NO_RECORDS, ephemeral: true });
        return;
    }

    const messagesSorted = scheduledMessages.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    const scheduledMessagesData = messagesSorted.map(message => ({
        name: "ID: " + message.id,
        value: "Message: " + message.message +
            "\nDate: " + moment(message.dateTime).format(DAY_MONTH_YEAR_24) + 
            "\nChannel: " + getChannelName(message.channelId)
    }));

    const scheduledMessageEmbed = {
        color: 0xBF40BF,
        title: "Scheduled Messages",
        fields: [...scheduledMessagesData]
    };

    interaction.reply({ embeds: [scheduledMessageEmbed], ephemeral: true });
};

export const deleteScheduledMessage = async (interaction) => {
    const id = interaction.options.getString(ID);
    const author = interaction.user.id;

    const query = {
        id,
        author
    };

    const deleted = await deleteDocument(scheduledMessage, query);
    
    if (deleted === "error") {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    } else if (!deleted) {
        interaction.reply({
            content: "Cannot delete scheduled message **" + id + "**, or given ID is wrong!",
            ephemeral: true
        });
        return;
    }

    interaction.reply({
        content: "Scheduled message deleted successfully! " + getUnicodeEmoji("1F44D"),
        ephemeral: true
    });
};

const scheduledMessageModal = (interaction) => {
    const modal = new ModalBuilder()
        .setCustomId(SCHEDULED_MESSAGE_MODAL)
        .setTitle("New Scheduled Message");

    const messageInput = new TextInputBuilder()
        .setCustomId("messageInput")
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Message content")
        .setRequired(true);

    const dateTimeInput = new TextInputBuilder()
        .setCustomId("dateTimeInput")
        .setLabel("Sending date (Within year in the future)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("dd.mm.yyyy hh:mm")
        .setRequired(true);

    const repeatInput = new TextInputBuilder()
        .setCustomId("repeatInput")
        .setLabel("Repeat interval (optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("daily/weekly/monthly/yearly")
        .setRequired(false);

    const messageActionRow = new ActionRowBuilder().addComponents(messageInput);
    const dateActionRow = new ActionRowBuilder().addComponents(dateTimeInput);
    const repeatActionRow = new ActionRowBuilder().addComponents(repeatInput);

    modal.addComponents(messageActionRow, dateActionRow, repeatActionRow);

    interaction.showModal(modal);
};

export const postScheduledMessages = async (client) => {
    const findQuery = {
        dateTime: {
            $lte: moment.utc()
        }
    };

    const scheduledMessagesToPost = await getDocuments(scheduledMessage, findQuery);

    for (const scheduledMessageData of scheduledMessagesToPost) {
        const { id, author, message, dateTime, repeat, guildId, channelId } = scheduledMessageData;

        const guild = await client.guilds.cache.get(guildId);
        const channel = await client.channels.cache.get(channelId);

        if (!guild || !channel) {
            if (!guild) console.log(NO_GUILD + guildId);
            else if (!channel) console.log(NO_CHANNEL + id);

            await deleteDocument(scheduledMessage, { id });

            continue;
        }

        if (!canSendMessageToChannel(guild, channel)) {
            console.log("Cannot send scheduled message " + id + " to channel: " + channelId);
            await deleteDocument(scheduledMessage, { id });

            continue;
        }

        const authorData = await getMemberData(author, guild);

        const scheduledMessageEmbed = {
            color: 0xBF40BF,
            author: {
                name: authorData.nickname ? authorData.nickname : authorData.user.username,
                icon_url: authorData.user.avatarURL()
            },
            title: EMPTY,
            fields: [message],
            footer: "This is a scheduled message"
        };

        await channel.send({ embeds: [scheduledMessageEmbed] });
        console.log("Scheduled message posted", JSON.stringify(scheduledMessageData));

        if (repeat) {
            let newDateTime;
            
            if (repeat === DAILY) {
                newDateTime = moment(dateTime).add(1, "d");
            } else if (repeat === WEEKLY) {
                newDateTime = moment(dateTime). add(1, "w");
            } else if (repeat === MONTHLY) {
                newDateTime = moment(dateTime). add(1, "M");
            } else if (repeat === YEARLY) {
                newDateTime = moment(dateTime). add(1, "y");
            }

            await updateDocument(scheduledMessage, { id }, { dateTime: newDateTime });
        } else {
            const deleteQuery = {
                id,
                author
            }

            await deleteDocument(scheduledMessage, deleteQuery);
        }
    }
};