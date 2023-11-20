const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici')
require('dotenv').config()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Gerenciamento do server')
        .addSubcommand(subc => subc
                                .setName('iniciar')
                                .setDescription('[precisa de cargo] Inicia o server'))
        .addSubcommand(subc => subc
                                .setName('desligar')
                                .setDescription('[precisa de cargo] Encerra o servidor'))
        .addSubcommand(subc => subc
                                .setName('status')
                                .setDescription('Checa se o server está online')),
    async execute(interaction) {
        const serverHttp = process.env.SERVER_HTTP
        

        switch (interaction.options.getSubcommand()) {
            case 'iniciar':
                if (!interaction.member.roles.cache.some(role => role.name == 'Minecraft')) {
                await interaction.reply('Você não tem permissão.')
                return
                }

                await interaction.reply(`${interaction.user.username} está iniciando o servidor`)
                const { statusCode:turnOnStatus } = await request(`${serverHttp}?operation=1`)
                if (turnOnStatus == 200) {
                    await interaction.followUp('O servidor está iniciando. Vou avisar quando estiver pronto...')
                }
                break
            
            case 'desligar':
                if (!interaction.member.roles.cache.some(role => role.name == 'Minecraft')) {
                await interaction.reply('Você não tem permissão.')
                return
                }

                await interaction.reply(`${interaction.user.username} está encerrando o servidor...`)
                const { statusCode:turnOffStatus } = await request(`${serverHttp}?operation=0`)
                if (turnOffStatus == 200) {
                    await interaction.followUp('Servidor encerrado.')
                }
                break

            case 'status':
                await interaction.deferReply();

                const { statusCode: httpStatus, body: httpBody } = await request('https://api.mcstatus.io/v2/status/java/54.205.108.34')
                if (httpStatus == 200) {
                    const response = await httpBody.json()

                    if (response.online) {
                        await interaction.editReply(`O servidor está **ONLINE**\n${response.players.online} jogadore(s) online`)
                    }
                    else {
                        await interaction.editReply("O servidor está **OFFLINE**")
                    }
                }
                break
        }
    }
}