import * as dotenv from "dotenv";
import videoSearch from "youtube-search";
dotenv.config();

const options = {
  maxResults: 10,
  key: process.env.YOUTUBE_API_KEY,
  type: "video"
};

export const handleVideoSearch = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(" ") + 1);

    if (msgToLowerCase === "!video " + keyword) {
        videoSearch(keyword, options, function(err, results) {
            if(err) {
                msg.reply("Sori nyt ei pysty...");
                return console.log(err);
            }

            if (results.length > 0) {
                console.log("video search:");
                console.log(results[0]);
                msg.reply(results[0].link);
            } else {
                msg.reply("Antamallasi hakusanalla ei löytynyt videoita...\nhttps://www.youtube.com/watch?v=od_PmtmMDV0");
            }
        });
    } else {
        msg.reply("Anna hakusana esim. !video life could be dream");
    }
}
