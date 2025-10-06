# Roblox Rangos Bot

## Overview
Discord bot that manages Roblox group member ranks through Discord slash commands. Allows authorized users to promote, demote, and assign ranks to Roblox group members directly from Discord.

## Project Type
- **Backend Discord Bot** with Express health check server
- **Language**: Node.js (ES Modules)
- **Main Dependencies**: 
  - discord.js (Discord API)
  - noblox.js (Roblox API)
  - express (Simple health check server)

## Architecture
- `index.js` - Main bot logic and command handling
- `register-commands.js` - Discord slash command registration
- `config.json` - Stores authorized role and log channel configuration
- Express server runs on port 5000 for health checks

## Required Environment Variables
The following secrets must be configured:
- `DISCORD_TOKEN` - Discord bot token
- `DISCORD_APP_ID` - Discord application/client ID
- `ROBLOSECURITY` - Roblox account cookie for authentication
- `ROBLOX_GROUP_ID` - Roblox group ID to manage
- `GUILD_ID` - (Optional) Discord guild/server ID for faster command registration

## Bot Commands
- `/promover <usuario>` - Promote a Roblox user to the next rank
- `/degradar <usuario>` - Demote a Roblox user to the previous rank
- `/asignar <usuario> <rango>` - Assign a specific rank to a Roblox user
- `/autorizacion <rol>` - Set the Discord role that can use bot commands (admin only)
- `/registro <canal>` - Set the Discord channel for logging bot actions (admin only)

## Setup Status
- Dependencies installed ✓
- Environment variables configured ✓
- Workflow configured ✓
- Bot running successfully ✓

## Important Notes
- The bot connects to both Discord and Roblox on startup
- Express health check server runs on port 5000
- Commands are registered automatically on startup
- If GUILD_ID is provided, commands register instantly; otherwise takes up to 1 hour globally

## Deployment Notes
This Discord bot is a long-running console application with a health check endpoint. For production deployment:
- Use VM deployment type (not autoscale) to keep the bot always running
- The Express server on port 5000 provides a health check endpoint at `/`

## Last Updated
October 6, 2025 - Initial import and setup completed
