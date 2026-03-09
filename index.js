const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = ".";
const cooldown = new Map();
const cooldownTime = 60000;

const gif = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // =================
  // GEN COMMAND
  // =================

  if (command === "gen") {

    const user = message.author.id;

    if (cooldown.has(user)) {

      const timeLeft = (cooldown.get(user) - Date.now()) / 1000;

      if (timeLeft > 0) {

        const cdEmbed = new EmbedBuilder()
        .setDescription(`⏳ Please wait **${timeLeft.toFixed(0)} seconds** before generating again.`)
        .setColor("#8A2BE2")
        .setFooter({ text: "Incredible Services" });

        return message.reply({ embeds: [cdEmbed] });
      }
    }

    cooldown.set(user, Date.now() + cooldownTime);

    const service = args[0];

    if (!service) return;

    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

    const code = Math.random().toString(36).substring(2, 7);

    const dmEmbed = new EmbedBuilder()
    .setTitle(`Incredible Gen ${serviceName}`)
    .setDescription(`
Thanks for using **Incredible Services**!

Follow these steps:

**Step 1:** Go to the ticket channel  
**Step 2:** Create a ticket  
**Step 3:** Type this command:

\`.redeem ${service} ${code}\`

Thanks for using our service! If it doesn't work ping staff for assistance or replacement.
`)
    .setImage(gif)
    .setColor("#8A2BE2")
    .setFooter({ text: "Incredible Services" });

    try {

      await message.author.send({ embeds: [dmEmbed] });

      const sent = new EmbedBuilder()
      .setDescription("📩 Check your DMs.")
      .setColor("#8A2BE2")
      .setFooter({ text: "Incredible Services" });

      message.reply({ embeds: [sent] });

    } catch {

      const error = new EmbedBuilder()
      .setDescription("❌ I couldn't DM you. Enable DMs.")
      .setColor("#8A2BE2")
      .setFooter({ text: "Incredible Services" });

      message.reply({ embeds: [error] });

    }

  }

  // =================
  // STOCK COMMAND
  // =================

  if (command === "stock") {

    const stockEmbed = new EmbedBuilder()
    .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
    .setDescription(`
╔══════════════════════╗

🎮 **STEAM**  
🟢 ONLINE  
Stock: ∞  

🍿 **CRUNCHYROLL**  
🟢 ONLINE  
Stock: ∞  

⛏ **MINECRAFT**  
🟢 ONLINE  
Stock: ∞  

╚══════════════════════╝

🚀 Use \`.gen steam | minecraft | crunchyroll\`
`)
    .setColor("#8A2BE2")
    .setFooter({ text: "Incredible Services" });

    message.channel.send({ embeds: [stockEmbed] });

  }

  // =================
  // REDEEM COMMAND
  // =================

  if (command === "redeem") {

    const service = args[0];

    if (!service) return;

    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

    const redeemEmbed = new EmbedBuilder()
    .setTitle("Redeem Successful")
    .setDescription(`
Your **${serviceName}** account has been redeemed.

Enjoy the service!

If there are any issues please **ping staff** for assistance or replacement.
`)
    .setColor("#8A2BE2")
    .setFooter({ text: "Incredible Services" });

    message.channel.send({ embeds: [redeemEmbed] });

  }

});

client.login(process.env.TOKEN);