require('dotenv').config()
import { Client, Intents } from 'discord.js'

(async () => {
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await bot.login(process.env.BOT_TOKEN as string);
})();