import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, ERROR_REPLY, ID, INSERT_FAILURE, INSERT_SUCCESS, ISO_8601_24, MAX_TIMED_MESSAGES, MONTHLY, NO_CHANNEL, NO_RECORDS, SEND_PERMISSION_ERR, TIMED_MESSAGE_MODAL, WEEKLY, YEARLY } from "../variables/constants.js";
import { generateId, getChannelName, getUnicodeEmoji } from "./helpers/helpers.js";
import { deleteDocument, getDocuments, insertDocument, updateDocument } from "../database/database_service.js";
import { timedMessage } from "../database/schemas/timed_message_schema.js";

let channel;

export const handleTimedMessage = async (interaction) => {
    switch (interaction.commandName) {
        case "timedmessage": {
            channel = interaction.options.getChannel(CHANNEL);

            if (!await canCreateNewTimedMessage(interaction)) {
                interaction.reply({ content: MAX_TIMED_MESSAGES, ephemeral: true });
                break;
            }

            if (!await canSendMessageToChannel(interaction.guild, channel)) {
                interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
                break;
            }

            timedMessageModal(interaction);
            break;
        }

        case "deletetimedmessage": {
            const id = interaction.options.getString(ID);
            const author = interaction.user.id;

            const query = {
                id,
                author
            };

            deleteDocument(timedMessage, query)
            .then(response => {
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
            })
            .catch(err => {
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

            getDocuments(timedMessage, query).then(messages => {
                if (messages.length > 0) {
                    const messagesSorted = messages.sort((a, b) => a.date.getTime() - b.date.getTime());
                    messagesSorted.forEach(field => timedMessagesEmbed.fields.push({
                        name: "ID: " + field.id,
                        value: "Message: " + field.message +
                            "\nDate: " + moment(field.date).format(DAY_MONTH_YEAR_24) + 
                            "\nChannel: " + getChannelName(field.channelId)
                    }));

                    interaction.reply({ embeds: [timedMessagesEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: NO_RECORDS, ephemeral: true });
                }
            });

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

    const filter = i => {
        return i.user.id === interaction.user.id;
    };

    interaction.awaitModalSubmit({ time: 60_000, filter })
        .then(i => {
            i.reply('Thank you for your submission!');
            validateTimedMessage(i, interaction.options.getChannel(CHANNEL));
        })
        .catch(err => console.log(err, 'No modal submit interaction was collected'));
};

const canCreateNewTimedMessage = async (interaction) => {
    const query = {
        author: interaction.user.id,
        guildId: interaction.guild.id
    };

    return getDocuments(timedMessage, query)
    .then(messages => {
        if (messages.length >= 5) {
            return false;
        }

        return true;
    });
};

export const validateTimedMessage = async (interaction, channel) => {
    console.log(channel);
    const timedMessageTest = {
        id: generateId(),
        author: interaction.user.id,
        message: interaction.fields.getTextInputValue("messageInput"),
        dateTime: interaction.fields.getTextInputValue("dateTimeInput"),
        repeat: interaction.fields.getTextInputValue("repeatInput").toLowerCase(),
        guildId: interaction.guildId,
        channelId: channel.id
    };

    console.log(timedMessageTest)

    // const id = generateId();
    // const author = interaction.user.id;
    // const message = interaction.fields.getTextInputValue("messageInput");
	// const inputDate = interaction.fields.getTextInputValue("dateTimeInput");
    // const formattedDate = moment(inputDate, DAY_MONTH_YEAR_24).format(ISO_8601_24);
    // const repeat = interaction.fields.getTextInputValue("repeatInput").toLowerCase();
    // const guildId = interaction.guildId;

    // if (!isValidDateAndRepetition(interaction, formattedDate, repeat)) return;

    // const timedMessageData = {
    //     id,
    //     author,
    //     message,
    //     date: formattedDate,
    //     repeat,
    //     guildId,
    //     channelId: channel.id
    // };

    // insertDocument(timedMessage, timedMessageData)
    // .then(response => {
    //     console.log(INSERT_SUCCESS, JSON.stringify(response));
    //     interaction.reply({ 
    //         content: "New timed message created successfully! " + getUnicodeEmoji("1F44D"),
    //         ephemeral: true
    //     });
    // })
    // .catch(err => {
    //     console.error(INSERT_FAILURE, err);
    //     interaction.reply({ content: ERROR_REPLY, ephemeral: true });
    // });
};

export const postTimedMessages = async (client) => {
    const findQuery = {
        date: {
            $lte: moment.utc()
        }
    };

    const timedMessagesToPost = await getDocuments(timedMessage, findQuery);

    for (const timedMessageData of timedMessagesToPost) {
        const { id, author, message, date, repeat, guildId, channelId } = timedMessageData;
        const guild = await client.guilds.cache.get(guildId);
        const channelToSend = await client.channels.cache.get(channelId);

        if (!channelToSend) {
            console.log(NO_CHANNEL + id);
            continue;
        }

        if (canSendMessageToChannel(guild, channelToSend)) {
            channelToSend.send(message);
            console.log("Timed message posted", JSON.stringify(timedMessageData));
        } else {
            console.log("Cannot send timed message " + id + " to channel: " + channelId);
            continue;
        }

        if (repeat) {
            let newDate;
            
            if (repeat === DAILY) {
                newDate = moment(date).add(1, "d");
            } else if (repeat === WEEKLY) {
                newDate = moment(date). add(1, "w");
            } else if (repeat === MONTHLY) {
                newDate = moment(date). add(1, "M");
            } else if (repeat === YEARLY) {
                newDate = moment(date). add(1, "y");
            }

            const update = { date: newDate };
            updateDocument(timedMessage, id, update);
        } else {
            const deleteQuery = {
                id,
                author
            }

            deleteDocument(timedMessage, deleteQuery)
            .then(response => {
                console.log(DELETE_SUCCESS, JSON.stringify(response));
            })
            .catch(err => {
                console.error(DELETE_ERR, err);
            });
        }
    }
};