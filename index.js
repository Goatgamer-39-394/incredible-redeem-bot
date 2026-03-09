const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = ".";

const STAFF_ROLE = "1478005454495023104";
const OWNER_ID = "1471837933429325855";

let stock = {};
let generatedCodes = new Map();
let systemEnabled = true;

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const isStaff = message.member.roles.cache.has(STAFF_ROLE) || message.author.id === OWNER_ID;

  // =========================
  // ADD STOCK
  // =========================
  if (command === "addstock") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];
    const account = args.slice(1).join(" ");

    if (!service || !account)
      return message.reply("Usage: .addstock <service> <account>");

    if (!stock[service]) stock[service] = [];

    stock[service].push(account);

    message.reply(`✅ Added account to **${service}** stock`);
  }

  // =========================
  // REMOVE SPECIFIC ACCOUNT
  // =========================
  if (command === "removestock") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];
    const account = args.slice(1).join(" ");

    if (!stock[service]) return message.reply("❌ Service not found.");

    stock[service] = stock[service].filter(acc => acc !== account);

    message.reply(`✅ Account removed from **${service}**`);
  }

  // =========================
  // REMOVE FIRST
  // =========================
  if (command === "removefirst") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];

    if (!stock[service] || stock[service].length === 0)
      return message.reply("❌ No stock.");

    stock[service].shift();

    message.reply(`✅ First account removed from **${service}**`);
  }

  // =========================
  // REMOVE LAST
  // =========================
  if (command === "removelast") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];

    if (!stock[service] || stock[service].length === 0)
      return message.reply("❌ No stock.");

    stock[service].pop();

    message.reply(`✅ Last account removed from **${service}**`);
  }

  // =========================
  // REMOVE AMOUNT
  // =========================
  if (command === "removeamount") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];
    const amount = parseInt(args[1]);

    if (!stock[service]) return message.reply("❌ Service not found.");

    stock[service].splice(0, amount);

    message.reply(`✅ Removed ${amount} accounts from **${service}**`);
  }

  // =========================
  // GENERATE CODE
  // =========================
  if (command === "gencode") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];

    if (!stock[service])
      return message.reply("❌ Service not found.");

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    generatedCodes.set(code, service);

    message.reply(`🎟 Code generated: **${code}** for **${service}**`);
  }

  // =========================
  // REDEEM
  // =========================
  if (command === "redeem") {

    const code = args[0];

    if (!systemEnabled)
      return message.reply("🛑 System disabled.");

    if (!generatedCodes.has(code))
      return message.reply("❌ Invalid code.");

    const service = generatedCodes.get(code);

    if (!stock[service] || stock[service].length === 0)
      return message.reply("❌ Out of stock.");

    const randomIndex = Math.floor(Math.random() * stock[service].length);
    const account = stock[service][randomIndex];

    generatedCodes.delete(code);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`Service: **${service}**\nAccount: \`${account}\``)
      .setColor("Green");

    message.channel.send({ embeds: [embed] });
  }

  // =========================
  // STAFF STOCK OVERVIEW
  // =========================
  if (command === "staffstock") {

    if (!isStaff) return message.reply("❌ No permission.");

    const service = args[0];

    if (!service) {

      if (Object.keys(stock).length === 0)
        return message.reply("❌ No stock.");

      let list = "";

      for (const s in stock) {
        list += `**${s}** : ${stock[s].length} accounts\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("📦 Staff Stock Overview")
        .setDescription(list)
        .setColor("Blue");

      return message.channel.send({ embeds: [embed] });
    }

    if (!stock[service])
      return message.reply("❌ Service not found.");

    if (stock[service].length === 0)
      return message.reply("❌ No accounts.");

    const accounts = stock[service].join("\n");

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${service} Stock`)
      .setDescription("```" + accounts + "```")
      .setColor("Green");

    message.channel.send({ embeds: [embed] });

  }

});

client.login(process.env.TOKEN);