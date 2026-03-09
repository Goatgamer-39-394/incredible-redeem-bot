const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = ".";
const cooldown = new Map();
const COOLDOWN = 60000;

const gif = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  // ======================
  // GEN COMMAND
  // ======================

  if (command === "gen") {

    const user = message.author.id;

    if (cooldown.has(user)) {

      const timeLeft = (cooldown.get(user) - Date.now()) / 1000;

      if (timeLeft > 0) {

        const embed = new EmbedBuilder()
        .setDescription(`⏳ Please wait **${timeLeft.toFixed(0)} seconds** before generating again.`)
        .setColor("#5865F2")
        .setFooter({ text: "Incredible Services" });

        return message.reply({ embeds: [embed] });
      }
    }

    cooldown.set(user, Date.now() + COOLDOWN);

    const service = args[0];

    if (!service) return;

    const file = `./stock/${service}.txt`;

    if (!fs.existsSync(file)) {

      const embed = new EmbedBuilder()
      .setDescription("❌ Service not found.")
      .setColor("#5865F2")
      .setFooter({ text: "Incredible Services" });

      return message.reply({ embeds: [embed] });
    }

    const accounts = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);

    if (accounts.length === 0) {

      const embed = new EmbedBuilder()
      .setDescription("❌ Stock empty.")
      .setColor("#5865F2")
      .setFooter({ text: "Incredible Services" });

      return message.reply({ embeds: [embed] });
    }

    const account = accounts.shift();

    fs.writeFileSync(file, accounts.join("\n"));

    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

    const embed = new EmbedBuilder()
    .setTitle(`Incredible Gen ${serviceName}`)
    .setDescription(`Thanks for using our service!

Follow these steps:

**Step 1:** Go to the ticket channel  
**Step 2:** Create a ticket  
**Step 3:** Type this command:

\`.redeem ${service} ${account}\`

Thanks for using our service! If it doesn't work ping staff for assistance or replacement.`)
    .setImage(gif)
    .setColor("#5865F2")
    .setFooter({ text: "Incredible Services" });

    try {

      await message.author.send({ embeds: [embed] });

      const sent = new EmbedBuilder()
      .setDescription("📩 Check your DMs.")
      .setColor("#5865F2")
      .setFooter({ text: "Incredible Services" });

      message.reply({ embeds: [sent] });

    } catch {

      const error = new EmbedBuilder()
      .setDescription("❌ I couldn't DM you.")
      .setColor("#5865F2")
      .setFooter({ text: "Incredible Services" });

      message.reply({ embeds: [error] });

    }

  }

  // ======================
  // STOCK COMMAND
  // ======================

  if (command === "stock") {

    const steam = fs.existsSync("./stock/steam.txt")
      ? fs.readFileSync("./stock/steam.txt","utf8").split("\n").filter(Boolean).length
      : 0;

    const minecraft = fs.existsSync("./stock/minecraft.txt")
      ? fs.readFileSync("./stock/minecraft.txt","utf8").split("\n").filter(Boolean).length
      : 0;

    const crunchyroll = fs.existsSync("./stock/crunchyroll.txt")
      ? fs.readFileSync("./stock/crunchyroll.txt","utf8").split("\n").filter(Boolean).length
      : 0;

    const embed = new EmbedBuilder()
    .setTitle("Incredible Stock")
    .setDescription(`
🎮 **Steam**: \`${steam}\`
⛏ **Minecraft**: \`${minecraft}\`
🍿 **Crunchyroll**: \`${crunchyroll}\`
`)
    .setColor("#5865F2")
    .setFooter({ text: "Incredible Services" });

    message.reply({ embeds: [embed] });

  }

});

client.login(process.env.TOKEN);