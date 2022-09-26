import * as dotenv from "dotenv";
dotenv.config();

import imageSearch from "image-search-google";

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
const imageFormats = [".gif", ".jpeg", ".jpg", ".png"];

export const handleSearch = async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(" ") + 1);

    if (msgToLowerCase === "!image " + keyword || msgToLowerCase === "!kuva " + keyword) {
        await client.search(keyword)
        .then(response => {
            if (response.length > 0) {
                const imageUrl = response[Math.floor(Math.random() * response.length)].url;
                console.log("keyword: " + keyword + ", imageUrl: " + imageUrl);

                const fileExt = imageUrl.substring(imageUrl.lastIndexOf("."));

                if (imageFormats.some((format) => format === fileExt)) {
                    if (msg.author.bot) {
                        msg.edit({ 
                            content: "",
                            files: [{
                                attachment: imageUrl,
                                name: "image" + fileExt
                            }] 
                        });
                    } else {
                        msg.reply({
                            files: [{
                                attachment: imageUrl,
                                name: "image" + fileExt
                            }]
                        });
                    }
                } else msg.reply("Sori nyt ei pysty...");
            } else {
                console.log("keyword: " + keyword, "No results");
                msg.reply("Sori nyt ei pysty...");
            }
        })
        .catch(error => {
            console.log(error);
            msg.reply("Sori nyt ei pysty...");
        });
    }
}