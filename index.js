const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const prefix = ".";
const TOKEN = "YOUR_BOT_TOKEN_HERE";

const GIF_URL = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

const cooldown = new Map();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= STOCK COMMAND =================
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setColor("#8e44ff")

      .setDescription(
`╔════════════════════╗
🎮 **STEAM**
🟢 ONLINE
Stock: ∞

🍿 **CRUNCHYROLL**
🟢 ONLINE
Stock: ∞

⛏ **MINECRAFT**
🟢 ONLINE
Stock: ∞
╚════════════════════╝

🚀 Use \`.gen steam | minecraft | crunchyroll\``
      )

      .setImage(GIF_URL)
      .setFooter({
        text: "Incredible Services • Free Generator",
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }

  // ================= GENERATE COMMAND =================
  if (command === "gen") {

    const service = args[0];

    if (!service) {
      return message.reply("❌ Please choose a service: `steam`, `minecraft`, or `crunchyroll`");
    }

    // Cooldown system
    const timeout = 10000;

    if (cooldown.has(message.author.id)) {
      const expiration = cooldown.get(message.author.id) + timeout;

      if (Date.now() < expiration) {
        const timeLeft = ((expiration - Date.now()) / 1000).toFixed(1);
        return message.reply(`⏳ Please wait **${timeLeft}s** before generating again.`);
      }
    }

    cooldown.set(message.author.id, Date.now());

    // Example generated account
    const generated = `${service}_user${Math.floor(Math.random()*9999)}:password123`;

    const dmEmbed = new EmbedBuilder()
      .setTitle("🎉 ACCOUNT GENERATED")
      .setColor("#00ff9d")

      .setDescription(
`╔════════════════════╗
SERVICE: ${service.toUpperCase()}
ACCOUNT:
\`${generated}\`
╚════════════════════╝`
      )

      .setImage(GIF_URL)

      .setFooter({
        text: "Incredible Generator",
        iconURL: client.user.displayAvatarURL()
      })

      .setTimestamp();

    const serverEmbed = new EmbedBuilder()
      .setTitle("⚡ ACCOUNT GENERATED")
      .setColor("#8e44ff")

      .setDescription(
`✅ ${message.author}

📩 **Check your DMs for the account!**`
      )

      .setImage(GIF_URL)
      .setTimestamp();

    try {

      await message.author.send({ embeds: [dmEmbed] });

      message.reply({ embeds: [serverEmbed] });

    } catch {

      message.reply("❌ I couldn't DM you. Enable DMs and try again.");
    }
  }

});

client.login(TOKEN);