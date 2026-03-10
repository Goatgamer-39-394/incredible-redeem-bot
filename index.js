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
const COOLDOWN_TIME = 2*60*60*1000; // 2 hours

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
**User Commands:** .gen, .redeem, .stock, .help
**Staff Commands:** .addstock, .staffstock, .staffhelp, .resetcooldown
**Owner Commands:** .enable, .disable, .dashboard`)
      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= HELP COMMAND =================
  if(command==="help"){
    const embed = new EmbedBuilder()
      .setTitle("📜 User Commands")
      .setDescription(
        "**.gen [steam|minecraft|crunchyroll]** - Generate a code\n" +
        "**.redeem [code]** - Redeem a code\n" +
        "**.stock** - Check available stock\n" +
        "**.help** - Show this help menu"
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
        "**.addstock [type] [email:pass]** - Add account to stock\n" +
        "**.staffstock** - Check staff stock\n" +
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
      return message.reply(`✅ Cooldown for <@${userId}> has been reset.`);
    } else {
      return message.reply(`ℹ️ <@${userId}> is not on cooldown.`);
    }
  }

  // ================= STOCK MANAGEMENT =================
  if(command==="addstock" && isStaff){
    const type=args[0]?.toLowerCase(); if(!["steam","minecraft","crunchyroll"].includes(type)) return message.reply("Usage: .addstock steam email:pass");
    const account=args[1]; if(!account||!account.includes(":")) return message.reply("❌ Invalid format");
    stock[type].push(account); return message.reply(`✅ Added 1 **${type}** account.`);
  }
  if(command==="staffstock" && isStaff){
    return message.reply(`📦 **STAFF STOCK PANEL**\nSteam: ${stock.steam.length}\nMinecraft: ${stock.minecraft.length}\nCrunchyroll: ${stock.crunchyroll.length}\nTotal: ${stock.steam.length+stock.minecraft.length+stock.crunchyroll.length}`);
  }
  if(command==="stock"){
    const embed=new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription("🎮 STEAM: ♾️ INFINITE\n🍿 CRUNCHYROLL: ♾️ INFINITE\n⛏ MINECRAFT: ♾️ INFINITE\n🚀 Use `.gen steam | minecraft | crunchyroll`")
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
  }

  // ================= GENERATE WITH FLASHY LOADING =================
  if(command==="gen"){
    if(!systemEnabled) return message.reply("🛑 System disabled.");
    const type=args[0]?.toLowerCase();
    if(!["steam","minecraft","crunchyroll"].includes(type)) return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey = message.author.id;
    const now = Date.now();
    if(cooldown.has(cooldownKey)){
      const expiration = cooldown.get(cooldownKey);
      if(now < expiration){
        const timeLeft = expiration - now;
        const h = Math.floor(timeLeft/3600000);
        const m = Math.floor((timeLeft%3600000)/60000);
        return message.reply(`⏳ Wait ${h}h ${m}m.`);
      }
    }
    cooldown.set(cooldownKey, now + COOLDOWN_TIME);
    setTimeout(()=>cooldown.delete(cooldownKey), COOLDOWN_TIME);

    const loadingMessage = await message.reply({embeds:[new EmbedBuilder()
      .setTitle("⚡ Generating your code...")
      .setDescription("Initializing...")
      .setImage(BANNER_URL)
      .setFooter({ text:"Thanks for using! Come again soon 😉", iconURL:FOOTER_GIF })
      .setColor("#f1c40f") ]});

    const messages = ["Starting generators...","Crunching numbers...","Code almost ready...","Finalizing...","Almost done..."];
    const emojis = ["🟩","🟨","🟥","🟦","🟪"];
    for(let i=0;i<20;i++){
      const progress = Math.floor((i/20)*100);
      const barLength = 10, filled=Math.floor((progress/100)*barLength), empty=barLength-filled;
      let bar = "";
      for(let j=0;j<filled;j++) bar+=emojis[Math.floor(Math.random()*emojis.length)];
      for(let j=0;j<empty;j++) bar+="⬛";

      const updatedEmbed = new EmbedBuilder()
        .setTitle("⚡ Generating your code...")
        .setDescription(`${messages[Math.floor(Math.random()*messages.length)]}\nProgress: ${bar} ${progress}%`)
        .setColor("#f1c40f")
        .setImage(BANNER_URL)
        .setFooter({ text:"Thanks for using! Come again soon 😉", iconURL:FOOTER_GIF });

      await loadingMessage.edit({embeds:[updatedEmbed]});
      await new Promise(r=>setTimeout(r, Math.floor(Math.random()*200+100)));
    }

    const codeLength = type==="steam"?3:type==="minecraft"?5:6;
    const code = generateCode(codeLength);
    generatedCodes.set(code,type); totalGenerated++;

    const successEmbed = new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! Your **${type} code** has been sent to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL)
      .setFooter({ text:"Thanks for using! Come again soon 😉", iconURL:FOOTER_GIF });

    await loadingMessage.edit({content:"", embeds:[successEmbed]});

    try{
      const dmEmbed = new EmbedBuilder()
        .setTitle("🎁 Incredible Generator")
        .setDescription(`Follow these steps:\n1️⃣ Create a redeem ticket\n2️⃣ Type \`.redeem ${code}\`\nYour Code: **${code}**`)
        .setColor("#8e44ff")
        .setImage(BANNER_URL)
        .setFooter({ text:"Thanks for using! Come again soon 😉", iconURL:FOOTER_GIF });
      await message.author.send({embeds:[dmEmbed]});
    } catch { message.reply("❌ I cannot DM you."); }
  }

  // ================= REDEEM =================
  if(command==="redeem"){
    if(!systemEnabled) return message.reply("🛑 System disabled.");
    const code=args[0]; if(!code) return message.reply("❌ Provide a code.");
    if(!generatedCodes.has(code)) return message.reply("❌ Invalid or expired code.");

    const type=generatedCodes.get(code);
    if(stock[type].length===0) return message.reply("❌ Out of stock.");

    const account = stock[type][Math.floor(Math.random()*stock[type].length)];
    generatedCodes.delete(code); totalRedeemed++;

    const embed = new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`**Your ${type} account**\n\`${account}\`\nIf it doesn't work **ping staff for replacement.**`)
      .setColor("Green")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });

    message.channel.send({embeds:[embed]});
  }

});

client.login(process.env.TOKEN);