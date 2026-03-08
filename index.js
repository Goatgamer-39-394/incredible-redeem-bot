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
const BANNER_URL = "https://your-banner-image-link.com/banner.png";

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

  // ================= ADD STOCK (MULTIPLE OR SINGLE) =================
  if (command === "addstock") {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID))
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();
    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .addstock steam/minecraft/crunchyroll");

    // Extract everything after command + type
    const accountsText = message.content.slice(PREFIX.length + command.length + type.length + 2).trim();

    if (!accountsText)
      return message.reply("❌ You must provide at least one account (email:password).");

    const accounts = accountsText
      .split("\n")
      .map(a => a.trim())
      .filter(a => a.includes(":"));

    if (accounts.length === 0)
      return message.reply("❌ No valid accounts found (must be email:password).");

    stock[type].push(...accounts);
    return message.reply(`✅ Added ${accounts.length} ${type} account(s).`);
  }

  // ================= REMOVE STOCK =================
  if (command === "removestock") {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID))
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
    if (!message.member.roles.cache.has(STAFF_ROLE_ID))
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();
    if (!type) {
      // Show all stock counts
      const embed = new EmbedBuilder()
        .setTitle("📦 Staff Stock Overview")
        .setDescription(
`Steam: ${stock.steam.length} account(s)
Minecraft: ${stock.minecraft.length} account(s)
Crunchyroll: ${stock.crunchyroll.length} account(s)`
        )
        .setColor("#9b59b6")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (!stock[type])
      return message.reply("Usage: .staffstock steam/minecraft/crunchyroll");

    if (stock[type].length === 0)
      return message.reply(`❌ No ${type} accounts.`);

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${type.toUpperCase()} Accounts`)
      .setDescription(stock[type].join("\n"))
      .setColor("#3498db")
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {
    const embed = new EmbedBuilder()
      .setTitle("🎁 Available Services")
      .setDescription(
`Steam - ONLINE ✅
Minecraft - ONLINE ✅
Crunchyroll - ONLINE ✅`
      )
      .setColor("#2ecc71")
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

  // ================= STAFF HELP =================
  if (command === "staffhelp") {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID))
      return message.reply("❌ Staff only.");

    return message.reply(
`🛠 Staff Commands
.addstock
.removestock
.staffstock
.resetcooldown`
    );
  }

  // ================= MEMBER HELP =================
  if (command === "ghelp") {
    return message.reply(
`🎁 Generator Commands
.gen steam
.gen minecraft
.gen crunchyroll
.stock
.redeem CODE`
    );
  }

  // ================= GEN =================
  if (command === "gen") {
    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    const type = args[0]?.toLowerCase();
    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = `${message.author.id}-${type}`;
    const now = Date.now();

    if (cooldown.has(cooldownKey)) {
      const expiration = cooldown.get(cooldownKey) + COOLDOWN_TIME;
      if (now < expiration) {
        const timeLeft = expiration - now;
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);
        return message.reply(`⏳ Wait ${hours}h ${minutes}m before generating ${type} again.`);
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
      .setImage(BANNER_URL)
      .setTimestamp();

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
      .setDescription(`Here is your ${type} account:\n\`${account}\``)
      .setColor("Green")
      .setImage(BANNER_URL)
      .setTimestamp();

    message.channel.send({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);