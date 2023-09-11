import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, ERROR_REPLY, ID, INSERT_FAILURE, INSERT_SUCCESS, ISO_8601_24, MAX_TIMED_MESSAGES, MONTHLY, NO_CHANNEL, NO_GUILD, NO_RECORDS, SEND_PERMISSION_ERR, TIMED_MESSAGE_MODAL, WEEKLY, YEARLY } from "../variables/constants.js";
import { generateId, getChannelName, getUnicodeEmoji } from "./helpers/helpers.js";
import { deleteDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { timedMessage } from "../database/schemas/timed_message_schema.js";

export const handleTimedMessage = async (interaction) => {
    switch (interaction.commandName) {
        case "timedmessage": {
            const channel = interaction.options.getChannel(CHANNEL);

            if (!await canCreateNewTimedMessage(interaction)) {
                interaction.reply({ content: MAX_TIMED_MESSAGES, ephemeral: true });
                break;
            }

            if (!await canSendMessageToChannel(interaction.guild, channel)) {
                interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
                break;
            }

            timedMessageModal(interaction);

            const filter = i => {
                return i.user.id === interaction.user.id;
            };
        
            interaction.awaitModalSubmit({ time: 120_000, filter }).then(i => {
                createTimedMessage(i, channel);
            }).catch(err => console.log(err, 'No modal submit interaction was collected'));

            break;
        }

        case "deletetimedmessage": {
            const id = interaction.options.getString(ID);
            const author = interaction.user.id;

            const query = {
                id,
                author
            };

            deleteDocument(timedMessage, query).then(response => {
                if (response) {
                    console.log(DELETE_SUCCESS, JSON.stringify(response));
                    interaction.reply({
                        content: "Timed message deleted successfully! " + getUnicodeEmoji("1F44D"),
                        ephemeral: true
                    });
                } else {
                    interaction.reply({
                        content: "Cannot delete timed message **" + id + "**, or given ID is wrong!",
                        ephemeral: true
                    });
                }
            }).catch(err => {
                console.error(DELETE_ERR, err);
                interaction.reply({ content: ERROR_REPLY, ephemeral: true });
            });
            break;
        }

        case "listtimedmessages": {
            const timedMessagesEmbed = {
                color: 0xBF40BF,
                title: "Timed Messages",
                fields: []
            };
            const query = {
                author: interaction.user.id,
                guildId: interaction.guild.id
            };
            const timedMessages = await getDocuments(timedMessage, query);
            
            if (timedMessages.length <= 0) {
                interaction.reply({ content: NO_RECORDS, ephemeral: true });
                break;
            }

            const messagesSorted = timedMessages.sort((a, b) => a.date.getTime() - b.date.getTime());
            
            messagesSorted.forEach(tm => timedMessagesEmbed.fields.push({
                name: "ID: " + tm.id,
                value: "Message: " + tm.message +
                    "\nDate: " + moment(tm.date).format(DAY_MONTH_YEAR_24) + 
                    "\nChannel: " + getChannelName(tm.channelId)
            }));

            interaction.reply({ embeds: [timedMessagesEmbed], ephemeral: true });
            break;
        }

        default: {
            break;
        }
    }
};

const timedMessageModal = (interaction) => {
    const modal = new ModalBuilder()
        .setCustomId(TIMED_MESSAGE_MODAL)
        .setTitle("New Timed Message");

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

const canCreateNewTimedMessage = async (interaction) => {
    const query = {
        author: interaction.user.id,
        guildId: interaction.guild.id
    };

    return getDocuments(timedMessage, query).then(messages => {
        if (messages.length >= 5) {
            return false;
        }

        return true;
    });
};

export const createTimedMessage = async (interaction, channel) => {
    const userDateTime = interaction.fields.getTextInputValue("dateTimeInput");
    const userRepeat = interaction.fields.getTextInputValue("repeatInput").toLowerCase();

    const timedMessageData = {
        id: generateId(),
        author: interaction.user.id,
        message: interaction.fields.getTextInputValue("messageInput"),
        dateTime: moment(userDateTime, DAY_MONTH_YEAR_24).format(ISO_8601_24),
        repeat: userRepeat,
        guildId: interaction.guildId,
        channelId: channel.id
    };

    if (!isValidDateAndRepetition(interaction, timedMessageData.dateTime, userRepeat)) return;

    insertDocuments(timedMessage, timedMessageData).then(response => {
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({ 
            content: "New timed message created successfully! " + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
    }).catch(err => {
        console.error(INSERT_FAILURE, err);
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
    });
};

export const postTimedMessages = async (client) => {
    const findQuery = {
        dateTime: {
            $lte: moment.utc()
        }
    };

    const timedMessagesToPost = await getDocuments(timedMessage, findQuery);

    for (const timedMessageData of timedMessagesToPost) {
        const { id, author, message, dateTime, repeat, guildId, channelId } = timedMessageData;

        const guild = await client.guilds.cache.get(guildId);
        const channel = await client.channels.cache.get(channelId);

        if (!guild || !channel) {
            if (!guild) console.log(NO_GUILD + guildId);
            else if (!channel) console.log(NO_CHANNEL + id);

            await deleteDocument(timedMessage, { id }).then(response => {
                console.log(DELETE_SUCCESS, JSON.stringify(response));
            }).catch(err => {
                console.error(DELETE_ERR, err);
            });

            continue;
        }

        if (canSendMessageToChannel(guild, channel)) {
            channel.send(message);
            console.log("Timed message posted", JSON.stringify(timedMessageData));
        } else {
            console.log("Cannot send timed message " + id + " to channel: " + channelId);

            await deleteDocument(timedMessage, { id }).then(response => {
                console.log(DELETE_SUCCESS, JSON.stringify(response));
            }).catch(err => {
                console.error(DELETE_ERR, err);
            });

            continue;
        }

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

            updateDocument(timedMessage, { id }, { dateTime: newDateTime });
        } else {
            const deleteQuery = {
                id,
                author
            }

            deleteDocument(timedMessage, deleteQuery).then(response => {
                console.log(DELETE_SUCCESS, JSON.stringify(response));
            }).catch(err => {
                console.error(DELETE_ERR, err);
            });
        }
    }
};