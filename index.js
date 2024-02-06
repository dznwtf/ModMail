const { QuickDB } = require('quick.db');
const colors = require('colors');
const ms = require('ms');
const db = new QuickDB();
const config = require("./config.js");
const projectVersion = require('./package.json').version || "Unknown";
// const Enmap = require('enmap');
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  Partials,
  REST,
  Routes,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  bold,
  italic,
  codeBlock
} = require('discord.js');

const client = new Client(
  {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
      Partials.GuildScheduledEvent,
      Partials.User
    ],
    presence: {
      activities: [{
        name: "Dm Aberta !",
        type: 1,
        url: "https://www.youtube.com/watch?v=qCeLpsHoP4Q"
      }]
    },
    shards: "auto"
  }
);

require('http')
  .createServer((req, res) => res.end('Ready.'))
  .listen(3030);


const AuthentificationToken = config.Client.TOKEN || process.env.TOKEN;

if (!AuthentificationToken) {
  console.error("[ERROR] Você precisa fornecer seu token de bot!".red);
  return process.exit();
}

if (!config.Client.ID) {
  console.error("[ERROR] Você precisa fornecer o ID do seu bot!".red);
  return process.exit();
}

if (!config.Handler.GUILD_ID) {
  console.error("[ERROR] Você precisa fornecer o ID do seu servidor!".red);
  return process.exit();
}

if (!config.Handler.CATEGORY_ID) {
  console.warn("[WARN] Você deve fornecer o ID da categoria modmail!".red);
  console.warn("[WARN] Use o comando de barra /setup para corrigir este problema sem usar o arquivo config.js.".red);
}

if (!config.Modmail.INTERACTION_COMMAND_PERMISSIONS) {
  console.error("[ERROR] Você precisa fornecer pelo menos uma permissão para o comandos de barra".red); return process.exit();
};

const commands = [

  {
    name: 'help',
    description: 'Responda com o menu de ajuda.'
  },

  {
    name: 'commands',
    description: 'Responde com uma lista de comandos disponíveis.'
  },

  {
    name: 'ban',
    description: 'Proibir um usuário de usar o sistema modmail.',
    options: [
      {
        name: "user",
        description: "O usuário a ser banido.",
        type: 6, 
        required: true
      },
      {
        name: "reason",
        description: "O motivo do ban.",
        type: 3 
      }
    ]
  },

  {
    name: 'unban',
    description: 'Desbanir um usuário de usar o sistema modmail.',
    options: [
      {
        name: "user",
        description: "O usuário a ser desbanido.",
        type: 6, 
        required: true
      }
    ]
  },

  {
    name: 'setup',
    description: 'Configure o sistema de categorias de e-mail.'
  }
];


const rest = new REST({ version: '10' })
  .setToken(process.env.TOKEN || config.Client.TOKEN);

(async () => {
  try {
    console.log('[HANDLER] Iniciada a atualização dos comandos do aplicativo (/).'.brightYellow);
    await rest.put(
      Routes.applicationGuildCommands(config.Client.ID, config.Handler.GUILD_ID), { body: commands }
    );

    console.log('[HANDLER] Comandos do aplicativo (/) recarregados com sucesso.'.brightGreen);
  } catch (error) {
    console.error(error);
  }
})();

client.login(AuthentificationToken)
  .catch(console.log);

client.once('ready', async () => {
  console.log(`[READY] ${client.user.tag} está ativo e pronto para uso.`.brightGreen);
  const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

  if (!guild) {
    console.error('[CRASH] Servidor é inválido, ou provavelmente válido, mas não estou lá.'.red); return process.exit();
  } else return;
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("[ANTI-CRASH] Ocorreu um erro e foi tratado com sucesso: [unhandledRejection]".red);
  console.error(promise, reason);
});

process.on("uncaughtException", (err, origin) => {
  console.error("[ANTI-CRASH] Ocorreu um erro e foi tratado com sucesso: [uncaughtException]".red);
  console.error(err, origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error("[ANTI-CRASH] Ocorreu um erro e foi tratado com sucesso: [uncaughtExceptionMonitor]".red);
  console.error(err, origin);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  if (command === "ping") {
    interaction.reply(
      {
        content: `${client.ws.ping} ms!`
      }
    ).catch(() => { });

  } else if (command === "help") {

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setAuthor(
              {
                name: client.user.tag,
                iconURL: client.user.displayAvatarURL(
                  {
                    dynamic: true
                  }
                )
              }
            )
            .setTitle("Menu de Ajuda:")
            .setDescription(`Este é o menu de ajuda do ${bold("Bot de ModMail v" + projectVersion)}.`)
            .addFields(
              {
                name: "Configurar o sistema:",
                value: "Se você não forneceu o ID da categoria no arquivo config.js, use o comando de barra \`/setup\` em vez disso."
              },
              {
                name: "Criar um novo e-mail:",
                value: "Para criar um e-mail, envie qualquer coisa para mim via DM e um canal de e-mail deve ser criado automaticamente com o ID da sua conta. Você pode enviar mídias, elas devem funcionar."
              },
              {
                name: "Fechar um e-mail:",
                value: "Se você quiser fechar um e-mail das DMs, clique no botão cinza \"Fechar\". Caso contrário, se você quiser fechar um e-mail no canal de texto, vá para o canal de e-mail e clique no botão vermelho \"Fechar\". Se ele responder com \"Esta interação falhou\", use o comando de barra \`/close\` em vez disso."
              },
              {
                name: "Banir/Desbanir um usuário de usar o sistema de ModMail.",
                value: "Para banir um usuário, use o comando de barra \`/ban\`. Caso contrário, use o comando de barra \`/unban\`."
              }
            )
            .setColor('Blue')
            .setFooter(
              {
                text: "Desenvolvido por: dznwtf"
              }
            )
        ],
        ephemeral: true
      }
    ).catch(() => { });

  } else if (command === "commands") {
    const totalCommands = [];

    commands.forEach((cmd) => {
      let arrayOfCommands = new Object();

      arrayOfCommands = {
        name: "/" + cmd.name,
        value: cmd.description
      };

      totalCommands.push(arrayOfCommands);
    });

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setAuthor(
              {
                name: client.user.tag,
                iconURL: client.user.displayAvatarURL(
                  {
                    dynamic: true
                  }
                )
              }
            )
            .setTitle("Lista de comandos disponíveis:")
            .addFields(totalCommands)
        ]
      }
    ).catch(() => { });

  } else if (command === "ban") {
    const user = interaction.options.get('user').value;

    let reason = interaction.options.get('reason');
    let correctReason;

    if (!reason) correctReason = 'Nenhum motivo foi fornecido.';
    if (reason) correctReason = reason.value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Sem Permissão !')
            .setDescription(`Desculpe, não posso permitir que você use este comando porque você precisa de permissões ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))}!`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`Esse usuário já foi banido.`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    await db.add(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`, 1);
    await db.set(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`, correctReason);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`Esse usuário foi banido com sucesso. Motivo: ${bold(correctReason)}`)
            .setColor('Green')
        ],
        ephemeral: true
      }
    );

  } else if (command === "unban") {
    const user = interaction.options.get('user').value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Sem Permissão !')
            .setDescription(`Desculpe, não posso permitir que você use este comando porque você precisa de ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))}`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (!bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`Esse usuário já foi desbanido.`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);
    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`Esse usuário foi desbanido com sucesso.`)
            .setColor('Green')
        ],
        ephemeral: true
      }
    );

  } else if (command === "setup") {
    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Sem Permissão !')
            .setDescription(`Desculpe, não posso permitir que você use este comando porque você precisa de ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))}`).setColor('Red')
        ],
        ephemeral: true
      }
    );

    const guild = client.guilds.cache.get(config.Handler.GUILD_ID);
    const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

    if (category) {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Já existe uma categoria modmail chamada "ModMail". Substituir a categoria antiga por uma nova categoria?\n\n⚠ Se você clicar em **Substituir**, todos os canais de texto dos e-mails ficarão fora da categoria.`)
              .setColor('Red')
              .setFooter(
                {
                  text: "Esta solicitação expira em 10 segundos, os botões não responderão às suas ações após 10 segundos."
                }
              )
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_yes')
                  .setLabel('Substituir')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_no')
                  .setLabel('Não')
                  .setStyle(ButtonStyle.Danger),
              )
          ],
          ephemeral: true
        }
      ).catch(() => { });

      const collectorREPLACE_CHANNEL = interaction.channel.createMessageComponentCollector({
        time: 10000
      });

      collectorREPLACE_CHANNEL.on('collect', async (i) => {
        const ID = i.customId;

        if (ID == "replace_button_channel_yes") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Criando uma nova categoria... Isso pode demorar um pouco!`)
                  .setColor('Yellow')
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('Substituir')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('Não')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ]
            }
          ).catch(() => { });

          await category.delete()
            .catch(() => { });

          const channel = await guild.channels.create({
            name: "ModMail",
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ]
          }).catch(console.log);

          let roles = [];

          if (config.Modmail.MAIL_MANAGER_ROLES) {
            config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
              const roleFetched = guild.roles.cache.get(role);
              if (!roleFetched) return roles.push('[INVALID ROLE]');

              roles.push(roleFetched);

              await channel.permissionOverwrites.create(roleFetched.id, {
                SendMessages: true,
                ViewChannel: true,
                AttachFiles: true
              })
            });
          } else {
            roles.push("Nenhum cargo foi adicionado ao arquivo config.js");
          }

          interaction.editReply(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Concluído, criei com sucesso uma categoria de e-mail chamada **ModMail**.`)
                  .addFields(
                    { name: "Roles", value: roles.join(', ') + "." }
                  )
                  .setFooter(
                    {
                      text: "AVISO: Verifique os cargos no canal da categoria, erros podem acontecer a qualquer momento."
                    }
                  )
                  .setColor('Green')
              ]
            }
          ).catch(() => { });

          return collectorREPLACE_CHANNEL.stop();
        } else if (ID == "replace_button_channel_no") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Cancelado.`)
                  .setFooter(
                    {
                      text: "Agora você pode clicar em \"Ignorar Mensagem\" abaixo desta mensagem incorporada."
                    }
                  )
                  .setColor('Green')
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('Substituir')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('Não')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ],
            }
          ).catch(() => { });

          return collectorREPLACE_CHANNEL.stop();
        } else return;
      })

    } else {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Criando uma nova categoria... Isso pode demorar um pouco!`)
              .setColor('Yellow')
          ]
        }
      ).catch(() => { });

      const channel = await guild.channels.create({
        name: "ModMail",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ]
      }).catch(console.log);

      let roles = [];

      if (config.Modmail.MAIL_MANAGER_ROLES) {
        config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
          const roleFetched = guild.roles.cache.get(role);
          if (!roleFetched) return roles.push('[CARGO INVÁLIDO]');

          roles.push(roleFetched);

          await channel.permissionOverwrites.create(roleFetched.id, {
            SendMessages: true,
            ViewChannel: true,
            AttachFiles: true
          })
        });
      } else {
        roles.push("Nenhum cargo foi adicionado ao arquivo config.js.");
      }

      return interaction.editReply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Pronto, criei com sucesso uma categoria de e-mail chamada **ModMail**.`)
              .addFields(
                { name: "Roles", value: roles.join(', ') + "." }
              )
              .setFooter(
                {
                  text: "AVISO: Verifique os cargos no canal da categoria, erros podem acontecer a qualquer momento."
                }
              )
              .setColor('Green')
          ]
        }
      ).catch(() => { });
    }

  } else return;
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

  if (!guild) {
    console.error('[CRASH] Servidor não é válido.'.red);
    return process.exit();
  }

  const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

  const channel = guild.channels.cache.find(
    x => x.name === message.author.id && x.parentId === category.id
  );

  const bannedUserCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}`);

  if (message.channel.type == ChannelType.DM) {
    if (bannedUserCheck) {
      const reason = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}_reason`);

      return message.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle("Falha na criação do e-mail:")
              .setDescription(`Desculpe, não foi possível criar um e-mail para você porque você está ${bold('banido(a)')} de usar o sistema modmail!`)
              .addFields(
                { name: 'Motivo do ban', value: italic(reason) }
              )
          ]
        }
      );
    };

    if (!category) return message.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription("O sistema ainda não está pronto.")
            .setColor("Red")
        ]
      }
    );

    if (!channel) {
      let embedDM = new EmbedBuilder()
        .setTitle("Criação de e-mail:")
        .setDescription(`Seu e-mail foi criado com sucesso com estes detalhes abaixo:`)
        .addFields(
          { name: "Mensagem", value: `${message.content || italic("(Nenhuma mensagem foi enviada, provavelmente uma mensagem de arquivo/embed foi enviada ou um erro)")}` }
        )
        .setColor('Green')
        .setFooter(
          {
            text: "Você pode clicar no botão \"Fechar\" para fechar este e-mail."
          }
        )

      if (message.attachments.size) {
        embedDM.setImage(message.attachments.map(img => img)[0].proxyURL);
        embedDM.addFields(
          { name: "Arquivo(s)", value: italic("(Abaixo desta linha de mensagem)") }
        )
      };

      message.reply(
        {
          embeds: [
            embedDM
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_dm')
                  .setLabel('Fechar')
                  .setStyle(ButtonStyle.Secondary),
              )
          ]
        }
      );

      const channel = await guild.channels.create({
        name: message.author.id,
        type: ChannelType.GuildText,
        parent: category,
        topic: `Um canal de e-mail criado por ${message.author.tag} por solicitar ajuda ou qualquer outra coisa.`
      }).catch(console.log);

      let embed = new EmbedBuilder()
        .setTitle("Novo e-mail criado:")
        .addFields(
          { name: "Usuário", value: `${message.author.tag} (\`${message.author.id}\`)` },
          { name: "Mensagem", value: `${message.content.substr(0, 4096) || italic("(Nenhuma mensagem foi enviada, provavelmente uma mensagem de arquivo/embed foi enviada ou um erro)")}` },
          { name: "Criado em", value: `${new Date().toLocaleString()}` },
        )
        .setColor('Blue')

      if (message.attachments.size) {
        embed.setImage(message.attachments.map(img => img)[0].proxyURL);
        embed.addFields(
          { name: "Arquivo(s)", value: italic("(Abaixo desta linha de mensagem)") }
        )
      };

      const ROLES_TO_MENTION = [];
      config.Modmail.MAIL_MANAGER_ROLES.forEach((role) => {
        if (!config.Modmail.MAIL_MANAGER_ROLES || !role) return ROLES_TO_MENTION.push('[ERROR: Nenhum cargo foi fornecido]')
        if (config.Modmail.MENTION_MANAGER_ROLES_WHEN_NEW_MAIL_CREATED == false) return;

        const ROLE = guild.roles.cache.get(role);
        if (!ROLE) return;
        ROLES_TO_MENTION.push(ROLE);
      });

      return channel.send(
        {
          content: config.Modmail.MENTION_MANAGER_ROLES_WHEN_NEW_MAIL_CREATED ? ROLES_TO_MENTION.join(', ') : "** **",
          embeds: [
            embed
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_channel')
                  .setLabel('Fechar')
                  .setStyle(ButtonStyle.Danger),
              )
          ]
        }
      ).then(async (sent) => {
        sent.pin()
          .catch(() => { });
      });

    } else {
      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content.substr(0, 4096) || italic("(Nenhuma mensagem foi enviada, provavelmente uma mensagem de arquivo/embed foi enviada ou um erro)"))
        .setColor('Green');

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

      message.react("📨")
        .catch(() => { });

      return channel.send(
        {
          embeds: [
            embed
          ]
        }
      );
    }

  } else if (message.channel.type === ChannelType.GuildText) {
    if (!category) return;

    if (message.channel.parentId === category.id) {
      const requestedUserMail = guild.members.cache.get(message.channel.name);

      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content.substr(0, 4096) || italic("(Nenhuma mensagem foi enviada, provavelmente uma mensagem de arquivo/embed foi enviada ou um erro)"))
        .setColor('Red');

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

      message.react("📨")
        .catch(() => { });

      return requestedUserMail.send(
        {
          embeds: [
            embed
          ]
        }
      ).catch(() => { });
    } else return;
  }
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton()) {
    const ID = interaction.customId;

    if (ID == "close_button_created_mail_channel") {
      const modal = new ModalBuilder()
        .setCustomId('modal_close')
        .setTitle('Fechar E-mail');

      const REASON_TEXT_INPUT = new TextInputBuilder()
        .setCustomId('modal_close_variable_reason')
        .setLabel("Motivo de finalizar o e-mail.")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const ACTION_ROW = new ActionRowBuilder()
        .addComponents(REASON_TEXT_INPUT);

      modal.addComponents(ACTION_ROW);

      await interaction.showModal(modal)
        .catch(() => { });

    } else if (ID == "close_button_created_mail_dm") {
      const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

      const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

      const channelRECHECK = guild.channels.cache.find(
        x => x.name === interaction.user.id && x.parentId === category.id
      );

      if (!channelRECHECK) return interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Já foi finalizado por um membro da equipe ou por você.`)
              .setColor('Yellow')
          ],
          ephemeral: true
        }
      );

      await channelRECHECK.delete()
        .catch(() => { })
        .then(async (ch) => {
          if (!ch) return; // ISSO É 101% IMPORTANTE. SE VOCÊ REMOVER ESTA LINHA, O EMBED "Mail Closed" SERÁ DUPLICADO NO DMS DOS USUÁRIOS. (1 e depois 2, 3, 4, 5 até o infinito)

          return interaction.reply(
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle('E-mail Finalizado')
                  .setDescription(`Seu e-mail foi finalizado com sucesso.`)
                  .setColor('Green')
              ]
            }
          ).catch(() => { });
        });
    } else return;

  } else if (interaction.type === InteractionType.ModalSubmit) {
    const ID = interaction.customId;

    if (ID == "modal_close") {
      const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

      const requestedUserMail = guild.members.cache.get(interaction.channel.name);

      let reason = interaction.fields.getTextInputValue('modal_close_variable_reason');
      if (!reason) reason = "Nenhum motivo foi fornecido.";

      interaction.reply(
        {
          content: "Finalizando..."
        }
      ).catch(() => { });

      return interaction.channel.delete()
        .catch(() => { })
        .then(async (ch) => {
          if (!ch) return; // ISSO É 101% IMPORTANTE. SE VOCÊ REMOVER ESTA LINHA, O EMBED "Mail Closed" SERÁ DUPLICADO NO DMS DOS USUÁRIOS. (1 e depois 2, 3, 4, 5 até o infinito)

          return await requestedUserMail.send(
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle('E-mail Finalizado')
                  .setDescription(`Seu e-mail foi finalizado com sucesso.`)
                  .addFields(
                    { name: "Motivo", value: `${italic(reason)}` }
                  )
                  .setColor('Green')
              ]
            }
          ).catch(() => { });
        });
    } else return;
  } else return;
});


