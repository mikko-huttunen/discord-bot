import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../helpers/checks.js";
import { createTimedMessage, deleteTimedMessageById, getTimedMessagesByQuery, getTimedMessagesByUser, updateTimedMessage } from "./data/services/timed_message_service.js";

let channel;

export const handleTimedMessage = async (interaction) => {
    switch (interaction.commandName) {
        case "timedmessage": {
            channel = interaction.options.getChannel("channel");

            if (!await canSendMessageToChannel(channel)) {
                interaction.reply({ content: "En voi lähettää viestejä kanavalle <#" + channel.id + ">", ephemeral: true });
                break;
            }

            if (!await canCreateNewTimedMessage(interaction)) {
                interaction.reply({
                    content: "Sinulla voi olla maksimissaan 5 ajastettua viestiä!\n" +
                        "Voit katsoa viestisi komennolla **/listtimedmessages**, ja poistaa niitä komennolla **/deletetimedmessage**.",
                    ephemeral: true,
                });
                break;
            }

            timedMessageModal(interaction);
            break;
        }

        case "deletetimedmessage": {
            const id = interaction.options.getString("id");
            const author = interaction.user.username + "#" + interaction.user.discriminator;

            deleteTimedMessageById(interaction, id, author);
            break;
        }

        case "listtimedmessages": {
            const timedMessagesEmbed = {
                color: 0xBF40BF,
                title: "Timed Messages",
                fields: []
            };

            getTimedMessagesByUser(interaction).then(posts => {
                if (posts.length > 0) {
                    const postsSorted = posts.sort((a, b) => a.date.getTime() - b.date.getTime());
                    postsSorted.forEach(field => timedMessagesEmbed.fields.push({
                        name: "ID: " + field.id,
                        value: "Message: " + field.message +
                            "\nDate: " + moment(field.date).format("DD.MM.YYYY HH:mm") + 
                            "\nChannel: <#" + field.channelId + ">"
                    }));

                    interaction.reply({ embeds: [timedMessagesEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: "Sinulla ei ole ajastettuja viestejä...", ephemeral: true });
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
        .setCustomId("timed-message-modal")
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
    return getTimedMessagesByUser(interaction).then(posts => {
        if (posts.length >= 5) {
            return false;
        }

        return true;
    });
};

export const validateTimedMessage = async (interaction) => {
    const author = interaction.user.id;
    const message = interaction.fields.getTextInputValue("messageInput");
	const date = interaction.fields.getTextInputValue("dateInput");
    const dateTime = moment(date, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
    const repeat = interaction.fields.getTextInputValue("repeatInput").toLowerCase();

    if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

    createTimedMessage(interaction, author, message, dateTime, repeat, channel);
};

export const postTimedMessages = async (client) => {
    const query = {
        date: {
            $lte: moment.utc()
        }
    }

    await getTimedMessagesByQuery(query).then(response => {
        if (response?.length > 0) {
            response.forEach(async (post) => {
                const { id, author, message, date, repeat, channelId } = post;
                const channelToSend = await client.channels.cache.get(channelId);

                if (!channelToSend) {
                    console.log("No channel to send timed message " + id);
                    return;
                }

                if (canSendMessageToChannel(channelToSend)) {
                    channelToSend.send(message);
                    console.log("Timed message posted: " + post);
                } else {
                    console.log("No channel to post: " + post);
                    return;
                }

                if (repeat) {
                    let newDate;
                    
                    if (repeat === "daily") {
                        newDate = moment(date).add(1, "d");
                    } else if (repeat === "weekly") {
                        newDate = moment(date). add(1, "w");
                    } else if (repeat === "monthly") {
                        newDate = moment(date). add(1, "M");
                    } else if (repeat === "yearly") {
                        newDate = moment(date). add(1, "y");
                    }

                    await updateTimedMessage(id, newDate);
                } else {
                    await deleteTimedMessageById(id, author).then(response => {
                        if (response.deletedCount > 0) {
                            console.log("Deleted timed message");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
                }
            });
        }
    });
};