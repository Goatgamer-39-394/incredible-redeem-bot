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

const COOLDOWN_TIME = 2 * 60 * 60 * 1000;

// ================= CODE GENERATOR =================
function generateCode(length){
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for(let i=0;i<length;i++){
    result += chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return result;
}

// ================= READY =================
client.on("ready",()=>{
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMAND HANDLER =================
client.on("messageCreate", async (message)=>{

  if(!message.guild || message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const isOwner = OWNER_IDS.includes(message.author.id);
  const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID) || isOwner;

  // ================= ENABLE / DISABLE =================
  if(command==="enable" && isOwner){
    systemEnabled=true;
    return message.reply("✅ Redeem system enabled.");
  }

  if(command==="disable" && isOwner){
    systemEnabled=false;
    return message.reply("🛑 Redeem system disabled.");
  }

  // ================= DASHBOARD =================
  if(command==="dashboard" && isOwner){

    const uptime = Math.floor(process.uptime());
    const h = Math.floor(uptime/3600);
    const m = Math.floor((uptime%3600)/60);
    const s = uptime%60;

    const embed = new EmbedBuilder()
      .setTitle("⚙️ OWNER CONTROL PANEL")
      .setDescription(`
**SYSTEM STATUS:** ${systemEnabled ? "🟢 ONLINE":"🔴 OFFLINE"}

**BOT INFO**
Ping: ${client.ws.ping}ms
Uptime: ${h}h ${m}m ${s}s
Servers: ${client.guilds.cache.size}
Users: ${client.users.cache.size}

**STOCK DATABASE**
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}

**GENERATOR STATS**
Generated: ${totalGenerated}
Redeemed: ${totalRedeemed}
Active Codes: ${generatedCodes.size}

**COMMANDS**

User: .gen .redeem .stock .ghelp .67
Staff: .addstock .removestock .staffstock .staffhelp .resetcooldown
Owner: .enable .disable .dashboard
`)
      .setColor("#ff9900")
      .setImage(BANNER_URL)
      .setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

    return message.reply({embeds:[embed]});
  }

  // ================= USER HELP =================
  if(command==="ghelp"){

    const embed = new EmbedBuilder()
      .setTitle("📜 User Commands")
      .setDescription(`
.gen steam | minecraft | crunchyroll
.redeem [code]
.stock
.ghelp
.67
`)
      .setColor("#00ffff")
      .setImage(BANNER_URL)
      .setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

    return message.reply({embeds:[embed]});
  }

  // ================= STAFF HELP =================
  if(command==="staffhelp" && isStaff){

    const embed = new EmbedBuilder()
      .setTitle("📜 Staff Commands")
      .setDescription(`
.addstock [type] [number]
.removestock [type] [account]
.staffstock [type]
.resetcooldown [user_id]
`)
      .setColor("#ff00ff")
      .setImage(BANNER_URL)
      .setFooter({text:"Staff Panel",iconURL:FOOTER_GIF});

    return message.reply({embeds:[embed]});
  }

  // ================= ADD STOCK =================
  if(command==="addstock" && isStaff){

    const type = args[0]?.toLowerCase();
    const count = parseInt(args[1]);

    if(!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("❌ Usage: .addstock [type] [number]");

    const lines = message.content.split("\n").slice(1);

    let added = 0;

    for(const acc of lines){
      if(acc.includes(":")){
        stock[type].push(acc);
        added++;
      }
    }

    return message.reply(`✅ Added ${added} ${type} accounts.`);
  }

  // ================= REMOVE STOCK =================
  if(command==="removestock" && isStaff){

    const type = args[0]?.toLowerCase();
    const account = args[1];

    const index = stock[type]?.indexOf(account);

    if(index === -1) return message.reply("❌ Account not found.");

    stock[type].splice(index,1);

    return message.reply(`✅ Removed account.`);
  }

  // ================= STAFF STOCK =================
  if(command==="staffstock" && isStaff){

    const type = args[0]?.toLowerCase();

    if(type){

      if(stock[type].length===0) return message.reply("No accounts.");

      const embed = new EmbedBuilder()
        .setTitle(`${type.toUpperCase()} STOCK`)
        .setDescription(stock[type].join("\n"))
        .setColor("#00ffff");

      return message.reply({embeds:[embed]});

    }else{

      return message.reply(`
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}
`);
    }
  }

  // ================= RESET COOLDOWN =================
  if(command==="resetcooldown"){

    if(!isStaff && !isOwner) return message.reply("Staff only.");

    const id = args[0];

    if(cooldown.has(id)){
      cooldown.delete(id);
      return message.reply("Cooldown reset.");
    }

    return message.reply("User not on cooldown.");
  }

  // ================= STOCK =================
  if(command==="stock"){

    const embed = new EmbedBuilder()
      .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
      .setDescription(`
STEAM: ♾️
CRUNCHYROLL: ♾️
MINECRAFT: ♾️

Use .gen steam | minecraft | crunchyroll
`)
      .setColor("#8e44ff")
      .setImage(BANNER_URL)
      .setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

    return message.reply({embeds:[embed]});
  }

  // ================= .67 GIF =================
  if(command==="67"){

    if(!isStaff && !isOwner) return message.reply("❌ Staff or owners only.");

    const embed = new EmbedBuilder()
      .setTitle("🎉 67")
      .setColor("#ff66cc")
      .setImage("attachment://67.gif")
      .setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

    return message.reply({
      embeds:[embed],
      files:["./67.gif"]
    });
  }

  // ================= GENERATE =================
  if(command==="gen"){

    if(!systemEnabled) return message.reply("System disabled.");

    const type = args[0]?.toLowerCase();

    if(!["steam","minecraft","crunchyroll"].includes(type))
      return message.reply("Usage: .gen steam | minecraft | crunchyroll");

    const now = Date.now();
    const user = message.author.id;

    if(cooldown.has(user)){
      const expire = cooldown.get(user)+COOLDOWN_TIME;

      if(now<expire){

        const left = expire-now;
        const h = Math.floor(left/3600000);
        const m = Math.floor((left%3600000)/60000);

        return message.reply(`Wait ${h}h ${m}m`);
      }
    }

    cooldown.set(user,now);

    const codeLength = type==="steam"?3:type==="minecraft"?5:6;
    const code = generateCode(codeLength);

    generatedCodes.set(code,type);
    totalGenerated++;

    const loading = new EmbedBuilder()
      .setTitle("⚡ Incredible Generator")
      .setDescription("```Generating...\n[■■□□□□□□] 25%```")
      .setColor("#8e44ff")
      .setImage(BANNER_URL);

    const msg = await message.reply({embeds:[loading]});

    setTimeout(()=>{
      loading.setDescription("```Generating...\n[■■■□□□□□] 40%```");
      msg.edit({embeds:[loading]});
    },800);

    setTimeout(()=>{
      loading.setDescription("```Generating...\n[■■■■■■□□] 75%```");
      msg.edit({embeds:[loading]});
    },1600);

    setTimeout(()=>{
      loading.setDescription("```Generating...\n[■■■■■■■■] 100%```");
      msg.edit({embeds:[loading]});
    },2300);

    setTimeout(async()=>{

      const embed = new EmbedBuilder()
        .setTitle("SUCCESS")
        .setDescription(`Code sent to your DM`)
        .setColor("#57F287");

      await msg.edit({embeds:[embed]});

      try{

        const dm = new EmbedBuilder()
          .setTitle("Your Generator Code")
          .setDescription(`
1. Open redeem ticket
2. Type .redeem ${code}

Code: **${code}**
`)
          .setColor("#8e44ff");

        await message.author.send({embeds:[dm]});

      }catch{
        message.reply("Cannot DM you.");
      }

    },3000);
  }

  // ================= REDEEM =================
  if(command==="redeem"){

    if(!systemEnabled) return message.reply("System disabled.");

    const code = args[0];

    if(!generatedCodes.has(code))
      return message.reply("Invalid code.");

    const type = generatedCodes.get(code);

    if(stock[type].length===0)
      return message.reply("Out of stock.");

    const index = Math.floor(Math.random()*stock[type].length);
    const account = stock[type][index];

    generatedCodes.delete(code);
    totalRedeemed++;

    const embed = new EmbedBuilder()
      .setTitle("Account Redeemed")
      .setDescription(`${account}`)
      .setColor("Green");

    message.channel.send({embeds:[embed]});
  }

});

client.login(process.env.TOKEN);