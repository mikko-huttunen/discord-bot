import { INSERT_SUCCESS, INSERT_FAILURE, DELETE_ERR, MSG_DELETION_ERR, UPDATE_ERR, ERROR_REPLY } from "../../../variables/constants.js";
import { event } from "../../../database/schemas/event_schema.js";

export const createEvent = (interaction, eventId, msgId, author, name, description, dateTime, repeat, thumbnail, channelId) => {
    const eventData = { 
        eventId,
        msgId,
        author,
        name,
        description,
        dateTime,
        repeat,
        thumbnail,
        channelId,
        attendees: {
            number: 0,
            entries: []
        }
    };

    new event(eventData)
    .save()
    .then(response => {
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({ content: "Successfully created new event!", ephemeral: true });
    })
    .catch(err => {
        console.error(INSERT_FAILURE, err);
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
    });
};

export const getEvents = async () => {
    return event.find().lean();
};

export const getEventsByUser = async (user) => {
    return event.find({ author: user.id }).lean();
};

export const getEventByMsg = async (msg) => {
    return event.findOne({ msgId: msg.id }).lean();
};

export const getEventsByQuery = async (query) => {
    return event.find(query).lean();
};

export const updateEventData = async (eventId, msgId, newDate) => {
    //Event reminder update
    if (!newDate) {
        event.findOneAndUpdate(
            { eventId },
            { msgId },
            { returnDocument: "after" }
        )
        .then(console.log("Event " + eventId + " msgId updated"))
        .catch(err => {
            console.error(UPDATE_ERR, err);
        });
    }
    
    //Event repost update
    if (newDate) {
        event.findOneAndUpdate(
            { eventId },
            {
                msgId,
                dateTime: newDate,
                "attendees.number": 0,
                "attendees.entries": []
            },
            { returnDocument: "after" }
        )
        .then(console.log("Event " + eventId + " msgId and date updated"))
        .catch(err => {
            console.error(UPDATE_ERR, err);
        });
    }

    return;
};

export const updateEventAttendees = async (eventData, entries) => {
    event.findOneAndUpdate(
        { eventId: eventData.eventId },
        { 
            "attendees.number": entries.length,
            "attendees.entries": entries
        }
    )
    .then(console.log("Event " + eventData.eventId + " attendees updated"))
    .catch(err => {
        console.error(UPDATE_ERR, err);
    });
};

export const deleteEventById = async (eventId, author, interaction) => {
    event.findOneAndDelete({ 
        eventId, 
        author 
    })
    .then(async (response) => {
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

            console.log("Event " + response.eventId + " deleted");
            interaction?.reply({ content: "Successfully deleted event!", ephemeral: true });
        } else {
            interaction?.reply({ 
                content: "Cannot delete event **" + eventId + "**, or given ID is invalid!",
                ephemeral: true
            });
        }
    }).catch(err => {
        console.error(DELETE_ERR, err);
        interaction?.reply({ content: ERROR_REPLY, ephemeral: true });
    });
};

export const deleteEventByMsg = async (msgId) => {
    event.findOneAndDelete({ 
        msgId,
        repeat: ""
    })
    .then(response => {
        if (response) {
            console.log("Event " + response.eventId + " deleted");
        }
    })
    .catch(err => {
        console.error(DELETE_ERR, err);
    });
};