import { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord.js";
import moment from "moment";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, ERROR_REPLY, EVENT_BUTTON, EVENT_MODAL, FETCH_ERR, ID, INSERT_FAILURE, INSERT_SUCCESS, INVALID_LINK, ISO_8601_24, MAX_EVENTS, MONTHLY, MSG_DELETION_ERR, NO_CHANNEL, NO_DATA, NO_RECORDS, SEND_PERMISSION_ERR, WEEKLY, YEARLY } from "../variables/constants.js";
import { generateId, getChannelName, getUnicodeEmoji } from "./helpers/helpers.js";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { deleteDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { event } from "../database/schemas/event_schema.js";

let channel;

const eventEmbed = {
    color: 0x0096FF,
    fields: []
};

export const handleEvent = async (interaction) => {
    switch (interaction.commandName) {
        case "event": {
            channel = interaction.options.getChannel(CHANNEL);

            if (!await canCreateNewEvent(interaction.user)) {
                interaction.reply({
                    content: MAX_EVENTS,
                    ephemeral: true,
                });
                break;
            }
            
            if (!await canSendMessageToChannel(interaction.guild, channel)) {
                interaction.reply({
                    content: SEND_PERMISSION_ERR + getChannelName(channel.id),
                    ephemeral: true 
                });
                break;
            }

            eventModal(interaction);
            break;
        }

        case "deleteevent": {
            const id = interaction.options.getString(ID);
            const author = interaction.user.id;

            const query = {
                eventId: id,
                author
            };

            deleteDocument(event, query).then(async (response) => {
                if (response) {
                    const guild = interaction.guild;
                    const channel = guild.channels.cache.get(response.channelId);
                    const msgId = response.msgId;
        
                    try {
                        const eventMsg = await channel.messages.fetch(msgId);
                        eventMsg.delete();
                    } catch (err) {
                        console.error(MSG_DELETION_ERR, err);
                    }
        
                    console.log(DELETE_SUCCESS, JSON.stringify(response));
                    interaction.reply({ content: "Successfully deleted event!", ephemeral: true });
                } else {
                    interaction.reply({ 
                        content: "Cannot delete event **" + id + "**, or given ID is invalid!",
                        ephemeral: true
                    });
                }
            }).catch(err => {
                console.error(DELETE_ERR, err);
                interaction?.reply({ content: ERROR_REPLY, ephemeral: true });
            });
            break;
        }

        case "listevents": {
            eventEmbed.author = {};
            eventEmbed.title = "Events";
            eventEmbed.thumbnail = {};
            eventEmbed.fields = []
            eventEmbed.footer = {};

            const query = {
                guildId: interaction.guild.id
            };

            getDocuments(event, query).then(events => {
                if (events.length > 0) {
                    const eventsSorted = events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
                    eventsSorted.forEach(field => eventEmbed.fields.push({
                        name: "ID: " + field.eventId,
                        value: "Name: " + field.name +
                            "\nDate: " + moment(field.dateTime).format(DAY_MONTH_YEAR_24) + 
                            "\nChannel: " + getChannelName(field.channelId)
                    }));

                    interaction.reply({ embeds: [eventEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: NO_RECORDS, ephemeral: true });
                }
            }).catch(err => {
                console.error(FETCH_ERR, err);
                interaction.reply({ content: ERROR_REPLY, ephemeral: true });
            });

            break;
        }

        default: {
            break;
        }
    }
};

const canCreateNewEvent = async (author, guildId) => {
    const query = {
        author,
        guildId
    };

    return getDocuments(event, query).then(events => {
        if (events.length >= 5) {
            return false;
        }

        return true;
    });
};

const eventModal = (interaction) => {
    const modal = new ModalBuilder()
        .setCustomId(EVENT_MODAL)
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
    const dateTime = moment(date, DAY_MONTH_YEAR_24).format(ISO_8601_24);
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
        interaction.reply({ content: INVALID_LINK, ephemeral: true });
        return false;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        interaction.reply({ content: INVALID_LINK, ephemeral: true });
        return false;
    }
    
    return true;
};

const createEventMsg = async (guild, eventId, author, name, description, date, thumbnail, channelToSend) => {
    const authorData = await guild.members.fetch(author);
    eventEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    };
    eventEmbed.title = name;
    thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
    eventEmbed.fields = [];
    eventEmbed.fields.push({
        name: " ",
        value: moment(date).format(DAY_MONTH_YEAR_24)
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
                .setCustomId(EVENT_BUTTON)
                .setLabel("Join/Leave")
                .setStyle(ButtonStyle.Primary)
        );

    const eventMsg = await channelToSend ? 
        await channelToSend.send({ embeds: [eventEmbed], components: [buttonRow] }) :
        await channel.send({ embeds: [eventEmbed], components: [buttonRow] });

    return eventMsg;
}

const createNewEvent = async (interaction, author, eventName, description, dateTime, repeat, thumbnail, guild) => {
    const eventId = generateId();
    const eventMsg = await createEventMsg(interaction.member.guild, eventId, author, eventName, description, dateTime, thumbnail);
    const eventData = {
        eventId,
        msgId: eventMsg.id,
        author,
        eventName,
        description,
        dateTime,
        repeat,
        thumbnail,
        guildId: guild.id,
        channelId: channel.id
    };

    insertDocuments(event, eventData).then(response => {
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({ 
            content: "New event created successfully! " + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
    })
    .catch(err => {
        console.error(INSERT_FAILURE, err);
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
    });
};

const updateEventMsg = async (interaction, eventData, entries) => {
    const guild = interaction.member.guild;
    const eventChannel = guild.channels.cache.get(eventData.channelId);
    const msg = await eventChannel.messages.fetch(eventData.msgId);
    const authorData = await guild.members.fetch(eventData.author);

    eventEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    };
    eventEmbed.title = eventData.name;
    eventData.thumbnail ? eventEmbed.thumbnail = { url: eventData.thumbnail } : eventEmbed.thumbnail = {};
    eventEmbed.fields = [];
    eventEmbed.fields.push({
        name: " ",
        value: moment(eventData.dateTime).format(DAY_MONTH_YEAR_24)
    });
    if (eventData.description) {
        eventEmbed.fields.push({
            name: " ",
            value: eventData.description
        });
    }
    eventEmbed.fields.push({
        name: "Attendees (" + entries.length + "):",
        value: entries.length > 0 ? entries.map(entry => entry.name).join(", ") : NO_DATA
    });
    eventEmbed.footer = ({ text: "ID: " + eventData.eventId });

    msg.edit({ embeds: [eventEmbed] });
};

export const handleJoinEvent = async (interaction) => {
    const query = {
        msgId: interaction.message.id
    };

    const eventData = await getDocuments(event, query);

    const user = {
        id: interaction.user.id,
        name: interaction.member.nickname ? interaction.member.nickname : interaction.user.username
    };

    if (eventData) {
        let entries = eventData.attendees.entries;
        
        const isExistingEntry = entries.some(entry => entry.id === user.id);

        if (!isExistingEntry) {
            entries.push(user);
        }

        if (isExistingEntry) {
            entries = entries.filter(entry => entry.id !== user.id);
        }

        const filter = { eventId: eventData.eventId };
        const update = { attendees: entries.length };

        //TODO: Delete attendees from collection
        await updateDocument(event, filter, update);
        await updateEventMsg(interaction, eventData, entries);

        interaction.deferUpdate();
    }

    return;
};

export const eventReminderPost = async (client) => {
    const start = moment().startOf("day");
    const end = moment().endOf("day");

    const query = {
        dateTime: {
            "$gte": start, "$lte": end
        }
    };

    const activeEvents = await getDocuments(query);

    for (const eventData of activeEvents) {
        const { eventId, msgId, author, name, description, thumbnail, dateTime, guildId, channelId, attendees } = eventData;
        const guild = await client.guilds.cache.get(guildId);
        const channelToSend = await guild.channels.cache.get(channelId);

        if (!channelToSend) {
            console.log(NO_CHANNEL + eventId);
            continue;
        }

        if (canSendMessageToChannel(guild, channelToSend)) {
            const authorData = await guild.members.fetch(author);

            eventEmbed.author = {
                name: authorData.nickname ? authorData.nickname : authorData.user.username,
                icon_url: authorData.user.avatarURL()
            };
            eventEmbed.title = name;
            thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
            eventEmbed.fields = [];
            eventEmbed.fields.push({
                name: " ",
                value: moment(dateTime).format(DAY_MONTH_YEAR_24)
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
                    NO_DATA
            });
            eventEmbed.footer = ({ text: "ID: " + eventId });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(EVENT_BUTTON)
                        .setLabel("Join/Leave")
                        .setStyle(ButtonStyle.Primary)
                );

            try {
                const originalEventMsg = await channelToSend.messages.fetch(msgId);
                originalEventMsg.delete();
            } catch (error) {
                console.error(MSG_DELETION_ERR, error);
            }

            const eventMsg = await channelToSend.send({ embeds: [eventEmbed], components: [buttonRow] });
            console.log("Event reminder posted", JSON.stringify(eventData));

            await updateEventData(eventId, eventMsg.id);
        }
    }
};

const updateEventData = async (eventId, msgId, newDate) => {
    //Event reminder update
    if (!newDate) {
        updateDocument(eventId, msgId);
    }
    
    //Event repost update
    if (newDate) {
        const update = {
            msgId,
            dateTime: newDate,
            attendees: 0
        };

        updateDocument(eventId, update);
    }

    return;
};

export const eventSummaryPost = async (client) => {
    const findQuery = {
        dateTime: {
            $lte: moment.utc()
        }
    };

    const activeEvents = await getDocuments(event, findQuery);

    for (const eventData of activeEvents) {
        const { eventId, msgId, author, name, description, thumbnail, dateTime, repeat, guildId, channelId, attendees } = eventData;
        const guild = await client.guilds.cache.get(guildId);
        const channelToSend = await guild.channels.cache.get(channelId);

        if (!channelToSend) {
            console.log(NO_CHANNEL + eventId);
            continue;
        }

        if (canSendMessageToChannel(guild, channelToSend)) {
            const authorData = await guild.members.fetch(author);

            eventEmbed.author = {
                name: authorData.nickname ? authorData.nickname : authorData.user.username,
                icon_url: authorData.user.avatarURL()
            },
            eventEmbed.title = name + " started!";
            thumbnail ? eventEmbed.thumbnail = { url: thumbnail } : eventEmbed.thumbnail = {};
            eventEmbed.fields = [];
            eventEmbed.fields.push({
                name: " ",
                value: moment(dateTime).format(DAY_MONTH_YEAR_24)
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
                    NO_DATA
            });

            eventEmbed.footer = {};

            await channelToSend.send({ embeds: [eventEmbed] });
            console.log("Event summary posted", JSON.stringify(eventData));

            if (repeat) {
                let newDate;

                if (repeat === DAILY) {
                    newDate = moment(dateTime).add(1, "d");
                } else if (repeat === WEEKLY) {
                    newDate = moment(dateTime). add(1, "w");
                } else if (repeat === MONTHLY) {
                    newDate = moment(dateTime). add(1, "M");
                } else if (repeat === YEARLY) {
                    newDate = moment(dateTime). add(1, "y");
                }

                try {
                    const eventMsg = await channelToSend.messages.fetch(msgId);
                    eventMsg.delete();
                } catch (error) {
                    console.error(MSG_DELETION_ERR, error);
                }

                const newEventMsg = await createEventMsg(eventId, author, name, description, newDate, thumbnail, channelToSend);
                await updateEventData(eventId, newEventMsg.id, newDate);
            } else {
                const deleteQuery = {
                    eventId,
                    author
                };
                
                deleteDocument(event, deleteQuery).then(async (response) => {
                    try {
                        const eventMsg = await channelToSend.messages.fetch(msgId);
                        eventMsg.delete();
                        console.log(DELETE_SUCCESS, JSON.stringify(response));
                    } catch (err) {
                        console.error(MSG_DELETION_ERR, err);
                    }
                }).catch(err => {
                    console.error(DELETE_ERR, err);
                });
            }
        } else {
            console.log("Cannot send event summary of " + eventId + " to channel: " + channelId);
            continue;
        }
    }
};