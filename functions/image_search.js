import * as dotenv from "dotenv";
dotenv.config();

import imageSearch from "image-search-google";

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
const imageFormats = [".gif", ".jpeg", ".jpg", ".png"];
let validImages = [];

export const handleImageSearch = async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(" ") + 1);

    if (msgToLowerCase === "!image " + keyword || msgToLowerCase === "!kuva " + keyword) {
        await client.search(keyword)
        .then(response => {
            if (response.length > 0) {
                console.log(response);
                response.forEach(image => {
                    var fileExt = image.url.substring(image.url.lastIndexOf("."));
                    if (imageFormats.some((format) => format === fileExt)) {
                        validImages.push(image.url);
                    }
                });

                const imageUrl = validImages[Math.floor(Math.random() * validImages.length)];
                validImages = [];
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
                console.log("keyword: " + keyword, "No results, posting monkey!");
                client.search("monkey")
                .then(response => {
                    if (response.length > 0) {
                        response.forEach(image => {
                            var fileExt = image.url.substring(image.url.lastIndexOf("."));
                            if (imageFormats.some((format) => format === fileExt)) {
                                validImages.push(image.url);
                            }
                        });

                        const imageUrl = validImages[Math.floor(Math.random() * validImages.length)];
                        validImages = [];
                        console.log("keyword: " + keyword + ", imageUrl: " + imageUrl);

                        const fileExt = imageUrl.substring(imageUrl.lastIndexOf("."));

                        if (msg.author.bot) {
                            msg.edit({ 
                                content: "En löytänyt kuvaa antamallasi hakusanalla...\nSaat kuitenkin lohdutukseksi tämän",
                                files: [{
                                    attachment: imageUrl,
                                    name: "image" + fileExt
                                }]
                            });
                        } else {
                            msg.reply({
                                content: "En löytänyt kuvaa antamallasi hakusanalla...\nSaat kuitenkin lohdutukseksi tämän",
                                files: [{
                                    attachment: imageUrl,
                                    name: "image" + fileExt
                                }]
                            });
                        }
                    } else msg.reply("Sori nyt ei pysty...");
                })
                .catch(err => {
                    console.log(err);
                    msg.reply("Jotain meni pieleen...");
                });
            }
        })
        .catch(err => {
            console.log(err);
            msg.reply("Sori nyt ei pysty...");
        });
    } else {
        msg.reply("Anna hakusana esim. !kuva monke");
    }
}