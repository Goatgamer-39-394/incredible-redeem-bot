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

const STAFF_ROLE_ID = "1465398987094888510";

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

let totalGenerated = 0;
let totalRedeemed = 0;

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

    if (!isOwner) return message.reply("❌ Owner only.");

    const uptime = Math.floor(process.uptime());

    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const embed = new EmbedBuilder()

      .setTitle("⚙️ OWNER CONTROL PANEL")

      .setDescription(`
**SYSTEM STATUS**
Status: ${systemEnabled ? "🟢 ONLINE" : "🔴 OFFLINE"}

**BOT INFO**
Ping: ${client.ws.ping}ms
Uptime: ${hours}h ${minutes}m ${seconds}s
Servers: ${client.guilds.cache.size}
Users: ${client.users.cache.size}

**STOCK DATABASE**
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}

Total Accounts: ${stock.steam.length + stock.minecraft.length + stock.crunchyroll.length}

**GENERATOR STATS**
Active Codes: ${generatedCodes.size}
Generated Codes: ${totalGenerated}
Redeemed Accounts: ${totalRedeemed}

Cooldown Time: ${COOLDOWN_TIME / 3600000} hours
Users on Cooldown: ${cooldown.size}

**PERMISSIONS**
Owners: ${OWNER_IDS.map(id => `<@${id}>`).join(", ")}

Staff Role: <@&${STAFF_ROLE_ID}>

**SYSTEM MEMORY**
RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
Node Version: ${process.version}
`)
      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" });

    return message.reply({ embeds: [embed] });
  }

  // ================= ADD STOCK =================
  if (command === "addstock") {

    if (!isStaff)
      return message.reply("❌ Staff only.");

    const type = args[0]?.toLowerCase();

    if (!["steam", "minecraft", "crunchyroll"].includes(type))
      return message.reply("Usage: .addstock steam email:pass");

    const account = args[1];

    if (!account || !account.includes(":"))
      return message.reply("❌ Invalid format (email:pass)");

    stock[type].push(account);

    return message.reply(`✅ Added 1 **${type}** account.`);
  }

  // ================= STAFF STOCK =================
  if (command === "staffstock") {

    if (!isStaff)
      return message.reply("❌ Staff only.");

    return message.reply(`
📦 **STAFF STOCK PANEL**

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}

Total: ${stock.steam.length + stock.minecraft.length + stock.crunchyroll.length}
`);
  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription(`
🎮 **STEAM**
Stock: ♾️ INFINITE

🍿 **CRUNCHYROLL**
Stock: ♾️ INFINITE

⛏ **MINECRAFT**
Stock: ♾️ INFINITE

🚀 Use \`.gen steam | minecraft | crunchyroll\`
`)
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" });

    return message.reply({ embeds: [embed] });
  }

  // ================= GENERATE =================
  if (command === "gen") {

    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    const type = args[0]?.toLowerCase();

    if (!["steam", "minecraft", "crunchyroll"].includes(type))
      return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = message.author.id;
    const now = Date.now();

    if (cooldown.has(cooldownKey)) {

      const expiration = cooldown.get(cooldownKey) + COOLDOWN_TIME;

      if (now < expiration) {

        const timeLeft = expiration - now;

        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);

        return message.reply(`⏳ Wait ${hours}h ${minutes}m.`);
      }
    }

    cooldown.set(cooldownKey, now);

    const codeLength = type === "steam" ? 3 : type === "minecraft" ? 5 : 6;

    const code = generateCode(codeLength);

    generatedCodes.set(code, type);

    totalGenerated++;

    const embed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! I've sent the **${type} code** to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL);

    await message.reply({ embeds: [embed] });

    try {

      const dmEmbed = new EmbedBuilder()
        .setTitle("🎁 Incredible Generator")
        .setDescription(`
Follow these steps:

1️⃣ Create a redeem ticket  
2️⃣ Type \`.redeem ${code}\`

Your Code: **${code}**
`)
        .setColor("#8e44ff")
        .setImage(BANNER_URL);

      await message.author.send({ embeds: [dmEmbed] });

    } catch {

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

    const randomIndex = Math.floor(Math.random() * stock[type].length);
    const account = stock[type][randomIndex];

    // ACCOUNT NOT REMOVED (staff remove manually)

    generatedCodes.delete(code);

    totalRedeemed++;

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`
**Your ${type} account**

\`${account}\`

If it doesn't work **ping staff for replacement.**
`)
      .setColor("Green")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" });

    message.channel.send({ embeds: [embed] });
  }

});

client.login(process.env.TOKEN);