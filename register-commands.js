import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

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

(async () => {
  try {
    console.log('Registrando comandos en el servidor (guild) si GUILD_ID está definida...');

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_APP_ID || process.env.CLIENT_ID || process.env.CLIENT || process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados en guild:', process.env.GUILD_ID);
    } else {
      // fallback to global
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APP_ID || process.env.CLIENT_ID || process.env.CLIENT || process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados globalmente (puede tardar hasta 1 hora).');
    }
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
})();