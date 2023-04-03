import { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord.js";
import _ from "lodash";
import moment from "moment";
import { bot } from "../../bot/bot.js";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../helpers/checks.js";
import { createEvent, deleteEventById, getEventByMsg, getEvents, getEventsByQuery, getEventsByUser, updateEventAttendees, updateEventData } from "./data/services/event_service.js";

let channel;

const eventEmbed = {
    color: 0x0096FF,
    fields: []
};

export const handleEvent = (interaction) => {
    switch (interaction.commandName) {
        case "event": {
            channel = interaction.options.getChannel("channel");

            if (!canSendMessageToChannel(channel)) {
                interaction.reply({
                    content: "En voi luoda tapahtumaa kanavalle <#" + channel.id + ">",
                    ephemeral: true 
                });
                break;
            }

            if (!canCreateNewEvent(interaction)) {
                interaction.reply({
                    content: "Sinulla voi olla maksimissaan 5 aktiivista tapahtumaa!\n" +
                        "Voit katsoa tapahtumasi komennolla **/listevents**, ja poistaa niitä komennolla **/deleteevents**.",
                    ephemeral: true,
                });
                break;
            }

            eventModal(interaction);
            break;
        }

        case "deleteevent": {
            const id = interaction.options.getString("id");
            const author = interaction.user.id;

            deleteEventById(id, author, interaction);
            break;
        }

        case "listevents": {
            eventEmbed.author = {};
            eventEmbed.title = "Events";
            eventEmbed.thumbnail = {};
            eventEmbed.fields = []
            eventEmbed.footer = {};

            getEvents().then(events => {
                if (events.length > 0) {
                    const eventsSorted = events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
                    eventsSorted.forEach(field => eventEmbed.fields.push({
                        name: "ID: " + field.eventId,
                        value: "Name: " + field.name +
                            "\nDate: " + moment(field.dateTime).format("DD.MM.YYYY HH:mm") + 
                            "\nChannel: <#" + field.channelId + ">"
                    }));

                    interaction.reply({ embeds: [eventEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: "Ei aktiivisia tapahtumia...", ephemeral: true });
                }
            });

            break;
        }

        default: {
            break;
        }
    }
};

const canCreateNewEvent = async (interaction) => {
    return getEventsByUser(interaction).then(events => {
        console.log(events);
        if (events.length >= 5) {
            return false;
        }

        return true;
    });
};

const eventModal = (interaction) => {
    const modal = new ModalBuilder()
        .setCustomId("event-modal")
        .setTitle("New Event");

    const nameInput = new TextInputBuilder()
        .setCustomId("nameInput")
        .setLabel("Name of the event")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId("descriptionInput")
        .setLabel("Description (optional)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Event description")
        .setRequired(false);

    const eventDateInput = new TextInputBuilder()
        .setCustomId("eventDateInput")
        .setLabel("Event date (Within a year in the future)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("dd.mm.yyyy hh:mm")
        .setRequired(true);

    const repeatInput = new TextInputBuilder()
        .setCustomId("repeatInput")
        .setLabel("Event repeat interval (optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("daily/weekly/monthly/yearly")
        .setRequired(false);

    const thumbnailInput = new TextInputBuilder()
        .setCustomId("thumbnailInput")
        .setLabel("Event thumbnail image (optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("URL to image ending with file extension")
        .setRequired(false);

    const nameActionRow = new ActionRowBuilder().addComponents(nameInput);
    const descriptionActionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const eventDateActionRow = new ActionRowBuilder().addComponents(eventDateInput);
    const repeatActionRow = new ActionRowBuilder().addComponents(repeatInput);
    const thumbnailActionRow = new ActionRowBuilder().addComponents(thumbnailInput);

    modal.addComponents(
        nameActionRow,
        descriptionActionRow,
        eventDateActionRow,
        repeatActionRow,
        thumbnailActionRow,
    );

    interaction.showModal(modal);
};

export const validateEvent = async (interaction) => {
    const author = interaction.user.id;
    const name = interaction.fields.getTextInputValue("nameInput");
    const description = interaction.fields.getTextInputValue("descriptionInput");
	const date = interaction.fields.getTextInputValue("eventDateInput");
    const dateTime = moment(date, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
    const repeat = interaction.fields.getTextInputValue("repeatInput").toLowerCase();
    const thumbnail = interaction.fields.getTextInputValue("thumbnailInput");
    
    if (thumbnail) {
        if (!isValidImageURL(interaction, thumbnail)) return;
    }

    if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

    createNewEvent(interaction, author, name, description, dateTime, repeat, thumbnail);
};

const isValidImageURL = (interaction, thumbnail) => {
    let url;

    try {
        url = new URL(thumbnail);
    } catch {
        interaction.reply({ content: "Kuvan täytyy olla linkki!", ephemeral: true });
        return false;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        interaction.reply({ content: "Kuvan täytyy olla linkki!", ephemeral: true });
        return false;
    }

    if (!thumbnail.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/)) {
        interaction.reply({ content: "Kuvan täytyy olla .jpeg, .jpg, .png tai .gif muodossa.", ephemeral: true });
        return false;
    }
    
    return true;
};

const createEventMsg = async (eventId, author, name, description, date, thumbnail, channelToSend) => {
    const authorData = await bot.guild.members.fetch(author);
    eventEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    },
    eventEmbed.title = name;
    thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
    eventEmbed.fields = [];
    eventEmbed.fields.push({
        name: " ",
        value: moment(date).format("DD.MM.YYYY HH:mm")
    });
    if (description) {
        eventEmbed.fields.push({
            name: " ",
            value: description
        });
    }
    eventEmbed.fields.push({
        name: "Attendees (0):",
        value: "-"
    });
    eventEmbed.footer = ({ text: "ID: " + eventId});

    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("event-button")
                .setLabel("Join/Leave")
                .setStyle(ButtonStyle.Primary)
        );

    const eventMsg = await channelToSend ? 
        await channelToSend.send({ embeds: [eventEmbed], components: [buttonRow] }) :
        await channel.send({ embeds: [eventEmbed], components: [buttonRow] });

    return eventMsg;
}

const createNewEvent = async (interaction, author, name, description, dateTime, repeat, thumbnail) => {
    const id = Math.random().toString(16).slice(9);
    const eventMsg = await createEventMsg(id, author, name, description, dateTime, thumbnail);

    createEvent(interaction, id, eventMsg.id, author, name, description, dateTime, repeat, thumbnail, channel.id);
};

const updateEventMsg = async (eventData, entries) => {
    const eventChannel = bot.guild.channels.cache.get(eventData.channelId);
    const msg = await eventChannel.messages.fetch(eventData.msgId);

    
    const authorData = await bot.guild.members.fetch(eventData.author);

    eventEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    };
    eventEmbed.title = eventData.name;
    eventData.thumbnail ? eventEmbed.thumbnail = { url: eventData.thumbnail } : eventEmbed.thumbnail = {};
    eventEmbed.fields = [];
    eventEmbed.fields.push({
        name: " ",
        value: moment(eventData.dateTime).format("DD.MM.YYYY HH:mm")
    });
    if (eventData.description) {
        eventEmbed.fields.push({
            name: " ",
            value: eventData.description
        });
    }
    eventEmbed.fields.push({
        name: "Attendees (" + entries.length + "):",
        value: entries.length > 0 ? entries.map(entry => entry.name).join(", ") : "-"
    });
    eventEmbed.footer = ({ text: "ID: " + eventData.eventId });

    msg.edit({ embeds: [eventEmbed] });
};

export const handleJoinEvent = async (interaction) => {
    const eventData = await getEventByMsg(interaction.message);
    const user = {
        id: interaction.user.id,
        name: interaction.member.nickname ? interaction.member.nickname : interaction.user.username
    }

    if (eventData) {
        let entries = eventData.attendees.entries;
        
        const isExistingEntry = entries.some(entry => entry.id === user.id);

        if (!isExistingEntry) {
            entries.push(user);
        }

        if (isExistingEntry) {
            entries = _.reject(entries, function(e) { 
                return e.id === user.id && e.vote === user.vote;
            });
        }

        await updateEventAttendees(eventData, entries);
        await updateEventMsg(eventData, entries);

        interaction.deferUpdate();
    }

    return;
};

export const eventReminderPost = async () => {
    const start = moment().utc().startOf("day");
    const end = moment().utc().endOf("day");

    const query = {
        dateTime: {
            "$gte": start, "$lte": end
        }
    }

    const activeEvents = await getEventsByQuery(query);

    for (const eventData of activeEvents) {
        const { eventId, msgId, author, name, description, thumbnail, dateTime, channelId, attendees } = eventData;
        const channelToSend = await bot.client.channels.cache.get(channelId);

        if (!channelToSend) {
            console.log("No channel to post event reminder of " + eventId);
            return;
        }

        if (canSendMessageToChannel(channelToSend)) {
            const authorData = await bot.guild.members.fetch(author);

            eventEmbed.author = {
                name: authorData.nickname ? authorData.nickname : authorData.user.username,
                icon_url: authorData.user.avatarURL()
            },
            eventEmbed.title = name;
            thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
            eventEmbed.fields = [];
            eventEmbed.fields.push({
                name: " ",
                value: moment(dateTime).format("DD.MM.YYYY HH:mm")
            });
            if (description) {
                eventEmbed.fields.push({
                    name: " ",
                    value: description
                });
            }
            eventEmbed.fields.push({
                name: "Attendees (" + attendees.number + "):",
                value: attendees.entries.length > 0 ?
                    attendees.entries.map(entry => entry.name).join(", ") :
                    "-"
            });
            eventEmbed.footer = ({ text: "ID: " + eventId });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("event-button")
                        .setLabel("Join/Leave")
                        .setStyle(ButtonStyle.Primary)
                );

            try {
                const originalEventMsg = await channelToSend.messages.fetch(msgId);
                originalEventMsg.delete();
            } catch (error) {
                console.error(error);
            }

            const eventMsg = await channelToSend.send({ embeds: [eventEmbed], components: [buttonRow] });
            console.log("Event reminder posted:");
            console.log(eventData);
            await updateEventData(eventId, eventMsg.id);
        }
    }
};

export const eventSummaryPost = async (client) => {
    const query = {
        dateTime: {
            $lte: moment.utc()
        }
    };

    getEventsByQuery(query).then(async (response) => {
        if (response?.length > 0) {
            response.forEach(async (eventData) => {
                const { eventId, msgId, author, name, description, thumbnail, dateTime, repeat, channelId, attendees } = eventData;
                const channelToSend = await client.channels.cache.get(channelId);

                if (!channelToSend) {
                    console.log("No channel to send event summary of " + eventId);
                    return;
                }

                if (canSendMessageToChannel(channelToSend)) {
                    const authorData = await bot.guild.members.fetch(author);

                    eventEmbed.author = {
                        name: authorData.nickname ? authorData.nickname : authorData.user.username,
                        icon_url: authorData.user.avatarURL()
                    },
                    eventEmbed.title = name + " started!";
                    thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
                    eventEmbed.fields = [];
                    eventEmbed.fields.push({
                        name: " ",
                        value: moment(dateTime).format("DD.MM.YYYY HH:mm")
                    });
                    if (description) {
                        eventEmbed.fields.push({
                            name: " ",
                            value: description
                        });
                    }
                    eventEmbed.fields.push({
                        name: "Attendees (" + attendees.number + "):",
                        value: attendees.entries.length > 0 ?
                            attendees.entries.map(entry => entry.name).join(", ") :
                            "-"
                    });

                    eventEmbed.footer = {};

                    await channelToSend.send({ embeds: [eventEmbed] });
                    console.log("Event summary posted: " + eventData);

                    try {
                        const eventMsg = await channelToSend.messages.fetch(msgId);
                        eventMsg.delete();
                    } catch (error) {
                        console.error(error);
                    }

                    if (repeat) {
                        let newDate;

                        if (repeat === "daily") {
                            newDate = moment(dateTime).add(1, "d");
                        } else if (repeat === "weekly") {
                            newDate = moment(dateTime). add(1, "w");
                        } else if (repeat === "monthly") {
                            newDate = moment(dateTime). add(1, "M");
                        } else if (repeat === "yearly") {
                            newDate = moment(dateTime). add(1, "y");
                        }

                        const newEventMsg = await createEventMsg(eventId, author, name, description, newDate, thumbnail, channelToSend);
                        await updateEventData(eventId, newEventMsg.id, newDate);
                    } else {
                        await deleteEventById(eventId, author);
                    }
                } else {
                    console.log("Cannot send event summary of " + eventId + " to channel: " + channelId);
                    return;
                }
            });
        }
    });
};