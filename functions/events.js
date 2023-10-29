import { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord.js";
import moment from "moment";
import { CHANNEL, DAY_MONTH_YEAR_24, EMPTY, ERROR_REPLY, EVENT_BUTTON, EVENT_MODAL, ID, ISO_8601_24, MAX_EVENTS, MSG_NOT_FOUND_ERR, NO_CHANNEL, NO_DATA, NO_RECORDS } from "../variables/constants.js";
import { generateId, getChannelName, getMemberData, getNewDate, getUnicodeEmoji } from "./helpers/helpers.js";
import { canCreateNew, canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
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
    
    if (!await canSendMessageToChannel(guild, channel, interaction)) return;

    eventModal(interaction);

    const filter = i => {
        return i.user.id === interaction.user.id;
    };

    await interaction.awaitModalSubmit({ time: 300_000, filter }).then(async intr => {
        const userDateTime = intr.fields.getTextInputValue("eventDateInput");
        const userRepeat = intr.fields.getTextInputValue("repeatInput").toLowerCase();

        const eventData = {
            eventId: generateId(),
            author: intr.user.id,
            eventName: intr.fields.getTextInputValue("nameInput"),
            description: intr.fields.getTextInputValue("descriptionInput"),
            thumbnail: intr.fields.getTextInputValue("thumbnailInput"),
            dateTime: moment(userDateTime, DAY_MONTH_YEAR_24).format(ISO_8601_24),
            repeat: userRepeat,
            guildId: guild.id,
            channelId: channel.id
        };

        if (!isValidDateAndRepetition(intr, eventData.dateTime, userRepeat)) return;

        const eventMsg = await createEventMessage(eventData, guild);
        eventData.msgId = eventMsg.id;
        const inserted = insertDocuments(event, eventData);
        
        if (!inserted) {
            try {
                eventMsg.delete();
            } catch (error) {
                console.error(MSG_NOT_FOUND_ERR, error);
            }

            intr.reply({ content: ERROR_REPLY, ephemeral: true });
            return;
        }

        intr.reply({ 
            content: `New event created successfully! ${getUnicodeEmoji("1F44D")}`,
            ephemeral: true
        });
    }).catch(console.error);
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
                `\nChannel: ${getChannelName(e.channelId)}`,
            inline: true
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
    const guild = interaction.guild;

    const query = {
        eventId,
        author,
        guildId: guild.id
    };

    const deleted = await deleteDocument(event, query);
    
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

    await deleteManyDocuments(attendee, { eventId });

    const channel = await guild.channels.cache.get(deleted.channelId);
    const msgId = deleted.msgId;

    try {
        const eventMsg = await channel.messages.fetch(msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(MSG_NOT_FOUND_ERR, err);
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

const createEventMessage = async (eventData, guild, eventAttendees, isSummary=false) => {
    const author = await getMemberData(eventData.author, guild);

    const eventTitle = () => {
        if (isSummary) return `${calendarEmoji} ${eventData.eventName} started!`;
        return `${calendarEmoji} ${eventData.eventName}`;
    };

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
    };

    const attendeesData = {
        name: `Attendees (${numberOfAttendees()}):`,
        value: attendees()
    };

    const footer = () => {
        if (isSummary) return;
        return { text: `ID: ${eventData.eventId}` };
    }
    
    const eventEmbed = {
        color: 0x0096FF,
        author: {
            name: author.nickname ? author.nickname : author.user.username,
            icon_url: author.user.avatarURL()
        },
        title: eventTitle(),
        thumbnail: { url: eventData.thumbnail },
        fields: [eventDate, description, attendeesData],
        footer: footer()
    };

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(EVENT_BUTTON)
            .setLabel("Join/Leave")
            .setStyle(ButtonStyle.Primary)
    );
    
    const channel = await guild.channels.cache.get(eventData.channelId);

    if (isSummary) {
        return await channel.send({ embeds: [eventEmbed] });
    }

    let eventMsg;

    try {
        if (eventData.msgId) eventMsg = await channel.messages.fetch(eventData.msgId);
    } catch (error) {
        console.error(MSG_NOT_FOUND_ERR, error);
    }

    if (!eventMsg) return await channel.send({ embeds: [eventEmbed], components: [buttonRow] });
    else return await eventMsg.edit({ embeds: [eventEmbed], components: [buttonRow] });
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

    let attendees = await getDocuments(attendee, { eventId: eventData.eventId });
    
    const isExistingEntry = attendees.some(entry => entry.userId === attendeeData.userId);

    if (!isExistingEntry) {
        await insertDocuments(attendee, attendeeData);
        attendees.push(attendeeData);
    } else if (isExistingEntry) {
        const query = {
            eventId: eventData.eventId,
            userId: attendeeData.userId
        };

        await deleteDocument(attendee, query);
        attendees = attendees.filter(e => e.userId !== attendeeData.userId);
    }

    await createEventMessage(eventData, interaction.guild, attendees);
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

        if (!await canSendMessageToChannel(guild, channel)) {
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
    try {
        const originalEventMsg = await channel.messages.fetch(eventData.msgId);
        originalEventMsg.delete();
    } catch (error) {
        console.error(MSG_NOT_FOUND_ERR, error);
    }

    const newEventMsg = await createEventMessage(eventData, guild, eventAttendees);

    await updateDocument(event, { eventId: eventData.eventId }, { msgId: newEventMsg.id });
    console.log("Event reminder posted for " + eventData.eventId, JSON.stringify(eventData));
};

const handleEventSummary = async (eventData, eventAttendees, guild, channel) => {
    try {
        const eventMsg = await channel.messages.fetch(eventData.msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(MSG_NOT_FOUND_ERR, err);
    }

    await createEventMessage(eventData, guild, eventAttendees, true);
    await deleteManyDocuments(attendee, { eventId: eventData.eventId });

    if (!eventData.repeat) {
        const deleteQuery = {
            eventId: eventData.eventId,
            author: eventData.author
        };
        
        await deleteDocument(event, deleteQuery);
        return;
    }

    //Event is set to repeat so update it's date and clear current attendees
    const newDateTime = getNewDate(eventData.dateTime, eventData.repeat);
    eventData.dateTime = newDateTime;

    const newEventMsg = await createEventMessage(eventData, guild);
    const update = {
        msgId: newEventMsg.id,
        dateTime: newDateTime
    };

    await updateDocument(event, { eventId: eventData.eventId }, update);
};