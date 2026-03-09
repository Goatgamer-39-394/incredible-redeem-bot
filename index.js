const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js")

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
})

const prefix = "."

const owners = [
"1358359831140110426",
"1121404311319089153"
]

const staffRole = "1478005454495023104"

let stock = {
minecraft: [],
crunchyroll: [],
steam: []
}

let generatedCodes = new Map()
let redeemers = []

function isStaff(member){
return owners.includes(member.id) || member.roles.cache.has(staffRole)
}

function randomChars(length){
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
let result = ""

for(let i=0;i<length;i++){
result += chars.charAt(Math.floor(Math.random()*chars.length))
}

return result
}

function randomDigits(length){
let result=""

for(let i=0;i<length;i++){
result += Math.floor(Math.random()*10)
}

return result
}

client.on("ready",()=>{
console.log(`Logged in as ${client.user.tag}`)
})

client.on("messageCreate",async message=>{

if(message.author.bot) return
if(!message.content.startsWith(prefix)) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const command = args.shift().toLowerCase()

/* HELP */

if(command==="help"){

const embed = new EmbedBuilder()
.setTitle("User Commands")
.setColor("Blue")
.setDescription(`
.redeem <code>
.dashboard
.help
`)

message.channel.send({embeds:[embed]})

}

/* STAFF HELP */

if(command==="staffhelp"){

if(!isStaff(message.member)) return

const embed = new EmbedBuilder()
.setTitle("Staff Commands")
.setColor("Red")
.setDescription(`
.gen <service>
.addstock <service> account:pass
.removestock <service> <amount>
.staffstock
.staffstock <service>
.staffhelp
`)

message.channel.send({embeds:[embed]})

}

/* ADD STOCK */

if(command==="addstock"){

if(!isStaff(message.member)) return

const service = args[0]
const account = args.slice(1).join(" ")

if(!service || !account) return message.reply("Usage: .addstock <service> account")

if(!stock[service]) stock[service]=[]

stock[service].push(account)

message.reply(`Added stock to ${service}`)

}

/* REMOVE STOCK */

if(command==="removestock"){

if(!isStaff(message.member)) return

const service = args[0]
const amount = parseInt(args[1])

if(!stock[service]) return message.reply("Service not found")

stock[service].splice(0,amount)

message.reply(`Removed ${amount} from ${service}`)

}

/* STAFF STOCK */

if(command==="staffstock"){

if(!isStaff(message.member)) return

const service = args[0]

if(!service){

let text=""

for(const s in stock){
text+=`${s} : ${stock[s].length}\n`
}

const embed = new EmbedBuilder()
.setTitle("Stock Amount")
.setDescription(text)
.setColor("Purple")

return message.channel.send({embeds:[embed]})

}

if(!stock[service]) return message.reply("Service not found")

const embed = new EmbedBuilder()
.setTitle(`${service} Stock`)
.setDescription(stock[service].join("\n") || "No stock")
.setColor("Purple")

message.channel.send({embeds:[embed]})

}

/* GEN CODE */

if(command==="gen"){

if(!isStaff(message.member)) return

const service=args[0]

if(!stock[service] || stock[service].length===0)
return message.reply("No stock available")

let code

if(service==="minecraft"){
code=randomChars(5)
}
else if(service==="crunchyroll"){
code=randomChars(6)
}
else if(service==="steam"){
code=randomDigits(3)
}
else{
code=randomChars(6)
}

generatedCodes.set(code,service)

try{

await message.author.send(`
Generated Code

Service: ${service}

Redeem:
.redeem ${code}
`)

message.reply("Code sent to your DM")

}catch{

message.reply("Enable DMs first")

}

}

/* REDEEM */

if(command==="redeem"){

const code=args[0]

if(!generatedCodes.has(code))
return message.reply("Invalid code")

const service=generatedCodes.get(code)

if(!stock[service] || stock[service].length===0)
return message.reply("Out of stock")

const account=stock[service].shift()

generatedCodes.delete(code)

redeemers.push({
user:message.author.username,
service:service
})

const embed=new EmbedBuilder()
.setTitle("Redeemed")
.setColor("Green")
.setDescription(`
Service: ${service}

Account:
${account}
`)

message.channel.send({embeds:[embed]})

}

/* DASHBOARD */

if(command==="dashboard"){

let stockText=""
for(const s in stock){
stockText+=`${s}: ${stock[s].length}\n`
}

let redeemText=""

redeemers.forEach(r=>{
redeemText+=`${r.user} - ${r.service}\n`
})

if(redeemText==="") redeemText="No redeems"

const embed=new EmbedBuilder()
.setTitle("Dashboard")
.setColor("Gold")
.addFields(
{ name:"Stock", value:stockText || "None"},
{ name:"Redeemers", value:redeemText}
)

message.channel.send({embeds:[embed]})

}

})

client.login(process.env.TOKEN)