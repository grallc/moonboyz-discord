require('dotenv').config()
import { Client, Guild, TextChannel } from 'discord.js'
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
    (channel as TextChannel).send(message.message)
  })
}

const initAlertsCron = async (client: Client, guild: Guild) => {
  const messages = getMessages() as { channel: string, message: string }[]
  cron.schedule(cronInterval, async () => {
    sendMessages(guild, messages)
  })
}


export default initAlertsCron