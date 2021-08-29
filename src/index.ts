require('dotenv').config()
import { Client, Guild, Intents, Invite, OAuth2Guild } from 'discord.js'


const serverId = process.env.MAIN_SERVER_ID

if (!serverId) {
  throw new Error('Missing the main server ID env variable!')
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
    usersInvites.set(invite.inviter.id, (usersInvites.get(invite.inviter.id) || 0) + (invite.uses || 0) + 5)
  })
  return usersInvites
}

const filterUsers = (usersInvites: Map<string, number>): string[] => {
  for (let user of usersInvites.keys()) {
    const userInvites = usersInvites.get(user)
    if (!userInvites || userInvites < 5){
      usersInvites.delete(user)
    }
  }
  return Array.from(usersInvites.keys())
}

const upgradeUsers = async (guild: Guild, users: string[]) => {
  const roleId = process.env.UPGRADE_ROLE
  if (!roleId) {
    throw new Error('Missing the role ID env variable!')
  }
  
  users.forEach(async userId => {
    const user = await guild.members.fetch(userId) 
    if (!user || user.roles.cache.get(roleId)) return
    await user.roles.add(roleId)
  })
}

(async () => {
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await bot.login(process.env.BOT_TOKEN as string);
  const guild = await getGuild(bot)
  const invites = await getServerInvites(guild)
  const formattedInvites = formatByUsers(invites)
  const upgradableUsers = filterUsers(formattedInvites)
  await upgradeUsers(guild, upgradableUsers)
})();