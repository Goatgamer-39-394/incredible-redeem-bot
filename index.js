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
const OWNER_IDS = ["1471837933429325855","1121404311319089153","1358359831140110426"];
const STAFF_ROLE_ID = "1465398987094888510";
const BANNER_URL = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";
const FOOTER_GIF = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";
const GIF_67 = "https://media.tenor.com/3349401281762803381.gif";

let systemEnabled = true;

// ================= STORAGE =================
const stock = { steam: [], minecraft: [], crunchyroll: [] };
const generatedCodes = new Map();
const cooldown = new Map();
let totalGenerated = 0;
let totalRedeemed = 0;
const COOLDOWN_TIME = 2*60*60*1000;

// ================= CODE GENERATOR =================
function generateCode(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for(let i=0;i<length;i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// ================= READY =================
client.on("ready", ()=>console.log(`Logged in as ${client.user.tag}`));

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (message)=>{
  if(!message.guild || message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isOwner = OWNER_IDS.includes(message.author.id);
  const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID) || isOwner;

  // ================= ENABLE/DISABLE =================
  if(command==="enable" && isOwner){ systemEnabled=true; return message.reply("✅ Redeem system enabled."); }
  if(command==="disable" && isOwner){ systemEnabled=false; return message.reply("🛑 Redeem system disabled."); }

  // ================= DASHBOARD =================
  if(command==="dashboard" && isOwner){
    const uptime = Math.floor(process.uptime());
    const h = Math.floor(uptime/3600), m = Math.floor((uptime%3600)/60), s = uptime%60;
    const embed = new EmbedBuilder()
      .setTitle("⚙️ OWNER CONTROL PANEL")
      .setDescription(`**SYSTEM STATUS**: ${systemEnabled?"🟢 ONLINE":"🔴 OFFLINE"}
**BOT INFO** Ping: ${client.ws.ping}ms | Uptime: ${h}h ${m}m ${s}s | Servers: ${client.guilds.cache.size} | Users: ${client.users.cache.size}
**STOCK DATABASE** Steam: ${stock.steam.length} | Minecraft: ${stock.minecraft.length} | Crunchyroll: ${stock.crunchyroll.length} | Total: ${stock.steam.length+stock.minecraft.length+stock.crunchyroll.length}
**GENERATOR STATS** Active Codes: ${generatedCodes.size} | Generated: ${totalGenerated} | Redeemed: ${totalRedeemed} | Cooldown: ${COOLDOWN_TIME/3600000}h | Users on cooldown: ${cooldown.size}
**PERMISSIONS** Owners: ${OWNER_IDS.map(id=>`<@${id}>`).join(", ")} | Staff Role: <@&${STAFF_ROLE_ID}>
**ALL COMMANDS**
**User Commands:** .gen, .redeem, .stock, .ghelp, .67
**Staff Commands:** .addstock, .removestock, .staffstock, .staffhelp, .resetcooldown
**Owner Commands:** .enable, .disable, .dashboard`)
      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= USER HELP =================
  if(command==="ghelp"){
    const embed = new EmbedBuilder()
      .setTitle("📜 User Commands")
      .setDescription(
        "**.gen [steam|minecraft|crunchyroll]** - Generate a code\n" +
        "**.redeem [code]** - Redeem a code\n" +
        "**.stock** - Check stock\n" +
        "**.ghelp** - Show this help menu\n" +
        "**.67** - Staff/Owner Video!"
      )
      .setColor("#00ffff")
      .setImage(BANNER_URL)
      .setFooter({ text:"Thanks for using! Come again soon 😉", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= STAFF HELP =================
  if(command==="staffhelp" && isStaff){
    const embed = new EmbedBuilder()
      .setTitle("📜 Staff Commands")
      .setDescription(
        "**.addstock [type] [number]** - Add multiple accounts (one per line after command)\n" +
        "**.removestock [type] [email:pass]** - Remove account\n" +
        "**.staffstock [type]** - Show all accounts or counts if no type\n" +
        "**.staffhelp** - Show this menu\n" +
        "**.resetcooldown [user_id]** - Reset cooldown for a user"
      )
      .setColor("#ff00ff")
      .setImage(BANNER_URL)
      .setFooter({ text:"Staff only 😉", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= RESET COOLDOWN =================
  if(command==="resetcooldown"){
    if(!isStaff && !isOwner) return message.reply("❌ Staff or owners only.");
    const userId = args[0];
    if(!userId) return message.reply("❌ Usage: .resetcooldown <user_id>");
    if(cooldown.has(userId)){
      cooldown.delete(userId);
      return message.reply(`✅ Cooldown for user ${userId} has been reset.`);
    } else {
      return message.reply(`ℹ️ User ${userId} is not on cooldown.`);
    }
  }

  // ================= ADD STOCK =================
  if(command==="addstock" && isStaff){
    const type = args[0]?.toLowerCase();
    const count = parseInt(args[1]);
    if(!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .addstock [type] [number]");
    if(isNaN(count) || count<1) return message.reply("❌ Provide a valid number.");
    const lines = message.content.split("\n").slice(1);
    if(lines.length !== count) return message.reply(`❌ Expected ${count} accounts.`);
    let added = 0;
    for(const acc of lines){
      if(acc.includes(":")){
        stock[type].push(acc);
        added++;
      }
    }
    return message.reply(`✅ Added ${added} **${type}** accounts to stock.`);
  }

  // ================= REMOVE STOCK =================
  if(command==="removestock" && isStaff){
    const type = args[0]?.toLowerCase();
    const account = args[1];
    const index = stock[type]?.indexOf(account);
    if(index === -1) return message.reply("❌ Account not found.");
    stock[type].splice(index,1);
    return message.reply(`✅ Removed 1 **${type}** account.`);
  }

  // ================= STAFF STOCK =================
  if(command==="staffstock" && isStaff){
    const type = args[0]?.toLowerCase();
    if(type){
      if(stock[type].length === 0) return message.reply("ℹ️ No accounts.");
      const embed = new EmbedBuilder()
        .setTitle(`📦 ${type.toUpperCase()} STOCK`)
        .setDescription(stock[type].join("\n"))
        .setColor("#00ffff")
        .setFooter({ text:"Staff Stock Viewer", iconURL:FOOTER_GIF });
      return message.reply({embeds:[embed]});
    } else {
      return message.reply(`Steam: ${stock.steam.length}\nMinecraft: ${stock.minecraft.length}\nCrunchyroll: ${stock.crunchyroll.length}`);
    }
  }

  // ================= PUBLIC STOCK =================
  if(command==="stock"){
    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription("🎮 STEAM: ♾️ INFINITE\n🍿 CRUNCHYROLL: ♾️ INFINITE\n⛏ MINECRAFT: ♾️ INFINITE\n🚀 Use `.gen steam | minecraft | crunchyroll`")
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= .67 COMMAND =================
  if(command==="67"){
    if(!isStaff && !isOwner) return message.reply("❌ Staff or owners only.");

    const embed = new EmbedBuilder()
      .setTitle("🎉 67 Video")
      .setDescription("Enjoy this!")
      .setColor("#ff66cc")
      .setFooter({ text:"Staff & Owner Exclusive!", iconURL:FOOTER_GIF });

    return message.reply({
      embeds:[embed],
      files:["./67-67-kid.mp4"]
    });
  }

  // ================= GENERATE =================
  if(command==="gen"){
    if(!systemEnabled) return message.reply("🛑 System disabled.");
    const type = args[0]?.toLowerCase();
    if(!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = message.author.id;
    const now = Date.now();

    if(cooldown.has(cooldownKey)){
      const expiration = cooldown.get(cooldownKey)+COOLDOWN_TIME;
      if(now < expiration){
        const timeLeft = expiration-now;
        const h = Math.floor(timeLeft/3600000);
        const m = Math.floor((timeLeft%3600000)/60000);
        return message.reply(`⏳ Wait ${h}h ${m}m.`);
      }
    }

    cooldown.set(cooldownKey, now);

    const codeLength = type==="steam"?3:type==="minecraft"?5:6;
    const code = generateCode(codeLength);
    generatedCodes.set(code,type);
    totalGenerated++;

    const embed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! I've sent the **${type} code** to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL)
      .setFooter({ text:"Thank you for using! Come again 😉", iconURL:FOOTER_GIF });

    await message.reply({ embeds:[embed] });

    try{
      const dmEmbed = new EmbedBuilder()
        .setTitle("🎁 Incredible Generator")
        .setDescription(`Follow steps:\n1️⃣ Create redeem ticket\n2️⃣ Type \`.redeem ${code}\`\n\nYour Code: **${code}**`)
        .setColor("#8e44ff")
        .setImage(BANNER_URL);

      await message.author.send({ embeds:[dmEmbed] });
    }catch{
      message.reply("❌ I cannot DM you.");
    }
  }

  // ================= REDEEM =================
  if(command==="redeem"){
    if(!systemEnabled) return message.reply("🛑 System disabled.");

    const code = args[0];
    if(!generatedCodes.has(code)) return message.reply("❌ Invalid or expired code.");

    const type = generatedCodes.get(code);
    if(stock[type].length===0) return message.reply("❌ Out of stock.");

    const randomIndex = Math.floor(Math.random()*stock[type].length);
    const account = stock[type][randomIndex];

    generatedCodes.delete(code);
    totalRedeemed++;

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`**Your ${type} account**\n\`${account}\``)
      .setColor("Green")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });

    message.channel.send({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);