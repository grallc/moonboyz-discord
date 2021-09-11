require('dotenv').config()
import { Client, Guild, TextChannel, MessageEmbed } from 'discord.js'
import cron from 'node-cron'

const cronInterval = process.env.ALERTS_DELAY
if (!cronInterval) {
  throw new Error('Missing the ALERTS_DELAY env variable!')
}

const getMessages = () => {
  const messages = process.env.ALERTS_MESSAGES
  if (!messages) {
    throw new Error('Missing the ALERTS_MESSAGES env variable!')
  }
  const parsedMessages = JSON.parse(JSON.stringify(messages))
  return JSON.parse(parsedMessages)
}

const sendMessages = (guild: Guild, messages: { channel: string, message: string }[]) => {
  messages.map(async (message) => {
    const channel = await guild.channels.fetch(message.channel)
    if (!channel) return
    const infosEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setDescription(message.message)
    .setFooter('https://moon-boyz.com', 'https://pbs.twimg.com/profile_images/1431618530915635200/vvvET7nR_400x400.jpg');
    (channel as TextChannel).send({ embeds: [infosEmbed] })
  })
}

const initAlertsCron = async (client: Client, guild: Guild) => {
  const messages = getMessages() as { channel: string, message: string }[]
  cron.schedule(cronInterval, async () => {
    sendMessages(guild, messages)
  })
}


export default initAlertsCron