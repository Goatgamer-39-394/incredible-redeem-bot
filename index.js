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

client.once("ready", () => {

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

  // ================= DASHBOARD =================
  if (command === "dashboard") {

    if (!isOwner)
      return message.reply("❌ Owner only.");

    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()

      .setTitle("⚙️ GENERATOR DASHBOARD")

      .setDescription(`
**System Status**
${systemEnabled ? "🟢 ONLINE" : "🔴 OFFLINE"}

**Bot Info**
Ping: ${client.ws.ping}ms
Uptime: ${hours}h ${minutes}m

**Stock**
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}

**Generated Codes**
Active Codes: ${generatedCodes.size}

**Cooldown**
${COOLDOWN_TIME / 3600000} Hours

**Permissions**
Owners: ${OWNER_IDS.length}
Staff Role: <@&${STAFF_ROLE_ID}>
`)

      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" });

    return message.reply({ embeds: [embed] });

  }

  // ================= ADD STOCK =================
  if (command === "addstock") {

    if (!isStaff)
      return message.reply(`❌ Staff only.`);

    const type = args[0]?.toLowerCase();

    if (!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("Usage: .addstock steam email:pass");

    const account = args[1];

    if (!account || !account.includes(":"))
      return message.reply("❌ Invalid account format.");

    stock[type].push(account);

    return message.reply(`✅ Added 1 ${type} account.`);

  }

  // ================= STAFF STOCK =================
  if (command === "staffstock") {

    if (!isStaff)
      return message.reply("❌ Staff only.");

    return message.reply(`
📦 Staff Stock

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}
`);

  }

  // ================= PUBLIC STOCK =================
  if (command === "stock") {

    const embed = new EmbedBuilder()

      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")

      .setDescription(`
🎮 **STEAM**
Stock: ${stock.steam.length}

🍿 **CRUNCHYROLL**
Stock: ${stock.crunchyroll.length}

⛏ **MINECRAFT**
Stock: ${stock.minecraft.length}

Use \`.gen steam | minecraft | crunchyroll\`
`)

      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text: "Incredible Services" });

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

    const loading = new EmbedBuilder()

      .setTitle("⚙️ Generating Account")

      .setDescription(`
Generating **${type}**

\`\`\`
[░░░░░░░░░░] 0%
\`\`\`
`)

      .setColor("#f1c40f")
      .setImage(BANNER_URL);

    const loadingMsg = await message.reply({ embeds:[loading] });

    setTimeout(async () => {

      const embed2 = new EmbedBuilder()

        .setTitle("⚙️ Generating Account")

        .setDescription(`
Generating **${type}**

\`\`\`
[████░░░░░░] 40%
\`\`\`
`)

        .setColor("#f1c40f")
        .setImage(BANNER_URL);

      await loadingMsg.edit({ embeds:[embed2] });

    },1000);

    setTimeout(async () => {

      const embed3 = new EmbedBuilder()

        .setTitle("⚙️ Generating Account")

        .setDescription(`
Generating **${type}**

\`\`\`
[████████░░] 80%
\`\`\`
`)

        .setColor("#f1c40f")
        .setImage(BANNER_URL);

      await loadingMsg.edit({ embeds:[embed3] });

    },2000);

    setTimeout(async () => {

      const length = type === "steam" ? 3 : type === "minecraft" ? 5 : 6;

      const code = generateCode(length);

      generatedCodes.set(code,type);

      const success = new EmbedBuilder()

        .setTitle("SUCCESS ✅")

        .setDescription(`Code sent to your DMs`)

        .setColor("#57F287")
        .setImage(BANNER_URL);

      await loadingMsg.edit({ embeds:[success] });

      try{

        const embed = new EmbedBuilder()

          .setTitle("🎁 Incredible Generator")

          .setDescription(`
Create a ticket and type:

.redeem **${code}**
`)

          .setColor("#8e44ff")
          .setImage(BANNER_URL);

        await message.author.send({ embeds:[embed] });

      }catch{

        message.reply("❌ I cannot DM you.");

      }

    },3000);

  }

  // ================= REDEEM =================
  if (command === "redeem") {

    const code = args[0];

    if (!generatedCodes.has(code))
      return message.reply("❌ Invalid code.");

    const type = generatedCodes.get(code);

    if (stock[type].length === 0)
      return message.reply("❌ Out of stock.");

    const randomIndex = Math.floor(Math.random() * stock[type].length);

    const account = stock[type][randomIndex];

    generatedCodes.delete(code);

    const embed = new EmbedBuilder()

      .setTitle("🎉 Account Redeemed")

      .setDescription(`
${type} account:

\`${account}\`
`)

      .setColor("Green")
      .setImage(BANNER_URL);

    message.channel.send({ embeds:[embed] });

  }

});

client.login(process.env.TOKEN);