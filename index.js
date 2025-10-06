import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import noblox from 'noblox.js';
import 'dotenv/config';
import { keepAlive } from './keepAlive.js';
keepAlive();

// IMPORTANT: Keep 'client' and 'groupId' names unchanged for compatibility
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const groupId = Number(process.env.ROBLOX_GROUP_ID);

const configPath = './config.json';
let config = { rolAutorizadoId: null, canalRegistroId: null };

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
  } else {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
} catch (e) {
  console.error('❌ Error leyendo config.json:', e);
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('❌ Error guardando config.json:', e);
  }
}

function fechaHoraExacta() {
  // Use local system locale; format in Spanish-like form
  try {
    return new Date().toLocaleString('es-ES');
  } catch (e) {
    return new Date().toISOString();
  }
}

function crearEmbedAccion({ titulo, color, displayName, userName, rangoTexto, thumbnailUrl }) {
  const emb = new EmbedBuilder()
    .setTitle(titulo)
    .setColor(color)
    .addFields(
      { name: 'Usuario', value: `${displayName} (${userName})`, inline: true },
      { name: 'Rango', value: rangoTexto, inline: true }
    )
    .setFooter({ text: fechaHoraExacta() });
  if (thumbnailUrl) emb.setThumbnail(thumbnailUrl);
  return emb;
}

function crearEmbedSimple({ title, color, description }) {
  const emb = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(description || '')
    .setFooter({ text: fechaHoraExacta() });
  return emb;
}

async function enviarRegistro(embed) {
  if (!config.canalRegistroId) return;
  try {
    const canal = await client.channels.fetch(config.canalRegistroId).catch(()=>null);
    if (!canal) return;
    await canal.send({ embeds: [embed] });
  } catch (e) {
    console.error('❌ Error enviando registro al canal:', e?.message || e);
  }
}

async function loginRoblox() {
  try {
    await noblox.setCookie(process.env.ROBLOSECURITY);
    const authUser = await noblox.getAuthenticatedUser();
    const authId = authUser?.id || authUser?.userId || authUser?.userID || authUser?.UserId || authUser?.UserID;
    const authName = authUser?.name || authUser?.username || authUser?.UserName || authUser?.User;
    let authRole = 'Desconocido';
    try {
      if (authId) {
        authRole = await noblox.getRankNameInGroup(groupId, authId);
      }
    } catch (e) {
      authRole = 'No disponible';
    }
    console.log('El sistema ha sido encendido correctamente.');
    console.log(`Cuenta Asignada: ${authName} - Rol en el grupo: ${authRole}`);
    return { name: authName, role: authRole };
  } catch (err) {
    console.error('❌ Error al conectar la cuenta de Roblox:', err?.message || err);
    throw err;
  }
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('promover')
      .setDescription('Promueve un miembro al siguiente rango')
      .addStringOption(opt => opt.setName('usuario').setDescription('Nombre de usuario de Roblox').setRequired(true)),

    new SlashCommandBuilder()
      .setName('degradar')
      .setDescription('Degrada un miembro al rango inferior')
      .addStringOption(opt => opt.setName('usuario').setDescription('Nombre de usuario de Roblox').setRequired(true)),

    new SlashCommandBuilder()
      .setName('asignar')
      .setDescription('Asigna un rango específico a un miembro')
      .addStringOption(opt => opt.setName('usuario').setDescription('Nombre de usuario de Roblox').setRequired(true))
      .addStringOption(opt => opt.setName('rango').setDescription('ID o nombre del rango').setRequired(true)),

    new SlashCommandBuilder()
      .setName('autorizacion')
      .setDescription('Define el rol que puede usar los comandos de Roblox')
      .addRoleOption(opt => opt.setName('rol').setDescription('Rol autorizado').setRequired(true)),

    new SlashCommandBuilder()
      .setName('registro')
      .setDescription('Define el canal donde se registran los comandos ejecutados')
      .addChannelOption(opt => opt.setName('canal').setDescription('Canal de registro').setRequired(true))
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Registrando comandos slash...');
    
    if (process.env.GUILD_ID) {
      const guildId = process.env.GUILD_ID.trim().split(' ')[0];
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildId),
        { body: commands }
      );
      console.log(`✅ Comandos registrados en guild: ${guildId}`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APP_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados globalmente (puede tardar hasta 1 hora).');
    }
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
}

async function onReadyCommon() {
  console.log(`Discord listo. Usuario bot: ${client.user?.tag || client.user?.username || 'Desconocido'}`);
  
  await registerCommands();
  
  const authName = process.env.ROBLOX_BOT_NAME || 'Cuenta Roblox';
  const authRole = process.env.ROBLOX_BOT_ROLE || 'Desconocido';
  try {
    const emb = crearEmbedSimple({ title: '✅ Sistema iniciado', color: 0x2ECC71, description: `El sistema ha sido encendido correctamente.\nCuenta Asignada: ${authName}\nRol en el grupo: ${authRole}` });
    enviarRegistro(emb);
  } catch (e) {
    console.error('❌ Error al enviar embed de inicio:', e);
  }
}

client.once('clientReady', onReadyCommon);

(async () => {
  try {
    // Login to Roblox first so we can determine bot account info
    let robloxInfo = { name: 'Desconocido', role: 'Desconocido' };
    try {
      robloxInfo = await loginRoblox();
      // store to env vars for onReadyCommon fallback
      process.env.ROBLOX_BOT_NAME = robloxInfo.name;
      process.env.ROBLOX_BOT_ROLE = robloxInfo.role;
    } catch (e) {
      // already logged in console above
    }

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const ejecutante = interaction.user.tag;
      const esAdmin = interaction.member?.permissions?.has?.('Administrator') || interaction.user.id === interaction.guild?.ownerId;

      // Admin commands: registro and autorizacion
      if (interaction.commandName === 'registro') {
        if (!esAdmin) {
          const emb = crearEmbedSimple({ title: '❌ Permisos insuficientes', color: 0xE74C3C, description: 'Necesitas ser administrador o el dueño del servidor.' });
          await interaction.reply({ embeds: [emb], ephemeral: true });
          console.log(`[${fechaHoraExacta()}] Intento /registro por ${ejecutante} sin permisos.`);
          return;
        }
        try {
          const canal = interaction.options.getChannel('canal');
          if (!canal) throw new Error('Canal inválido.');
          config.canalRegistroId = canal.id;
          saveConfig();
          const ok = crearEmbedSimple({ title: '✅ Canal asignado', color: 0x2ECC71, description: `Canal de registros: ${canal}` });
          await interaction.reply({ embeds: [ok] });
          await enviarRegistro(ok);
          console.log(`[${fechaHoraExacta()}] /registro ejecutado por ${ejecutante} -> canal ${canal.id}`);
        } catch (err) {
          const errEmb = crearEmbedSimple({ title: '❌ Error al asignar canal', color: 0xFFFFFF, description: `${err.message || err}` });
          await interaction.reply({ embeds: [errEmb], ephemeral: true });
          console.error(`[${fechaHoraExacta()}] Error /registro por ${ejecutante}:`, err);
        }
        return;
      }

      if (interaction.commandName === 'autorizacion') {
        if (!esAdmin) {
          const emb = crearEmbedSimple({ title: '❌ Permisos insuficientes', color: 0xE74C3C, description: 'Necesitas ser administrador o el dueño del servidor.' });
          await interaction.reply({ embeds: [emb], ephemeral: true });
          console.log(`[${fechaHoraExacta()}] Intento /autorizacion por ${ejecutante} sin permisos.`);
          return;
        }
        try {
          const rol = interaction.options.getRole('rol');
          if (!rol) throw new Error('Rol inválido.');
          config.rolAutorizadoId = rol.id;
          saveConfig();
          const ok = crearEmbedSimple({ title: '✅ Rol autorizado asignado', color: 0x2ECC71, description: `Rol autorizado: ${rol.name}` });
          await interaction.reply({ embeds: [ok] });
          await enviarRegistro(ok);
          console.log(`[${fechaHoraExacta()}] /autorizacion por ${ejecutante} -> rol ${rol.id}`);
        } catch (err) {
          const errEmb = crearEmbedSimple({ title: '❌ Error al asignar rol', color: 0xFFFFFF, description: `${err.message || err}` });
          await interaction.reply({ embeds: [errEmb], ephemeral: true });
          console.error(`[${fechaHoraExacta()}] Error /autorizacion por ${ejecutante}:`, err);
        }
        return;
      }

      // For other commands, check permissions: admins and owner bypass role check
      if (!esAdmin) {
        if (!config.rolAutorizadoId || !interaction.member.roles.cache.has(config.rolAutorizadoId)) {
          const emb = crearEmbedSimple({ title: '❌ Permisos insuficientes', color: 0xE74C3C, description: 'No tienes el rol autorizado para usar este comando.' });
          await interaction.reply({ embeds: [emb], ephemeral: true });
          console.log(`[${fechaHoraExacta()}] ${ejecutante} intentó ${interaction.commandName} sin rol autorizado.`);
          return;
        }
      }

      // Handle promote/degrade/assign
      const username = interaction.options.getString('usuario');
      if (!username) {
        const e = crearEmbedSimple({ title: '❌ Error', color: 0xFFFFFF, description: 'No se proporcionó un nombre de usuario.' });
        await interaction.reply({ embeds: [e], ephemeral: true });
        return;
      }

      await interaction.deferReply();

      try {
        const userId = await noblox.getIdFromUsername(username);
        if (!userId) throw new Error('Usuario no encontrado en Roblox.');

        // get displayName and username safely
        let userName = username;
        let displayName = username;
        try { userName = await noblox.getUsernameFromId(userId); } catch {}
        try { const info = await noblox.getUserInfo({ userId }); displayName = info?.displayName || userName; } catch {}

        // thumbnail
        let thumbnail = null;
        try {
          const thumbs = await noblox.getPlayerThumbnail(userId, 420, 'png', false, 'Headshot');
          if (Array.isArray(thumbs) && thumbs[0]?.imageUrl) thumbnail = thumbs[0].imageUrl;
          else if (thumbs?.[0]) thumbnail = thumbs[0];
        } catch {}

        // rango anterior
        let rangoAnterior = 'Desconocido';
        try { rangoAnterior = await noblox.getRankNameInGroup(groupId, userId); } catch (e) { throw new Error('El usuario no es miembro del grupo o no se pudo obtener su rango.'); }

        let embedAccion;

        if (interaction.commandName === 'promover') {
          await noblox.promote(groupId, userId);
          const nuevo = await noblox.getRankNameInGroup(groupId, userId);
          embedAccion = crearEmbedAccion({ titulo: '📈 Usuario Promovido', color: 0x2ECC71, displayName, userName, rangoTexto: `${rangoAnterior} > ${nuevo}`, thumbnailUrl: thumbnail });
          await interaction.editReply({ embeds: [embedAccion] });
          await enviarRegistro(embedAccion);
          console.log(`[${fechaHoraExacta()}] ${ejecutante} promovió a ${userName} (${userId}): ${rangoAnterior} -> ${nuevo}`);
          return;
        }

        if (interaction.commandName === 'degradar') {
          await noblox.demote(groupId, userId);
          const nuevo = await noblox.getRankNameInGroup(groupId, userId);
          embedAccion = crearEmbedAccion({ titulo: '📉 Usuario Degradado', color: 0xE74C3C, displayName, userName, rangoTexto: `${rangoAnterior} > ${nuevo}`, thumbnailUrl: thumbnail });
          await interaction.editReply({ embeds: [embedAccion] });
          await enviarRegistro(embedAccion);
          console.log(`[${fechaHoraExacta()}] ${ejecutante} degradó a ${userName} (${userId}): ${rangoAnterior} -> ${nuevo}`);
          return;
        }

        if (interaction.commandName === 'asignar') {
          const rango = interaction.options.getString('rango');
          if (!rango) throw new Error('No se especificó el rango a asignar.');
          const resultado = await noblox.setRank(groupId, userId, /^\d+$/.test(rango) ? Number(rango) : rango);
          let nuevoName = resultado?.name || (await noblox.getRankNameInGroup(groupId, userId));
          embedAccion = crearEmbedAccion({ titulo: '🎯 Rango Asignado', color: 0xF1C40F, displayName, userName, rangoTexto: `${rangoAnterior} > ${nuevoName}`, thumbnailUrl: thumbnail });
          await interaction.editReply({ embeds: [embedAccion] });
          await enviarRegistro(embedAccion);
          console.log(`[${fechaHoraExacta()}] ${ejecutante} asignó rango a ${userName} (${userId}): ${rangoAnterior} -> ${nuevoName}`);
          return;
        }

        const unknown = crearEmbedSimple({ title: '❌ Error', color: 0xFFFFFF, description: 'Comando no reconocido.' });
        await interaction.editReply({ embeds: [unknown] });
      } catch (err) {
        console.error(`[${fechaHoraExacta()}] Error ejecutando ${interaction.commandName}:`, err?.message || err);
        const errEmb = crearEmbedSimple({ title: '❌ Error', color: 0xFFFFFF, description: `${err.message || 'Ha ocurrido un error inesperado'}` });
        try { if (!interaction.replied) await interaction.editReply({ embeds: [errEmb] }); else await interaction.followUp({ embeds: [errEmb] }); } catch (e) { try { await interaction.reply({ embeds: [errEmb], ephemeral: true }); } catch(_) {} }
        try { await enviarRegistro(errEmb); } catch(_) {}
      }
    });

    client.login(process.env.DISCORD_TOKEN);

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\n${signal} recibido. Apagando el bot correctamente...`);
      try {
        const emb = crearEmbedSimple({ title: '🔴 Sistema apagado', color: 0xE74C3C, description: 'El bot ha sido desconectado.' });
        await enviarRegistro(emb);
      } catch (e) {
        console.error('Error al enviar mensaje de apagado:', e?.message || e);
      }
      client.destroy();
      console.log('Bot desconectado correctamente.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Error al iniciar el bot:', err);
    // Try to notify in configured channel
    try {
      if (fs.existsSync(configPath)) {
        const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (conf?.canalRegistroId) {
          const errEmb = crearEmbedSimple({ title: '❌ Error al iniciar el bot', color: 0xFFFFFF, description: `${err.message || err}` });
          const ch = await client.channels.fetch(conf.canalRegistroId).catch(()=>null);
          if (ch) await ch.send({ embeds: [errEmb] });
        }
      }
    } catch (e) {
      console.error('❌ No se pudo notificar del error al canal de registro:', e);
    }
  }
})();
import express from 'express';

const app = express();
app.get('/', (req, res) => res.send('Bot activo'));

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor Express activo en puerto ${port}`);
});
