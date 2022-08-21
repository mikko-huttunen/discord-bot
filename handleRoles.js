const handleRoleMessage = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    switch (msgToLowerCase) {
        case "!role":
            //todo list of role commands
            break;

        case "!role list":
            const serverRoles = msg.guild.roles.cache.map(
                (role) => role.name + "\n"
            );
            msg.reply("roolit: " + serverRoles);
            break;
    }
};

module.exports = { handleRoleMessage };
