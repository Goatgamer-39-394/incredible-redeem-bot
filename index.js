require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.DirectMessages
]
});

const PREFIX=".";

const OWNER_IDS=[
"1471837933429325855",
"1121404311319089153",
"1358359831140110426"
];

const STAFF_ROLE_ID="1465398987094888510";

const BANNER_URL="https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";
const FOOTER_GIF="https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

let systemEnabled=true;

const stock={
steam:[],
minecraft:[],
crunchyroll:[]
};

const generatedCodes=new Map();
const cooldown=new Map();

let totalGenerated=0;
let totalRedeemed=0;

const COOLDOWN_TIME=2*60*60*1000;

function generateCode(length){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let result="";
for(let i=0;i<length;i++){
result+=chars.charAt(Math.floor(Math.random()*chars.length));
}
return result;
}

client.once("ready",()=>{
console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate",async(message)=>{

if(!message.guild) return;
if(message.author.bot) return;
if(!message.content.startsWith(PREFIX)) return;

const args=message.content.slice(PREFIX.length).trim().split(/ +/);
const command=args.shift().toLowerCase();

const isOwner=OWNER_IDS.includes(message.author.id);
const isStaff=message.member.roles.cache.has(STAFF_ROLE_ID)||isOwner;

if(command==="enable" && isOwner){
systemEnabled=true;
return message.reply("✅ Generator enabled.");
}

if(command==="disable" && isOwner){
systemEnabled=false;
return message.reply("🛑 Generator disabled.");
}

if(command==="dashboard" && isOwner){

const uptime=Math.floor(process.uptime());
const h=Math.floor(uptime/3600);
const m=Math.floor((uptime%3600)/60);
const s=uptime%60;

const embed=new EmbedBuilder()
.setTitle("⚙️ OWNER CONTROL PANEL")
.setColor("#ff9900")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
SYSTEM
Status: ${systemEnabled ? "🟢 ONLINE":"🔴 OFFLINE"}

BOT
Ping: ${client.ws.ping}ms
Uptime: ${h}h ${m}m ${s}s

STOCK
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}

GENERATOR
Generated: ${totalGenerated}
Redeemed: ${totalRedeemed}
Active Codes: ${generatedCodes.size}
`);

return message.reply({embeds:[embed]});
}

if(command==="ghelp"){

const embed=new EmbedBuilder()
.setTitle("📜 User Commands")
.setColor("#00ffff")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
.gen steam | minecraft | crunchyroll
.redeem [code]
.stock
.ghelp
`);

return message.reply({embeds:[embed]});
}

if(command==="staffhelp" && isStaff){

const embed=new EmbedBuilder()
.setTitle("📜 Staff Commands")
.setColor("#ff00ff")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
.addstock [type] email:pass
.removestock [type] email:pass
.staffstock
.resetcooldown [user_id]
`);

return message.reply({embeds:[embed]});
}

if(command==="addstock" && isStaff){

const type=args[0]?.toLowerCase();
const accounts=args.slice(1);

if(!stock[type]) return message.reply("Invalid type.");

let added=0;

for(const acc of accounts){
if(acc.includes(":")){
stock[type].push(acc);
added++;
}
}

return message.reply(`Added ${added} ${type} account(s).`);
}

if(command==="removestock" && isStaff){

const type=args[0]?.toLowerCase();
const account=args[1];

const index=stock[type]?.indexOf(account);

if(index===-1) return message.reply("Account not found.");

stock[type].splice(index,1);

return message.reply("Account removed.");
}

if(command==="staffstock" && isStaff){

const embed=new EmbedBuilder()
.setTitle("📦 STOCK")
.setColor("#00ffff")
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}
`);

return message.reply({embeds:[embed]});
}

if(command==="resetcooldown" && isStaff){

const id=args[0];

if(cooldown.has(id)){
cooldown.delete(id);
return message.reply("Cooldown reset.");
}

return message.reply("User not on cooldown.");
}

if(command==="stock"){

const embed=new EmbedBuilder()
.setTitle("⚡ INCREDIBLE GENERATOR STOCK")
.setColor("#8e44ff")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
STEAM: ♾️
CRUNCHYROLL: ♾️
MINECRAFT: ♾️

Use .gen steam | minecraft | crunchyroll
`);

return message.reply({embeds:[embed]});
}

if(command==="67"){

if(!isStaff) return message.reply("Staff only.");

const embed=new EmbedBuilder()
.setTitle("🎉 67")
.setColor("#ff66cc")
.setImage("attachment://67.gif")
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF});

return message.reply({
embeds:[embed],
files:["./67.gif"]
});
}

if(command==="gen"){

if(!systemEnabled) return message.reply("Generator disabled.");

const type=args[0]?.toLowerCase();

if(!stock[type]) return message.reply("Usage: .gen steam | minecraft | crunchyroll");

const user=message.author.id;
const now=Date.now();

if(cooldown.has(user)){
const expire=cooldown.get(user)+COOLDOWN_TIME;

if(now<expire){
const left=expire-now;
const h=Math.floor(left/3600000);
const m=Math.floor((left%3600000)/60000);
return message.reply(`Wait ${h}h ${m}m`);
}
}

cooldown.set(user,now);

const codeLength=type==="steam"?3:type==="minecraft"?5:6;
const code=generateCode(codeLength);

generatedCodes.set(code,type);
totalGenerated++;

const loading=new EmbedBuilder()
.setTitle("⚡ Incredible Generator")
.setColor("#8e44ff")
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription("```Initializing generator...\n[░░░░░░░░░░] 0%```");

const msg=await message.reply({embeds:[loading]});

setTimeout(()=>{loading.setDescription("```Connecting...\n[██░░░░░░░░] 25%```");msg.edit({embeds:[loading]});},700);
setTimeout(()=>{loading.setDescription("```Decrypting...\n[████░░░░░░] 50%```");msg.edit({embeds:[loading]});},1400);
setTimeout(()=>{loading.setDescription("```Finalizing...\n[███████░░░] 75%```");msg.edit({embeds:[loading]});},2100);
setTimeout(async()=>{

const embed=new EmbedBuilder()
.setTitle("✅ Success")
.setColor("#57F287")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`${message.author} check your DMs for your **${type} code**.`);

await msg.edit({embeds:[embed]});

const dm=new EmbedBuilder()
.setTitle("🎁 Incredible Generator")
.setColor("#8e44ff")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
1️⃣ Create redeem ticket
2️⃣ Type .redeem ${code}

Your Code: **${code}**
`);

message.author.send({embeds:[dm]});

},2800);
}

if(command==="redeem"){

if(!systemEnabled) return message.reply("System disabled.");

const code=args[0];

if(!generatedCodes.has(code)) return message.reply("Invalid code.");

const type=generatedCodes.get(code);

if(stock[type].length===0) return message.reply("Out of stock.");

const index=Math.floor(Math.random()*stock[type].length);
const account=stock[type][index];

generatedCodes.delete(code);
totalRedeemed++;

const loading=new EmbedBuilder()
.setTitle("⚡ Redeeming Account")
.setColor("#8e44ff")
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription("```Starting redeem...\n[░░░░░░░░░░] 0%```");

const msg=await message.reply({embeds:[loading]});

setTimeout(()=>{loading.setDescription("```Verifying code...\n[██░░░░░░░░] 25%```");msg.edit({embeds:[loading]});},700);
setTimeout(()=>{loading.setDescription("```Checking stock...\n[████░░░░░░] 50%```");msg.edit({embeds:[loading]});},1400);
setTimeout(()=>{loading.setDescription("```Finalizing...\n[███████░░░] 75%```");msg.edit({embeds:[loading]});},2100);

setTimeout(()=>{

const embed=new EmbedBuilder()
.setTitle("🎉 Account Redeemed")
.setColor("Green")
.setImage(BANNER_URL)
.setFooter({text:"Incredible Services",iconURL:FOOTER_GIF})
.setDescription(`
Here is your **${type}** account
\`${account}\`

Please contact staff if not working.

Enjoy your account  
Thank you for using the gen  
Vouch the bot if you want
`);

msg.edit({embeds:[embed]});

},2800);
}

});

client.login(process.env.TOKEN);