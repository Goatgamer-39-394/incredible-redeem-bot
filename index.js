require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// ================= SETTINGS =================
const PREFIX = ".";
const OWNER_IDS = [
"1471837933429325855",
"1121404311319089153",
"1358359831140110426"
];

const STAFF_ROLE_ID = "1477887155106746380";

const BANNER_URL = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

let systemEnabled = true;

// ================= STORAGE =================
const stock = {
  steam: [],
  minecraft: [],
  crunchyroll: []
};

const generatedCodes = new Map();
const cooldown = new Map();
const COOLDOWN_TIME = 2 * 60 * 60 * 1000;

// ================= CODE GENERATOR =================
function generateCode(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (message) => {

  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const isOwner = OWNER_IDS.includes(message.author.id);
  const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID) || isOwner;

  // ================= ENABLE =================
  if (command === "enable" && isOwner) {
    systemEnabled = true;
    return message.reply("✅ Redeem system enabled.");
  }

  // ================= DISABLE =================
  if (command === "disable" && isOwner) {
    systemEnabled = false;
    return message.reply("🛑 Redeem system disabled.");
  }

  // ================= OWNER DASHBOARD =================
  if (command === "dashboard") {

    if (!isOwner)
      return message.reply("❌ Owner only.");

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Owner Dashboard")
      .setDescription(
`System: ${systemEnabled ? "ONLINE ✅" : "OFFLINE ❌"}

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`
      )
      .setColor("#ff9900")
      .setFooter({ text: "Incredible Services" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= ADD STOCK =================
  if (command === "addstock") {

    if (!isStaff)
      return message.reply(`❌ Staff only. Required Role ID: ${STAFF_ROLE_ID}`);

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage:\n`.addstock steam email:pass`\n`.addstock steam 3` then paste accounts");

    // MULTIPLE MODE
    if (!args[1]) {
      return message.reply("❌ Provide account or amount.");
    }

    // SINGLE ACCOUNT
    if (args[1].includes(":")) {

      stock[type].push(args[1]);

      return message.reply(`✅ Added **1 ${type}** account.`);
    }

    // MULTIPLE ACCOUNTS
    const amount = parseInt(args[1]);

    if (!isNaN(amount)) {

      const accountsText = message.content.split("\n").slice(1);

      const accounts = accountsText
        .map(a => a.trim())
        .filter(a => a.includes(":"));

      if (accounts.length === 0)
        return message.reply("❌ Paste accounts on new lines.");

      stock[type].push(...accounts);

      return message.reply(`✅ Added **${accounts.length} ${type}** accounts.`);
    }

  }

  // ================= STAFF STOCK =================
  if (command === "staffstock") {

    if (!isStaff)
      return message.reply(`❌ Staff only. Role ID: ${STAFF_ROLE_ID}`);

    const type = args[0]?.toLowerCase();

    if (!type) {

      return message.reply(
`📦 Staff Stock

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`
      );
    }

    if (!stock[type])
      return message.reply("Usage: .staffstock steam/minecraft/crunchyroll");

    if (stock[type].length === 0)
      return message.reply(`❌ No ${type} accounts.`);

    return message.reply(
`📦 ${type.toUpperCase()} Accounts

${stock[type].join("\n")}`
    );
  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription(
`🎮 **STEAM**
🟢 ONLINE
Stock: ${stock.steam.length}

🍿 **CRUNCHYROLL**
🟢 ONLINE
Stock: ${stock.crunchyroll.length}

⛏ **MINECRAFT**
🟢 ONLINE
Stock: ${stock.minecraft.length}

🚀 Use \`.gen steam | minecraft | crunchyroll\``
      )
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= GEN =================
  if (command === "gen") {

    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = message.author.id;
    const now = Date.now();

    if (cooldown.has(cooldownKey)) {

      const expiration = cooldown.get(cooldownKey) + COOLDOWN_TIME;

      if (now < expiration) {

        const timeLeft = expiration - now;

        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);

        return message.reply(`⏳ Wait ${hours}h ${minutes}m before generating again.`);
      }
    }

    cooldown.set(cooldownKey, now);

    const length = type === "steam" ? 3 : type === "minecraft" ? 5 : 6;

    const code = generateCode(length);

    generatedCodes.set(code,type);

    const successEmbed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! I've sent the account **${type}** details to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" })
      .setTimestamp();

    await message.reply({ embeds: [successEmbed] });

    try{

      const embed = new EmbedBuilder()
      .setTitle(`🎁 Incredible Generator`)
      .setDescription(
`Thanks for using **Incredible Services**!

1️⃣ Create a redeem ticket  
2️⃣ Type \`.redeem ${code}\`

Your Code: **${code}**

If it doesn't work ping staff for replacement.`
      )
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" })
      .setTimestamp();

      await message.author.send({ embeds:[embed] });

    }catch{

      message.reply("❌ I cannot DM you.");
    }
  }

  // ================= REDEEM =================
  if (command === "redeem") {

    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    const code = args[0];

    if (!code)
      return message.reply("❌ Provide a code.");

    if (!generatedCodes.has(code))
      return message.reply("❌ Invalid or expired code.");

    const type = generatedCodes.get(code);

    if (stock[type].length === 0)
      return message.reply("❌ Out of stock.");

    const account = stock[type].shift();

    generatedCodes.delete(code);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`\`${account}\``)
      .setColor("Green")
      .setFooter({ text: "Incredible Services" })
      .setTimestamp();

    message.channel.send({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);