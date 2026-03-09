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

// UPDATED STAFF ROLE
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

  // ================= DASHBOARD =================
  if (command === "dashboard") {

    if (!OWNER_IDS.includes(message.author.id))
      return message.reply("❌ Owner only.");

    const owners = OWNER_IDS.map(id => `<@${id}> (${id})`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("⚙️ OWNER DASHBOARD")
      .setColor("#ff9900")
      .addFields(
        {
          name: "🖥 System",
          value: `Status: ${systemEnabled ? "ONLINE ✅" : "OFFLINE ❌"}
Cooldown: ${COOLDOWN_TIME / 3600000} Hours`,
          inline: false
        },
        {
          name: "📦 Stock",
          value: `Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`,
          inline: false
        },
        {
          name: "👑 Owners",
          value: owners,
          inline: false
        },
        {
          name: "🛠 Staff Role",
          value: `<@&${STAFF_ROLE_ID}>
Role ID: ${STAFF_ROLE_ID}`,
          inline: false
        },
        {
          name: "📊 Generator Stats",
          value: `Active Codes: ${generatedCodes.size}
Cooldown Users: ${cooldown.size}`,
          inline: false
        },
        {
          name: "🤖 Bot Info",
          value: `Bot: ${client.user.tag}
Bot ID: ${client.user.id}`,
          inline: false
        },
        {
          name: "🌐 Server",
          value: `Name: ${message.guild.name}
Server ID: ${message.guild.id}
Members: ${message.guild.memberCount}`,
          inline: false
        }
      )
      .setImage(BANNER_URL)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ================= ADD STOCK =================
  if (command === "addstock") {

    if (
      !message.member.roles.cache.has(STAFF_ROLE_ID) &&
      !OWNER_IDS.includes(message.author.id)
    )
      return message.reply("❌ Staff or Owner only.");

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .addstock steam/minecraft/crunchyroll");

    const lines = message.content.split("\n").slice(1);

    if (args[1] && args[1].includes(":")) {

      stock[type].push(args[1]);

      return message.reply(`✅ Added 1 ${type} account.`);
    }

    if (lines.length > 0) {

      const accounts = lines
        .map(x => x.trim())
        .filter(x => x.includes(":"));

      if (accounts.length === 0)
        return message.reply("❌ Invalid email:pass format");

      stock[type].push(...accounts);

      return message.reply(`✅ Added ${accounts.length} ${type} accounts.`);
    }

    return message.reply(`❌ Example:

Single:
.addstock steam email:pass

Multiple:
.addstock steam 3
email:pass
email:pass
email:pass`);
  }

  // ================= STAFF STOCK =================
  if (command === "staffstock") {

    if (!message.member.roles.cache.has(STAFF_ROLE_ID))
      return message.reply("❌ Staff only.");

    return message.reply(
`📦 Stock

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`
    );
  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription(
`🎮 **STEAM**
Stock: ${stock.steam.length}

🍿 **CRUNCHYROLL**
Stock: ${stock.crunchyroll.length}

⛏ **MINECRAFT**
Stock: ${stock.minecraft.length}

Use \`.gen steam | minecraft | crunchyroll\``
      )
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
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

    const successEmbed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! I've sent the account **${type}** details to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL)
      .setTimestamp();

    await message.reply({ embeds: [successEmbed] });

    try{

      const embed = new EmbedBuilder()
      .setTitle("🎁 Generator Code")
      .setDescription(`Create a redeem ticket then type

.redeem ${code}

Code: **${code}**`)
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
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

    if (!generatedCodes.has(code))
      return message.reply("❌ Invalid code.");

    const type = generatedCodes.get(code);

    if (stock[type].length === 0)
      return message.reply("❌ Out of stock.");

    const account = stock[type].shift();

    generatedCodes.delete(code);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`\`${account}\``)
      .setColor("Green")
      .setTimestamp();

    message.channel.send({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);