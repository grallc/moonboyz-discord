require('dotenv').config()
import { Client, Intents, Invite } from 'discord.js'


const serverId = process.env.MAIN_SERVER_ID

if (!serverId) {
  throw new Error('Missing the main server ID env variable!')
}

const getServerInvites = async (bot: Client) => {
  const guilds = await bot.guilds.fetch()
  const guild = guilds.get(serverId)
  if (!guild) {
    throw new Error('Cannot find the main server!')
  }
  const invites = await (await guild.fetch()).invites.fetch()
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

const filterUsers = (usersInvites: Map<string, number>) => {
  for (let user of usersInvites.keys()) {
    const userInvites = usersInvites.get(user)
    if (!userInvites || userInvites < 5){
      usersInvites.delete(user)
    }
  }
  return usersInvites.keys()
}

(async () => {
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await bot.login(process.env.BOT_TOKEN as string);
  const invites = await getServerInvites(bot)
  const formattedInvites = formatByUsers(invites)
  const upgradableUsers = filterUsers(formattedInvites)
})();