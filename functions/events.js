import { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord.js";
import moment from "moment";
import { CHANNEL, DAILY, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, EMPTY, ERROR_REPLY, EVENT_BUTTON, EVENT_MODAL, ID, ISO_8601_24, MAX_EVENTS, MONTHLY, MSG_DELETION_ERR, NO_CHANNEL, NO_DATA, NO_RECORDS, SEND_PERMISSION_ERR, WEEKLY, YEARLY } from "../variables/constants.js";
import { canCreateNew, generateId, getChannelName, getMemberData, getUnicodeEmoji } from "./helpers/helpers.js";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { deleteDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { event } from "../database/schemas/event_schema.js";

const calendarEmoji = getUnicodeEmoji("1F5D3");

export const createEvent = async (interaction) => {
    const guild = interaction.guild;
    const channel = interaction.options.getChannel(CHANNEL);

    if (!await canCreateNew(event, interaction.user.id, guild.id)) {
        interaction.reply({ content: MAX_EVENTS, ephemeral: true });
        return;
    }
    
    if (!await canSendMessageToChannel(guild, channel)) {
        interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
        return;
    }

    eventModal(interaction);

    const filter = i => {
        return i.user.id === interaction.user.id;
    };

    const modalSubmit = interaction.awaitModalSubmit({ time: 300_000, filter });
    const userDateTime = modalSubmit.fields.getTextInputValue("eventDateInput");
    const userRepeat = modalSubmit.fields.getTextInputValue("repeatInput").toLowerCase();

    const eventData = {
        eventId: generateId(),
        author: modalSubmit.user.id,
        eventName: modalSubmit.fields.getTextInputValue("nameInput"),
        description: modalSubmit.fields.getTextInputValue("descriptionInput"),
        thumbnail: modalSubmit.fields.getTextInputValue("thumbnailInput"),
        dateTime: moment(userDateTime, DAY_MONTH_YEAR_24).format(ISO_8601_24),
        repeat: userRepeat,
        guildId: guild.id,
        channelId: channel.id
    };

    if (!isValidDateAndRepetition(interaction, eventData.dateTime, userRepeat)) return;

    const eventMsg = await createEventMessage(eventData, guild);
    eventData.msgId = eventMsg.id;
    const inserted = insertDocuments(event, eventData);
    
    if (!inserted) {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    }

    interaction.reply({ 
        content: "New event created successfully! " + getUnicodeEmoji("1F44D"),
        ephemeral: true
    });
};

export const listEvents = async (interaction) => {
    const events = await getDocuments(event, { guildId: interaction.guild.id });
    
    if (events === "error") {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    } else if (events.length === 0) {
        interaction.reply({ content: NO_RECORDS, ephemeral: true });
        return;
    }

    const eventsSorted = events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    const eventsData = await Promise.all(eventsSorted.map(async e => {
        const author = await getMemberData(e.author, interaction.guild);
        return ({
            name: "ID: " + e.eventId,
            value: `Author: ${author.nickname ? author.nickname : author.user.username}` +
                `\nEvent name: ${e.eventName}`+
                `\nDate: ${moment(e.dateTime).format(DAY_MONTH_YEAR_24)}` + 
                `\nChannel: ${getChannelName(e.channelId)}`
        });
    }));

    const eventEmbed = {
        color: 0x0096FF,
        title: `${calendarEmoji} Events`,
        fields: [...eventsData]
    };

    interaction.reply({ embeds: [eventEmbed], ephemeral: true });
};

export const deleteEvent = async (interaction) => {
    const eventId = interaction.options.getString(ID);
    const author = interaction.user.id;
    const deleted = await deleteDocument(event, { eventId, author });
    
    if (deleted === "error") {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    } else if (!deleted) {
        interaction.reply({ 
            content: "Cannot delete event **" + eventId + "**, or given ID is invalid!",
            ephemeral: true
        });
    }

    const guild = interaction.guild;
    const channel = guild.channels.cache.get(deleted.channelId);
    const msgId = deleted.msgId;

    try {
        const eventMsg = await channel.messages.fetch(msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(MSG_DELETION_ERR, err);
    }

    interaction.reply({ content: "Successfully deleted event!", ephemeral: true });
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

const createEventMessage = async (eventData, guild, eventAttendees) => {
    const author = await getMemberData(eventData.author, guild);

    const eventDate = {
        name: EMPTY,
        value: moment(eventData.dateTime).format(DAY_MONTH_YEAR_24)
    };

    const description = {
        name: EMPTY,
        value: eventData.description
    };

    const numberOfAttendees = () => {
        if (!eventAttendees) return 0;
        return eventAttendees.length;
    };

    const attendees = () => {
        if (!eventAttendees) return NO_DATA;
        return eventAttendees.map(attendee => attendee.name).join(", ");
    }

    const attendeesData = {
        name: `Attendees (${numberOfAttendees}):`,
        value: attendees()
    }
    
    const eventEmbed = {
        color: 0x0096FF,
        author: {
            name: author.nickname ? author.nickname : author.user.username,
            icon_url: author.user.avatarURL()
        },
        title: `${calendarEmoji} ${eventData.eventName}`,
        thumbnail: { url: eventData.thumbnail },
        fields: [eventDate, description, attendeesData],
        footer: ({ text: "ID: " + eventData.eventId })
    };

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(EVENT_BUTTON)
            .setLabel("Join/Leave")
            .setStyle(ButtonStyle.Primary)
    );
    
    const channel = guild.channels.cache.get(eventData.channelId);
    let eventMsg;

    if (eventData.msgId) eventMsg = await channel.messages.fetch(eventData.msgId);
    if (!eventMsg) eventMsg = await channel.send({ embeds: [eventEmbed], components: [buttonRow] });
    else await eventMsg.edit({ embeds: [eventEmbed], components: [buttonRow] });

    return eventMsg;
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