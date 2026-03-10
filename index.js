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
  for (let i=0;i<length;i++) result += chars.charAt(Math.floor(Math.random()*chars.length));
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
**MEMORY** RAM: ${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)} MB | Node: ${process.version}`)
      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
    return message.reply({embeds:[embed]});
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

  // ================= GENERATE WITH MATRIX-STYLE LOADING =================
  if(command==="gen"){
    if(!systemEnabled) return message.reply("🛑 System disabled.");
    const type=args[0]?.toLowerCase();
    if(!["steam","minecraft","crunchyroll"].includes(type)) return message.reply("❌ Usage: .gen steam | minecraft | crunchyroll");

    const cooldownKey=message.author.id, now=Date.now();
    if(cooldown.has(cooldownKey)){ const exp=cooldown.get(cooldownKey)+COOLDOWN_TIME; if(now<exp){ const t=exp-now; const h=Math.floor(t/3600000), m=Math.floor((t%3600000)/60000); return message.reply(`⏳ Wait ${h}h ${m}m.`); }}
    cooldown.set(cooldownKey,now);

    const loading=await message.reply("⚡ Booting generator...");

    // ===== MATRIX STYLE LOADING =====
    let lines = [];
    for(let i=0;i<15;i++){ lines.push(""); }
    for(let step=0;step<=100;step+=Math.floor(Math.random()*10+5)){
      for(let l=0;l<lines.length;l++){
        let line="";
        for(let c=0;c<30;c++){ line+=(Math.random()<0.5?"0":"1"); }
        lines[l]=line;
      }
      await loading.edit(`⚡ Generating code...\n\`\`\`\n${lines.join("\n")}\n\`\`\`\nProgress: ${step>100?100:step}%`);
      await new Promise(r=>setTimeout(r,Math.floor(Math.random()*150+50)));
    }

    const codeLength=type==="steam"?3:type==="minecraft"?5:6;
    const code=generateCode(codeLength);
    generatedCodes.set(code,type); totalGenerated++;

    const embed=new EmbedBuilder()
      .setTitle("SUCCESS ✅")
      .setDescription(`Success ${message.author}! Your **${type} code** has been sent to your DMs.`)
      .setColor("#57F287")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });

    await loading.edit({ content:"", embeds:[embed] });

    try{
      const dmEmbed=new EmbedBuilder()
        .setTitle("🎁 Incredible Generator")
        .setDescription(`Follow these steps:\n1️⃣ Create a redeem ticket\n2️⃣ Type \`.redeem ${code}\`\nYour Code: **${code}**`)
        .setColor("#8e44ff")
        .setImage(BANNER_URL)
        .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });
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

    const account=stock[type][Math.floor(Math.random()*stock[type].length)];
    generatedCodes.delete(code); totalRedeemed++;

    const embed=new EmbedBuilder()
      .setTitle("🎉 Account Redeemed")
      .setDescription(`**Your ${type} account**\n\`${account}\`\nIf it doesn't work **ping staff for replacement.**`)
      .setColor("Green")
      .setImage(BANNER_URL)
      .setFooter({ text:"Incredible Services", iconURL:FOOTER_GIF });

    message.channel.send({embeds:[embed]});
  }
});

client.login(process.env.TOKEN);