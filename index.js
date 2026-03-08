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

const STAFF_ROLE_IDS = [
  "1477887155106746380",
  "1465398987094888510"
];

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

// ================= PERMISSION CHECK =================
function isStaff(member, userId) {
  return (
    OWNER_IDS.includes(userId) ||
    STAFF_ROLE_IDS.some(role => member.roles.cache.has(role))
  );
}

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

client.on("messageCreate", async (message) => {

  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= ENABLE =================
  if (command === "enable" && OWNER_IDS.includes(message.author.id)) {
    systemEnabled = true;
    return message.reply("✅ Redeem system enabled.");
  }

  // ================= DISABLE =================
  if (command === "disable" && OWNER_IDS.includes(message.author.id)) {
    systemEnabled = false;
    return message.reply("🛑 Redeem system disabled.");
  }

  // ================= OWNER DASHBOARD =================
  if (command === "dashboard") {
    if (!OWNER_IDS.includes(message.author.id))
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
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= CLEAR STOCK =================
  if (command === "clearstock") {

    if (!OWNER_IDS.includes(message.author.id))
      return message.reply("❌ Owner only.");

    const type = args[0];

    if (!stock[type])
      return message.reply("Usage: .clearstock steam/minecraft/crunchyroll");

    stock[type] = [];

    return message.reply(`🗑 Cleared ${type} stock.`);
  }

  // ================= ADD STOCK =================
  if (command === "addstock") {

    if (!isStaff(message.member, message.author.id))
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .addstock steam/minecraft/crunchyroll");

    const accountsText = message.content.slice(PREFIX.length + command.length + type.length + 2).trim();

    if (!accountsText)
      return message.reply("❌ Provide accounts.");

    const accounts = accountsText
      .split("\n")
      .map(a => a.trim())
      .filter(a => a.includes(":"));

    if (accounts.length === 0)
      return message.reply("❌ Invalid format (email:password)");

    stock[type].push(...accounts);

    return message.reply(`✅ Added ${accounts.length} ${type} account(s).`);
  }

  // ================= REMOVE STOCK =================
  if (command === "removestock") {

    if (!isStaff(message.member, message.author.id))
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();
    const email = args[1];

    if (!stock[type])
      return message.reply("Usage: .removestock steam/minecraft/crunchyroll email");

    const index = stock[type].findIndex(acc => acc.startsWith(email + ":"));

    if (index === -1)
      return message.reply("❌ Account not found.");

    const removed = stock[type].splice(index,1)[0];

    return message.reply(`🗑 Removed ${removed}`);
  }

  // ================= STAFF STOCK =================
  if (command === "staffstock") {

    if (!isStaff(message.member, message.author.id))
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();

    if (!type) {

      const embed = new EmbedBuilder()
        .setTitle("📦 Staff Stock Overview")
        .setDescription(
`Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`
        )
        .setColor("#9b59b6");

      return message.reply({ embeds: [embed] });
    }

    if (!stock[type])
      return message.reply("Usage: .staffstock steam/minecraft/crunchyroll");

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${type.toUpperCase()} Accounts`)
      .setDescription(stock[type].join("\n"))
      .setColor("#3498db");

    return message.reply({ embeds: [embed] });
  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setColor("#8e44ff")
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription(
`╔════════════════════════╗

🎮 **STEAM**
🟢 ONLINE
Stock: **${stock.steam.length || "∞"}**

🍿 **CRUNCHYROLL**
🟢 ONLINE
Stock: **${stock.crunchyroll.length || "∞"}**

⛏ **MINECRAFT**
🟢 ONLINE
Stock: **${stock.minecraft.length || "∞"}**

╚════════════════════════╝

🚀 Use \`.gen steam | minecraft | crunchyroll\``
      )
      .setImage(BANNER_URL)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= RESET COOLDOWN =================
  if (command === "resetcooldown") {

    if (!OWNER_IDS.includes(message.author.id))
      return message.reply("❌ Owner only.");

    const user =
      message.mentions.users.first() ||
      await client.users.fetch(args[0]).catch(()=>null);

    if (!user)
      return message.reply("Usage: .resetcooldown @user");

    ["steam","minecraft","crunchyroll"].forEach(type=>{
      cooldown.delete(`${user.id}-${type}`);
    });

    return message.reply(`✅ Cooldowns reset for ${user.tag}`);
  }

  // ================= GEN =================
  if (command === "gen") {

    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = `${message.author.id}-${type}`;
    const now = Date.now();

    if (cooldown.has(cooldownKey)) {

      const expiration = cooldown.get(cooldownKey) + COOLDOWN_TIME;

      if (now < expiration) {

        const timeLeft = expiration - now;
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);

        return message.reply(`⏳ Wait ${hours}h ${minutes}m`);
      }
    }

    cooldown.set(cooldownKey, now);

    const length = type === "steam" ? 3 : type === "minecraft" ? 5 : 6;
    const code = generateCode(length);

    generatedCodes.set(code,type);

    const embed = new EmbedBuilder()
      .setTitle(`🎁 Incredible Gen ${type}`)
      .setDescription(
`1️⃣ Create a redeem ticket
2️⃣ Type .redeem ${code}

Your Code: **${code}**`
      )
      .setColor("#8e44ff")
      .setImage(BANNER_URL);

    await message.reply("📩 Check your DMs!");

    try{
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

    if (!generatedCodes.has(code))
      return message.reply("❌ Invalid code.");

    const type = generatedCodes.get(code);

    if (stock[type].length === 0)
      return message.reply("❌ Out of stock.");

    const account = stock[type].shift();

    generatedCodes.delete(code);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`Here is your ${type} account:\n\`${account}\``)
      .setColor("Green")
      .setImage(BANNER_URL);

    message.channel.send({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);