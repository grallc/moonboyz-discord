require('dotenv').config()
import { Client, Guild, Intents, Invite } from 'discord.js'
import cron from 'node-cron'


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

const getServerInvites = async (guild: Guild) => {
  const invites = await guild.invites.fetch()
  return Array.from(invites.values())
}

const formatByUsers = (invites: Invite[]) => {
  // new Map<userId, invites>
  const usersInvites = new Map<string, number>()
  invites.forEach(invite => {
    if (invite.inviter === null) return
    usersInvites.set(invite.inviter.id, (usersInvites.get(invite.inviter.id) || 0) + (invite.uses || 0))
  })
  return usersInvites
}

const filterUsers = (usersInvites: Map<string, number>): string[] => {
  const requiredInvits = process.env.REQUIRED_INVITS
  if (!requiredInvits) {
    throw new Error('Missing the REQUIRED_INVITS env variable!')
  }
  for (let user of usersInvites.keys()) {
    const userInvites = usersInvites.get(user)
    if (!userInvites || userInvites < parseInt(requiredInvits)){
      usersInvites.delete(user)
    }
  }
  return Array.from(usersInvites.keys())
}

const upgradeUsers = async (guild: Guild, users: string[]) => {
  const roleId = process.env.UPGRADE_ROLE
  if (!roleId) {
    throw new Error('Missing the UPGRADE_ROLE env variable!')
  }

  users.forEach(async userId => {
    const user = await guild.members.fetch(userId) 
    if (!user || user.roles.cache.get(roleId)) return
    await user.roles.add(roleId)
    console.log(`Successfully upgraded ${user.user.username}#${user.user.discriminator}.`)
  })
}

const runCheck = async (guild: Guild) => {
  console.log('Checking upgradeable users...')
  const invites = await getServerInvites(guild)
  const formattedInvites = formatByUsers(invites)
  const upgradableUsers = filterUsers(formattedInvites)
  await upgradeUsers(guild, upgradableUsers)
} 

const initCron = (guild: Guild) => {
  const cronInterval = process.env.CRON_INTERVAL
  if (!cronInterval) {
    throw new Error('Missing the CRON_INTERVAL env variable!')
  }
  runCheck(guild)
  cron.schedule(cronInterval, async () => {
    runCheck(guild)
  })
}

(async () => {
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await bot.login(process.env.BOT_TOKEN as string);
  const guild = await getGuild(bot)
  initCron(guild)
})();