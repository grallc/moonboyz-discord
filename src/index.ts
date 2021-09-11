require('dotenv').config()
import { Client, Guild, Intents } from 'discord.js'
import initUpgradeTask from './upgrader'
import initAlertsTask from './alerts'

const serverId = process.env.MAIN_SERVER_ID

if (!serverId) {
  throw new Error('Missing the MAIN_SERVER_ID env variable!')
}

const getGuild = async (bot: Client): Promise<Guild> => {
  const guilds = await bot.guilds.fetch()
  const guild = guilds.get(serverId)
  if (!guild) {
    throw new Error('Cannot find the main server!')
  }
  return await guild.fetch()
}

(async () => {
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await bot.login(process.env.BOT_TOKEN as string);
  const guild = await getGuild(bot)
  if (process.env.UPGRADE_CHECKER === 'true') {
    initUpgradeTask(bot, guild)
  }

  if (process.env.ALERTS === 'true') {
    initAlertsTask(bot, guild)
  }
})();