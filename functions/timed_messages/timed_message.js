import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../helpers/checks.js";
import { createTimedMessage, deleteTimedMessageById, getTimedMessagesByQuery, getTimedMessagesByUser, updateTimedMessage } from "./services/timed_message_service.js";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, FETCH_ERR, ID, ISO_8601_24, MAX_TIMED_MESSAGES, MONTHLY, NO_CHANNEL, NO_RECORDS, SEND_PERMISSION_ERR, TIMED_MESSAGE_MODAL, WEEKLY, YEARLY } from "../../variables/constants.js";
import { getChannelName } from "../helpers/helpers.js";

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

            deleteTimedMessageById(id, author, interaction);
            break;
        }

        case "listtimedmessages": {
            const timedMessagesEmbed = {
                color: 0xBF40BF,
                title: "Timed Messages",
                fields: []
            };

            getTimedMessagesByUser(interaction.user, interaction.guildId)
            .then(posts => {
                if (posts.length > 0) {
                    const postsSorted = posts.sort((a, b) => a.date.getTime() - b.date.getTime());
                    postsSorted.forEach(field => timedMessagesEmbed.fields.push({
                        name: "ID: " + field.id,
                        value: "Message: " + field.message +
                            "\nDate: " + moment(field.date).format(DAY_MONTH_YEAR_24) + 
                            "\nChannel: " + getChannelName(field.channelId)
                    }));

                    interaction.reply({ embeds: [timedMessagesEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: NO_RECORDS, ephemeral: true });
                }
            }).catch(err => {
                console.error(FETCH_ERR, err);
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

    const dateInput = new TextInputBuilder()
        .setCustomId("dateInput")
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
    const dateActionRow = new ActionRowBuilder().addComponents(dateInput);
    const repeatActionRow = new ActionRowBuilder().addComponents(repeatInput);

    modal.addComponents(messageActionRow, dateActionRow, repeatActionRow);

    interaction.showModal(modal);
};

const canCreateNewTimedMessage = async (interaction) => {
    return getTimedMessagesByUser(interaction.user).then(posts => {
        if (posts.length >= 5) {
            return false;
        }

        return true;
    }).catch(err => {
        console.error(FETCH_ERR, err);
    });
};

export const validateTimedMessage = async (interaction) => {
    const author = interaction.user.id;
    const message = interaction.fields.getTextInputValue("messageInput");
	const date = interaction.fields.getTextInputValue("dateInput");
    const dateTime = moment(date, DAY_MONTH_YEAR_24).format(ISO_8601_24);
    const repeat = interaction.fields.getTextInputValue("repeatInput").toLowerCase();
    const guildId = interaction.guildId;

    if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

    createTimedMessage(interaction, author, message, dateTime, repeat, guildId, channel.id);
};

export const postTimedMessages = async (client) => {
    const query = {
        date: {
            $lte: moment.utc()
        }
    };

    const timedMessagesToPost = await getTimedMessagesByQuery(query)
    .catch(err => {
        console.error(FETCH_ERR, err);
    });

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

            await updateTimedMessage(id, newDate);
        } else {
            await deleteTimedMessageById(id, author);
        }
    }
};