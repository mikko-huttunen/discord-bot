import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { bot } from "../../bot/bot.js";
import { eventReminderPost, eventSummaryPost } from "../events/events.js";
import { handlePollReaction, postPollResults } from "../polls/polls.js";
import { postTimedMessages } from "../timed_messages/timed_message.js";
import { DAILY, DISTANT_DATE, EXPIRED_DATE, INVALID_DATE, INVALID_REPEAT, ISO_8601_24, MONTHLY, NEVER, WEEKLY, YEARLY } from "../../variables/constants.js";
import { getNumberEmojis } from "./helpers.js";

export const checkForTimedActions = async (client) => {
    await postTimedMessages(client);
    await postPollResults(client);
    await eventSummaryPost(client);

    if (moment().format("HH:mm") === "00:00" || moment().format("HH:mm") === "12:00") {
        await eventReminderPost(client);
    }

    setTimeout( function(){ checkForTimedActions(client); }, 60 * 1000);
}

export const checkReaction = async (reaction, user) => {
    const numberEmojis = getNumberEmojis();

    if (numberEmojis.includes(reaction._emoji.name)) {
        await handlePollReaction(reaction, user);
    }
}

export const canSendMessageToChannel = async (member, channel) => {
    if (!member.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        return false;
    }

    return true
}

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
}