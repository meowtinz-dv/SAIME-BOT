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
- Environment variables needed ✗
- Workflow configured ✗

## Last Updated
October 6, 2025 - Initial import and setup
