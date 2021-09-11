require('dotenv').config()
import { Client, Guild, Invite } from 'discord.js'
import cron from 'node-cron'

const maxUpgraded = process.env.MAX_UPGRADED as string
const roleId = process.env.UPGRADE_ROLE as string
const requiredInvits = process.env.REQUIRED_INVITS as string
const cronInterval = process.env.CRON_INTERVAL as string

const getServerInvites = async (guild: Guild) => {
  const invites = await guild.invites.fetch()
  return Array.from(invites.values())
}

const findUpgraded = async (guild: Guild) => {
  const role = await guild.roles.fetch(roleId)
  if (role === null) return
  const upgradedUsers = role.members.size
  return upgradedUsers
}

const updateStatus = async (bot: Client, leftSlots: number) => {
  if (bot === null || bot.user === null) return
  bot.user.setPresence({
    status: 'dnd',
    activities: [{
      name: `${leftSlots} slots left for the presales, hurry up!`
    }]
  })
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
  for (let user of usersInvites.keys()) {
    const userInvites = usersInvites.get(user)
    if (!userInvites || userInvites < parseInt(requiredInvits)) {
      usersInvites.delete(user)
    }
  }
  return Array.from(usersInvites.keys())
}

const upgradeUsers = async (guild: Guild, users: string[]) => {
  users.forEach(async userId => {
    try {
      const user = await guild.members.fetch(userId)
      if (!user || user.roles.cache.get(roleId)) return
      await user.roles.add(roleId)
      console.log(`Successfully upgraded ${user.user.username}#${user.user.discriminator}.`)
    } catch (e) { }
  })
}

const runLimitsCheck = async (client: Client, guild: Guild) => {
  const upgraded = await findUpgraded(guild)
  const leftSlots = parseInt(maxUpgraded) - (upgraded || 0)
  await updateStatus(client, leftSlots)
  if (leftSlots <= 0) {
    throw new Error('Presales is full!')
  }
}

const runCheck = async (guild: Guild) => {
  console.log('Checking upgradeable users...')
  const invites = await getServerInvites(guild)
  const formattedInvites = formatByUsers(invites)
  const upgradableUsers = filterUsers(formattedInvites)
  await upgradeUsers(guild, upgradableUsers)
}

const initUpgradeCron = async (client: Client, guild: Guild) => {
  if (!maxUpgraded) {
    throw new Error('Missing the MAX_UPGRADED env variable!')
  }
  
  if (!roleId) {
    throw new Error('Missing the UPGRADE_ROLE env variable!')
  }
  if (!requiredInvits) {
    throw new Error('Missing the REQUIRED_INVITS env variable!')
  }
  
  if (!cronInterval) {
    throw new Error('Missing the CRON_INTERVAL env variable!')
  }
  
  await runLimitsCheck(client, guild)
  runCheck(guild)
  cron.schedule(cronInterval, async () => {
    await runLimitsCheck(client, guild)
    runCheck(guild)
  })
}


export default initUpgradeCron