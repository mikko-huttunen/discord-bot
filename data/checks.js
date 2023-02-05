import moment from "moment";
import { getPolls, postPollResults, updateVotes } from "../functions/polls.js";
import { getNumberEmotes } from "./emotes.js";
import { postTimedMessages } from "../functions/timed_message.js";

export let reactions = [];
export let removedReactions = [];

export const checkForTimedActions = async (client) => {
    const query = {
        date: {
            $lte: moment.utc()
        }
    }

    await postTimedMessages(client, query);
    await postPollResults(client, query);

    setTimeout( function(){ checkForTimedActions(client); }, 60 * 1000);
}

export const checkReactions = async () => {
    //Create copies of reactions because original arrays needs to be cleared quickly to not miss any incoming reactions
    const currReactions = reactions;
    const currRemovedReactions = removedReactions;
    reactions = [];
    removedReactions = [];

    if (currReactions.length || currRemovedReactions.length) {
        const numberEmojis = getNumberEmotes();
        let pollReactions = [];
        let removedPollReactions = [];

        currReactions.length ? pollReactions = currReactions.filter(reaction => numberEmojis.includes(reaction.reaction._emoji.name)) : false;
        currRemovedReactions.length ? removedPollReactions = currRemovedReactions.filter(reaction => numberEmojis.includes(reaction.reaction._emoji.name)) : false;

        if (pollReactions.length || removedPollReactions.length) await handlePollReactions(pollReactions, removedPollReactions);
    }

    setTimeout( function(){ checkReactions(); }, 10 * 1000);
}

const handlePollReactions = async (pollReactions, removedPollReactions) => {
    await getPolls()
    .then(polls => {
        if (polls.length) {
            polls.forEach(poll => {
                pollReactions.length ? pollReactions.filter(reaction => reaction.reaction.message.id === poll.msgId) : false;
                removedPollReactions.length ? removedPollReactions.filter(reaction => reaction.reaction.message.id === poll.msgId) : false;
                
                if (pollReactions.length || removedPollReactions.length) {
                    updateVotes(pollReactions, removedPollReactions, poll);
                }
            });
        }
    });
}

export const addReaction = (reaction, user) => {
    let filteredReactions = []
    removedReactions.forEach(r => {
        if (r.user.id === user.id && r.reaction.message.id === reaction.message.id && r.reaction._emoji.name === reaction._emoji.name) {
            return;
        }
        filteredReactions.push(r);
    });

    removedReactions = filteredReactions;
}

export const removeReaction = (reaction, user) => {
    let filteredReactions = []
    reactions.forEach(r => {
        if (r.user.id === user.id && r.reaction.message.id === reaction.message.id && r.reaction._emoji.name === reaction._emoji.name) {
            return;
        }
        filteredReactions.push(r);
    });

    reactions = filteredReactions;
}