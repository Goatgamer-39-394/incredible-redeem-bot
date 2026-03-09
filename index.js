const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const PREFIX = ".";
const OWNER_ID = "1471837933429325855";
const ADMIN_ROLE = "1478005454495023104";

/* ========= STOCK ========= */

const stock = {
    netflix: ["user1:pass1","user2:pass2"],
    spotify: ["user3:pass3"],
    steam: ["user4:pass4"]
};

/* ========= CODES ========= */

const codes = {
    FREE100: { service: "netflix", account: "email:pass" },
    TEST123: { service: "spotify", account: "email:pass" }
};

/* ========= BOT READY ========= */

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

/* ========= MESSAGE EVENT ========= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

/* ========= GEN COMMAND ========= */

if (cmd === "gen") {

const services = Object.keys(stock);

if (!services.length) {
    return message.reply("No services available.");
}

const service = services[Math.floor(Math.random() * services.length)];
const accounts = stock[service];

if (!accounts.length) {
    return message.reply("Stock empty.");
}

const account = accounts[Math.floor(Math.random() * accounts.length)];

try {

await message.author.send(
`🎉 **Your Generated Account**

Service: **${service}**

Account:
\`${account}\``
);

const embed = new EmbedBuilder()
.setTitle("Account Generated")
.setDescription(`📩 **Check your DM for the account!**`)
.setColor("Green");

message.channel.send({ embeds: [embed] });

} catch {

message.reply("I couldn't DM you. Enable DMs.");

}

}

/* ========= REDEEM COMMAND ========= */

if (cmd === "redeem") {

const code = args[0];

if (!code) {
    return message.reply("Usage: `.redeem CODE`");
}

if (!codes[code]) {
    return message.reply("❌ Invalid or fake code.");
}

const service = codes[code].service;
const account = codes[code].account;

delete codes[code];

try {

await message.author.send(
`✅ **Code Redeemed**

Service: **${service}**

Account:
\`${account}\``
);

message.reply("📩 Check your DM for the account.");

} catch {

message.reply("Enable DMs first.");

}

}

/* ========= ADDCODE (ADMIN) ========= */

if (cmd === "addcode") {

if (message.author.id !== OWNER_ID &&
!message.member.roles.cache.has(ADMIN_ROLE)) return;

const code = args[0];
const service = args[1];
const account = args.slice(2).join(" ");

if (!code || !service || !account) {
return message.reply("Usage: `.addcode CODE service email:pass`");
}

codes[code] = { service, account };

message.reply("✅ Code added.");

}

/* ========= REMOVECODE ========= */

if (cmd === "removecode") {

if (message.author.id !== OWNER_ID &&
!message.member.roles.cache.has(ADMIN_ROLE)) return;

const code = args[0];

if (!codes[code]) {
return message.reply("Code not found.");
}

delete codes[code];

message.reply("🗑 Code removed.");

}

/* ========= STOCK ADD ========= */

if (cmd === "addstock") {

if (message.author.id !== OWNER_ID &&
!message.member.roles.cache.has(ADMIN_ROLE)) return;

const service = args[0];
const account = args.slice(1).join(" ");

if (!service || !account) {
return message.reply("Usage: `.addstock service email:pass`");
}

if (!stock[service]) stock[service] = [];

stock[service].push(account);

message.reply("📦 Stock added.");

}

/* ========= STOCK VIEW ========= */

if (cmd === "stock") {

let msg = "**Stock List**\n";

for (const s in stock) {
msg += `${s} : ${stock[s].length}\n`;
}

message.reply(msg);

}

});

/* ========= LOGIN ========= */

client.login(process.env.TOKEN);