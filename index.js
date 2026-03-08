require("dotenv").config();
const fs = require("fs");
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

let stock = {
  steam: [],
  minecraft: [],
  crunchyroll: []
};

function saveStock() {
  fs.writeFileSync("./stock.json", JSON.stringify(stock, null, 2));
}

function loadStock() {
  if (fs.existsSync("./stock.json")) {
    stock = JSON.parse(fs.readFileSync("./stock.json"));
  }
}

loadStock();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // STOCK
  if (command === "stock") {

    const embed = new EmbedBuilder()
      .setTitle("📦 Generator Stock")
      .setColor("Purple")
      .setDescription(
        `Steam: ${stock.steam.length}\n` +
        `Minecraft: ${stock.minecraft.length}\n` +
        `Crunchyroll: ${stock.crunchyroll.length}`
      );

    return message.reply({ embeds: [embed] });
  }

  // ADD STOCK
  if (command === "addstock") {

    const service = args[0];
    if (!stock[service]) return message.reply("Invalid service.");

    const lines = message.content.split("\n").slice(1);

    if (args[1] && args[1].includes(":")) {
      stock[service].push(args[1]);
      saveStock();
      return message.reply("Account added.");
    }

    let added = 0;

    for (const line of lines) {
      if (line.includes(":")) {
        stock[service].push(line.trim());
        added++;
      }
    }

    saveStock();

    return message.reply(`${added} accounts added to ${service}.`);
  }

  // REMOVE STOCK
  if (command === "removestock") {

    const service = args[0];
    const email = args[1];

    if (!stock[service]) return message.reply("Invalid service.");

    const index = stock[service].findIndex(acc => acc.includes(email));

    if (index === -1) return message.reply("Account not found.");

    stock[service].splice(index, 1);
    saveStock();

    return message.reply("Account removed.");
  }

  // STAFF STOCK
  if (command === "staffstock") {

    const service = args[0];

    if (!service) {
      return message.reply(
        `Steam: ${stock.steam.length}\n` +
        `Minecraft: ${stock.minecraft.length}\n` +
        `Crunchyroll: ${stock.crunchyroll.length}`
      );
    }

    if (!stock[service]) return message.reply("Invalid service.");

    return message.reply(stock[service].join("\n") || "No accounts.");
  }

  // GEN
  if (command === "gen") {

    const service = args[0];
    if (!stock[service]) return message.reply("Invalid service.");

    const randomIndex = Math.floor(Math.random() * stock[service].length);
    const account = stock[service][randomIndex];

    try {

      if (account) {
        await message.author.send(
`🎁 ${service.toUpperCase()} ACCOUNT

${account}`
        );
      } else {
        await message.author.send(
`${service.toUpperCase()} account will be available soon.`
        );
      }

    } catch {
      return message.reply("Enable your DMs.");
    }

    const embed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setColor("Green")
      .setDescription(`Success ${message.author}! I've sent the account ${service} details to your DMs.`)
      .setImage("https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif");

    return message.reply({ embeds: [embed] });
  }

});

client.login(process.env.TOKEN);