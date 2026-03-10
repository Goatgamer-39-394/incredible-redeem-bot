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

  // ================= .67 GIF =================
  if(command==="67"){
    if(!isStaff && !isOwner) return message.reply("❌ Staff or owners only.");

    const embed = new EmbedBuilder()
      .setTitle("🎉 67")
      .setColor("#ff66cc")
      .setImage("attachment://67.gif")
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });

    return message.reply({
      embeds:[embed],
      files:["./67.gif"]
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

    const loadingEmbed = new EmbedBuilder()
      .setTitle("⚡ Incredible Generator")
      .setDescription("```Generating account...\n[■■□□□□□□] 25%```")
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

    const msg = await message.reply({embeds:[loadingEmbed]});

    setTimeout(async()=>{
      loadingEmbed.setDescription("```Generating account...\n[■■■□□□□□] 40%```");
      await msg.edit({embeds:[loadingEmbed]});
    },800);

    setTimeout(async()=>{
      loadingEmbed.setDescription("```Generating account...\n[■■■■■■□□] 75%```");
      await msg.edit({embeds:[loadingEmbed]});
    },1600);

    setTimeout(async()=>{
      loadingEmbed.setDescription("```Generating account...\n[■■■■■■■■] 100%```");
      await msg.edit({embeds:[loadingEmbed]});
    },2300);

    setTimeout(async()=>{

      const embed = new EmbedBuilder()
        .setTitle("SUCCESS ✅")
        .setDescription(`Success ${message.author}! I've sent the **${type} code** to your DMs.`)
        .setColor("#57F287")
        .setImage(BANNER_URL)
        .setFooter({ text:"Thank you for using! Come again 😉", iconURL:FOOTER_GIF });

      await msg.edit({ embeds:[embed] });

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

    },3000);
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