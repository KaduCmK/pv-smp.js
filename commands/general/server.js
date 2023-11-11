const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Gerenciamento do server')
        .addSubcommand(subc => subc
                                .setName('iniciar')
                                .setDescription('Inicia o server'))
        .addSubcommand(subc => subc
                                .setName('desligar')
                                .setDescription('Encerra o servidor'))
        .addSubcommand(subc => subc
                                .setName('status')
                                .setDescription('Checa se o server está online')),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'iniciar') {
            await interaction.reply(`${interaction.user.username} está iniciando o servidor`)
            const { statusCode } = await request('https://hrgt3asmotbyt3mx67qrkr2lji0qyfuz.lambda-url.us-east-1.on.aws/?operation=1')
            if (statusCode == 200) {
                await interaction.followUp('O servidor está iniciando. Deve demorar ~3min...')
            }
        }

        else if (interaction.options.getSubcommand() === 'desligar') {
            await interaction.reply(`${interaction.user.username} está encerrando o servidor...`)
            const { statusCode } = await request('https://hrgt3asmotbyt3mx67qrkr2lji0qyfuz.lambda-url.us-east-1.on.aws/?operation=0')
            if (statusCode == 200) {
                await interaction.followUp('Servidor encerrado.')
            }
        }

        else if(interaction.options.getSubcommand() === 'status') {
            await interaction.deferReply();

            const { statusCode, body } = await request('https://api.mcstatus.io/v2/status/java/54.205.108.34')
            if (statusCode == 200) {
                const response = await body.json()

                if (response.online) {
                    await interaction.editReply(`O servidor está **ONLINE**\n${response.players.online} jogadore(s) online`)
                }
                else {
                    await interaction.editReply("O servidor está **OFFLINE**")
                }
            }
        }
    }
}