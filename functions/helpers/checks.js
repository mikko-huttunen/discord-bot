import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { postEvent } from "../events.js";
import { handlePollReaction, postPollResults } from "../polls.js";
import { postScheduledMessages } from "../scheduled_messages.js";
import { DAILY, DISTANT_DATE, EXPIRED_DATE, INVALID_DATE, INVALID_REPEAT, ISO_8601_24, MIDDAY, MIDNIGHT, MONTHLY, NEVER, WEEKLY, YEARLY } from "../../variables/constants.js";
import { getNumberEmojis } from "./helpers.js";
import { getDocuments } from "../../database/mongodb_service.js";

export const checkForTimedActions = async (client) => {
    await postScheduledMessages(client);
    await postPollResults(client);

    let query = {
        dateTime: {
            $lte: moment.utc()
        }
    };

    await postEvent(client, "summary", query);

    if (moment().format("HH:mm") === MIDNIGHT || moment().format("HH:mm") === MIDDAY) {
        const start = moment().startOf("day");
        const end = moment().endOf("day");

        query = {
            dateTime: {
                "$gte": start, "$lte": end
            }
        };

        await postEvent(client, "reminder", query);
    }

    setTimeout( function(){ checkForTimedActions(client); }, 60 * 1000);
};

export const checkIfPollReaction = async (reaction, user, action) => {
    const numberEmojis = getNumberEmojis();

    if (numberEmojis.includes(reaction.emoji.name)) {
        await handlePollReaction(reaction, user, action);
    }
};

export const canSendMessageToChannel = async (guild, channel) => {
    if (!guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        return false;
    }

    return true
};

export const canCreateNew = async (collection, author, guildId) => {
    const documents = await getDocuments(collection, { author, guildId });
    if (documents.length >= 5) {
        return false;
    }

    return true;
};

export const isValidDateAndRepetition = (interaction, dateTime, repeat) => {
    if (!moment(dateTime, "YYYY/MM/DD").isValid()) {
        interaction.reply({ content: INVALID_DATE, ephemeral: true });
        return false;
    }

    const currentDateTime = moment().format(ISO_8601_24);
    if (moment(dateTime).isSameOrBefore(currentDateTime)) {
        interaction.reply({ content: EXPIRED_DATE, ephemeral: true });
        return false;
    } else if (moment(dateTime).isAfter(moment(currentDateTime).add(1, "years"))) {
        interaction.reply({ content: DISTANT_DATE, ephemeral: true });
        return false;
    }

    if (repeat !== "" && repeat !== NEVER && repeat !== DAILY && repeat !== WEEKLY && repeat !== MONTHLY && repeat !== YEARLY) {
        interaction.reply({ content: INVALID_REPEAT, ephemeral: true });
        return false;
    }

    return true;
};