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

const PREFIX = ".";

const OWNER_IDS = [
 "1471837933429325855",
 "1121404311319089153",
 "1358359831140110426"
];

const STAFF_ROLE_ID = "1465398987094888510";

const BANNER_URL = "https://cdn.discordapp.com/attachments/1474387569818079395/1476581540740726979/lv_0_20260226193526.gif";

let systemEnabled = true;

const stock = {
 steam: [],
 minecraft: [],
 crunchyroll: []
};

const generatedCodes = new Map();
const cooldown = new Map();
const COOLDOWN_TIME = 2 * 60 * 60 * 1000;

function isStaff(member){
 return member.roles.cache.has(STAFF_ROLE_ID) || OWNER_IDS.includes(member.id);
}

function generateCode(length){
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
 let result = "";

 for(let i=0;i<length;i++){
  result += chars.charAt(Math.floor(Math.random()*chars.length));
 }

 return result;
}

client.on("ready",()=>{
 console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async(message)=>{

if(!message.guild) return;
if(message.author.bot) return;
if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

if(command === "enable" && OWNER_IDS.includes(message.author.id)){
 systemEnabled = true;
 return message.reply("✅ Redeem system enabled.");
}

if(command === "disable" && OWNER_IDS.includes(message.author.id)){
 systemEnabled = false;
 return message.reply("🛑 Redeem system disabled.");
}

if(command === "dashboard"){

 if(!OWNER_IDS.includes(message.author.id))
 return message.reply("❌ Owner only.");

 const embed = new EmbedBuilder()
 .setTitle("⚙️ Owner Dashboard")
 .setDescription(
`System: ${systemEnabled ? "ONLINE ✅" : "OFFLINE ❌"}

Steam: ${stock.steam.length}
Minecraft: ${stock.minecraft.length}
Crunchyroll: ${stock.crunchyroll.length}`
 )
 .setColor("#ff9900");

 return message.reply({embeds:[embed]});
}

if(command === "clearstock"){

 if(!OWNER_IDS.includes(message.author.id))
 return message.reply("❌ Owner only.");

 const type = args[0];

 if(!stock[type])
 return message.reply("Usage: .clearstock steam/minecraft/crunchyroll");

 stock[type] = [];

 return message.reply(`🗑 Cleared ${type} stock.`);
}

if(command === "addstock"){

 if(!isStaff(message.member))
 return message.reply("❌ Staff only.");

 const type = args[0]?.toLowerCase();

 if(!["steam","minecraft","crunchyroll"].includes(type))
 return message.reply("Usage:\n.addstock steam email:pass");

 const lines = message.content.split("\n").slice(1);

 let accounts = [];

 if(lines.length > 0){
  accounts = lines.filter(a=>a.includes(":"));
 }else{
  const single = args[1];
  if(single && single.includes(":")) accounts.push(single);
 }

 if(accounts.length === 0)
 return message.reply("❌ Invalid accounts.");

 stock[type].push(...accounts);

 return message.reply(`✅ Added ${accounts.length} ${type} account(s).`);
}

if(command === "removestock"){

 if(!isStaff(message.member))
 return message.reply("❌ Staff only.");

 const type = args[0];
 const account = args.slice(1).join(" ");

 if(!stock[type])
 return message.reply("Usage: .removestock steam email:pass");

 const index = stock[type].findIndex(acc => acc === account);

 if(index === -1)
 return message.reply("❌ Account not found.");

 stock[type].splice(index,1);

 return message.reply(`🗑 Removed account from ${type}.`);
}

if(command === "removefirst"){

 if(!isStaff(message.member))
 return message.reply("❌ Staff only.");

 const type = args[0];

 if(!stock[type] || stock[type].length === 0)
 return message.reply("❌ No stock.");

 const removed = stock[type].shift();

 return message.reply(`🗑 Removed first ${type} account:\n${removed}`);
}

if(command === "removelast"){

 if(!isStaff(message.member))
 return message.reply("❌ Staff only.");

 const type = args[0];

 if(!stock[type] || stock[type].length === 0)
 return message.reply("❌ No stock.");

 const removed = stock[type].pop();

 return message.reply(`🗑 Removed last ${type} account:\n${removed}`);
}

if(command === "removeamount"){

 if(!isStaff(message.member))
 return message.reply("❌ Staff only.");

 const type = args[0];
 const amount = parseInt(args[1]);

 if(!stock[type])
 return message.reply("Usage: .removeamount steam 5");

 if(isNaN(amount))
 return message.reply("❌ Invalid amount.");

 stock[type].splice(0,amount);

 return message.reply(`🗑 Removed ${amount} ${type} accounts.`);
}

if(command === "stock"){

 const embed = new EmbedBuilder()
 .setColor("#8e44ff")
 .setTitle("⚡ INCREDIBLE GENERATOR STOCK")
 .setDescription(
`╔════════════════════╗

🎮 **STEAM**
🟢 ONLINE
Stock: **${stock.steam.length || "∞"}**

🍿 **CRUNCHYROLL**
🟢 ONLINE
Stock: **${stock.crunchyroll.length || "∞"}**

⛏ **MINECRAFT**
🟢 ONLINE
Stock: **${stock.minecraft.length || "∞"}**

╚════════════════════╝

🚀 Use \`.gen steam | minecraft | crunchyroll\``
 )
 .setImage(BANNER_URL);

 return message.reply({embeds:[embed]});
}

if(command === "gen"){

 if(!systemEnabled)
 return message.reply("🛑 System disabled.");

 const type = args[0]?.toLowerCase();

 if(!["steam","minecraft","crunchyroll"].includes(type))
 return message.reply("Usage: .gen steam | minecraft | crunchyroll");

 const cooldownKey = `${message.author.id}-${type}`;
 const now = Date.now();

 if(cooldown.has(cooldownKey)){

 const expiration = cooldown.get(cooldownKey) + COOLDOWN_TIME;

 if(now < expiration){

 const timeLeft = expiration - now;
 const hours = Math.floor(timeLeft / 3600000);
 const minutes = Math.floor((timeLeft % 3600000) / 60000);

 return message.reply(`⏳ Wait ${hours}h ${minutes}m`);
 }

 }

 cooldown.set(cooldownKey, now);

 const length = type === "steam" ? 3 : type === "minecraft" ? 5 : 6;
 const code = generateCode(length);

 generatedCodes.set(code,type);

 const successEmbed = new EmbedBuilder()
 .setTitle("SUCCESS ✅")
 .setDescription(`Success ${message.author}! I've sent the **${type}** account details to your DMs.`)
 .setColor("#2ecc71")
 .setImage(BANNER_URL);

 await message.reply({embeds:[successEmbed]});

 const dmEmbed = new EmbedBuilder()
 .setTitle(`🎁 Incredible Gen ${type}`)
 .setDescription(
`1️⃣ Create a redeem ticket
2️⃣ Type .redeem ${code}

Your Code: **${code}**`
 )
 .setColor("#8e44ff")
 .setImage(BANNER_URL);

 try{
 await message.author.send({embeds:[dmEmbed]});
 }catch{
 message.reply("❌ I cannot DM you.");
 }
}

if(command === "redeem"){

 if(!systemEnabled)
 return message.reply("🛑 System disabled.");

 const code = args[0];

 if(!generatedCodes.has(code))
 return message.reply("❌ Invalid code.");

 const type = generatedCodes.get(code);

 if(stock[type].length === 0)
 return message.reply("❌ Out of stock.");

 const randomIndex = Math.floor(Math.random() * stock[type].length);
 const account = stock[type][randomIndex];

 generatedCodes.delete(code);

 const embed = new EmbedBuilder()
 .setTitle("🎉 Account Redeemed")
 .setDescription(`Here is your ${type} account:\n\`${account}\``)
 .setColor("Green")
 .setImage(BANNER_URL);

 message.channel.send({embeds:[embed]});
}

});

client.login(process.env.TOKEN);