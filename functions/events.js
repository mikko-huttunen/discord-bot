import { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord.js";
import moment from "moment";
import { CHANNEL, DAY_MONTH_YEAR_24, EMPTY, ERROR_REPLY, EVENT_BUTTON, EVENT_MODAL, ID, ISO_8601_24, MAX_EVENTS, MSG_DELETION_ERR, NO_CHANNEL, NO_DATA, NO_RECORDS, SEND_PERMISSION_ERR } from "../variables/constants.js";
import { canCreateNew, generateId, getChannelName, getMemberData, getNewDate, getUnicodeEmoji } from "./helpers/helpers.js";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { deleteDocument, deleteManyDocuments, findOneDocument, getDocuments, insertDocuments, updateDocument } from "../database/mongodb_service.js";
import { event } from "../database/schemas/event_schema.js";
import { attendee } from "../database/schemas/attendee_schema.js";

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

    const modalSubmit = await interaction.awaitModalSubmit({ time: 300_000, filter });
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

    if (!isValidDateAndRepetition(modalSubmit, eventData.dateTime, userRepeat)) return;

    const eventMsg = await createEventMessage(eventData, guild);
    eventData.msgId = eventMsg.id;
    const inserted = insertDocuments(event, eventData);
    
    if (!inserted) {
        try {
            eventMsg.delete();
        } catch (error) {
            console.error(MSG_DELETION_ERR, error);
        }

        modalSubmit.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    }

    modalSubmit.reply({ 
        content: `New event created successfully! ${getUnicodeEmoji("1F44D")}`,
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
        fields: eventsData
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
            content: `Cannot delete event **${eventId}**, or given ID is invalid!`,
            ephemeral: true
        });
        return;
    }

    const query = {
        eventId,
        userId: author
    };
    await deleteManyDocuments(attendee, query);

    const guild = interaction.guild;
    const channel = guild.channels.cache.get(deleted.channelId);
    const msgId = deleted.msgId;

    try {
        const eventMsg = await channel.messages.fetch(msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(MSG_DELETION_ERR, err);
    }

    interaction.reply({ 
        content: `Event deleted successfully! ${getUnicodeEmoji("1F44D")}`, 
        ephemeral: true
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
        if (!eventAttendees.length) return 0;
        return eventAttendees.length;
    };

    const attendees = () => {
        if (!eventAttendees.length) return NO_DATA;
        return eventAttendees.map(attendee => attendee.name).join(", ");
    }

    const attendeesData = {
        name: `Attendees (${numberOfAttendees()}):`,
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
        footer: ({ text: `ID: ${eventData.eventId}` })
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

const createEventSummaryMessage = async (eventData, guild, channel) => {
    const authorData = await getMemberData(eventData.author, guild);

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
};

export const handleJoinEvent = async (interaction) => {
    const eventData = await findOneDocument(event, { msgId: interaction.message.id });
    if (!eventData) {
        interaction.reply({
            content: "Event you tried to join is no longer valid.",
            ephemeral: true
        });
        return;
    }

    const attendeeData = {
        guildId: interaction.guild.id,
        eventId: eventData.eventId,
        userId: interaction.user.id,
        name: interaction.member.nickname ? interaction.member.nickname : interaction.user.username
    };

    let entries = await getDocuments(attendee, { eventId: eventData.eventId });
    
    const isExistingEntry = entries.some(entry => entry.userId === attendeeData.userId);

    if (!isExistingEntry) {
        await insertDocuments(attendee, attendeeData);
        entries.push(attendeeData);
    } else if (isExistingEntry) {
        const query = {
            eventId: eventData.eventId,
            userId: attendeeData.userId
        };

        await deleteDocument(attendee, query);
        entries = entries.filter(e => e.userId !== attendeeData.userId);
    }

    await createEventMessage(eventData, interaction.guild, entries);
    interaction.deferUpdate();
};

export const postEvent = async (client, postType, query) => {
    const activeEvents = await getDocuments(event, query);

    for (const eventData of activeEvents) {
        const { eventId, guildId, channelId } = eventData;
        const guild = await client.guilds.cache.get(guildId);
        const channel = await guild.channels.cache.get(channelId);

        if (!channel) {
            console.log(NO_CHANNEL + eventId);
            await deleteDocument(event, { eventId });
            await deleteManyDocuments(attendee, { eventId });
            continue;
        }

        if (!canSendMessageToChannel(guild, channel)) {
            console.log(`Cannot post event reminder of ${eventId} to channel: ${channelId}`);
            await deleteDocument(event, { eventId });
            await deleteManyDocuments(attendee, { eventId });
            continue;
        }

        const eventAttendees = await getDocuments(attendee, { eventId });

        if (postType === "reminder") await handleEventReminder(eventData, eventAttendees, guild, channel) 
        else if (postType === "summary") await handleEventSummary(eventData, eventAttendees, guild, channel);
    }
};

const handleEventReminder = async (eventData, eventAttendees, guild, channel) => {
    const newEventMsg = await createEventMessage(eventData, guild, eventAttendees);
    console.log("Event reminder posted for " + eventData.eventId, JSON.stringify(eventData));

    try {
        const originalEventMsg = await channel.messages.fetch(eventData.msgId);
        originalEventMsg.delete();
    } catch (error) {
        console.error(MSG_DELETION_ERR, error);
    }

    await updateDocument(event, { eventId: eventData.eventId }, { msgId: newEventMsg.id });
};

const handleEventSummary = async (eventData, eventAttendees, guild, channel) => {
    await createEventSummaryMessage(eventData, eventAttendees, guild, channel);

    if (!repeat) {
        const deleteQuery = {
            eventId: eventData.eventId,
            author: eventData.author
        };
        
        await deleteDocument(event, deleteQuery);
        await deleteManyDocuments(attendee, { eventId: eventData.eventId });

        try {
            const eventMsg = await channel.messages.fetch(eventData.msgId);
            eventMsg.delete();
        } catch (err) {
            console.error(MSG_DELETION_ERR, err);
        }

        return;
    }

    //Event is set to repeat so update it's date and clear current attendees
    const newDateTime = getNewDate(eventData.dateTime, repeat);

    try {
        const eventMsg = await channel.messages.fetch(eventData.msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(MSG_DELETION_ERR, err);
    }

    eventData.dateTime = newDateTime;
    eventData.msgId = null;

    await deleteManyDocuments(attendee, { eventId: eventData.eventId });
    const newEventMsg = await createEventMessage(eventData, guild, eventAttendees);
    const update = {
        msgId: newEventMsg.id,
        dateTime: newDateTime
    };

    await updateDocument(event, { eventId: eventData.eventId }, update);
};