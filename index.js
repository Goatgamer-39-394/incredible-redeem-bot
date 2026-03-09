const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const PREFIX = ".";

const STAFF_ROLE = "1478005454495023104";

const OWNER_IDS = [
"1471837933429325855",
"1358359831140110426",
"1121404311319089153"
];

let stock = {};
let generatedCodes = new Map();
let redeemLog = {};

client.once("ready", () => {
console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {

if (message.author.bot) return;
if (!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

const isStaff =
message.member.roles.cache.has(STAFF_ROLE) ||
OWNER_IDS.includes(message.author.id);



/* ================= HELP ================= */

if (command === "help") {

const embed = new EmbedBuilder()
.setTitle("📜 Help Menu")
.setColor("Blue")
.setDescription(`
.redeem <code>
Redeem a generated code

.help
Show help menu
`);

return message.channel.send({embeds:[embed]});

}



/* ================= STAFF HELP ================= */

if (command === "staffhelp") {

if (!isStaff) return;

const embed = new EmbedBuilder()
.setTitle("🛠 Staff Commands")
.setColor("Orange")
.setDescription(`
.gencode <service>

.addstock <service> <account>

.removestock <service> <account>

.removefirst <service>

.removelast <service>

.removeamount <service> <amount>

.staffstock
Show all stock counts

.staffstock <service>
Show accounts

.dashboard
Full generator overview
`);

return message.channel.send({embeds:[embed]});

}



/* ================= ADD STOCK ================= */

if (command === "addstock") {

if (!isStaff) return message.reply("❌ No permission");

const service = args[0];
const account = args.slice(1).join(" ");

if (!service || !account)
return message.reply("Usage: .addstock <service> <account>");

if (!stock[service]) stock[service] = [];

stock[service].push(account);

message.reply(`✅ Added to **${service}** stock`);

}



/* ================= REMOVE STOCK ================= */

if (command === "removestock") {

if (!isStaff) return;

const service = args[0];
const account = args.slice(1).join(" ");

if (!stock[service])
return message.reply("❌ Service not found");

stock[service] = stock[service].filter(acc => acc !== account);

message.reply("✅ Account removed");

}



/* ================= REMOVE FIRST ================= */

if (command === "removefirst") {

if (!isStaff) return;

const service = args[0];

if (!stock[service] || stock[service].length === 0)
return message.reply("❌ No stock");

stock[service].shift();

message.reply("✅ First account removed");

}



/* ================= REMOVE LAST ================= */

if (command === "removelast") {

if (!isStaff) return;

const service = args[0];

if (!stock[service] || stock[service].length === 0)
return message.reply("❌ No stock");

stock[service].pop();

message.reply("✅ Last account removed");

}



/* ================= REMOVE AMOUNT ================= */

if (command === "removeamount") {

if (!isStaff) return;

const service = args[0];
const amount = parseInt(args[1]);

if (!stock[service])
return message.reply("❌ Service not found");

stock[service].splice(0, amount);

message.reply(`✅ Removed ${amount} accounts`);

}



/* ================= GEN CODE ================= */

if (command === "gencode") {

if (!isStaff) return;

const service = args[0];

if (!stock[service])
return message.reply("❌ Service not found");

const code = Math.random().toString(36).substring(2,10).toUpperCase();

generatedCodes.set(code, service);

message.reply(`🎟 Code generated: **${code}**`);

}



/* ================= REDEEM ================= */

if (command === "redeem") {

const code = args[0];

if (!generatedCodes.has(code))
return message.reply("❌ Invalid code");

const service = generatedCodes.get(code);

if (!stock[service] || stock[service].length === 0)
return message.reply("❌ Out of stock");

const randomIndex = Math.floor(Math.random() * stock[service].length);

const account = stock[service][randomIndex];

generatedCodes.delete(code);

if (!redeemLog[service]) redeemLog[service] = [];

redeemLog[service].push({
user: message.author.username,
account: account
});

const embed = new EmbedBuilder()
.setTitle("🎉 Account Redeemed")
.setColor("Green")
.setDescription(`
Service: **${service}**

Account:
\`${account}\`
`);

message.channel.send({embeds:[embed]});

}



/* ================= STAFF STOCK ================= */

if (command === "staffstock") {

if (!isStaff) return;

const service = args[0];

if (!service) {

let list = "";

for (const s in stock) {
list += `${s} : ${stock[s].length} accounts\n`;
}

const embed = new EmbedBuilder()
.setTitle("📦 Stock Overview")
.setDescription(list || "No stock");

return message.channel.send({embeds:[embed]});

}

if (!stock[service])
return message.reply("❌ Service not found");

const accounts = stock[service].join("\n");

const embed = new EmbedBuilder()
.setTitle(`📦 ${service} Stock`)
.setDescription("```"+accounts+"```");

message.channel.send({embeds:[embed]});

}



/* ================= DASHBOARD ================= */

if (command === "dashboard") {

if (!isStaff) return;

let text = "";

for (const service in stock) {

text += `\n📦 ${service} (${stock[service].length})\n`;

text += "Accounts:\n";

stock[service].forEach(acc=>{
text += `- ${acc}\n`;
});

if (redeemLog[service]) {

text += "\nRedeemed:\n";

redeemLog[service].forEach(r=>{
text += `- ${r.user} → ${r.account}\n`;
});

}

text += "\n---------------------\n";

}

const embed = new EmbedBuilder()
.setTitle("📊 Generator Dashboard")
.setColor("Purple")
.setDescription("```"+text.slice(0,4000)+"```");

message.channel.send({embeds:[embed]});

}

});

client.login(process.env.TOKEN);