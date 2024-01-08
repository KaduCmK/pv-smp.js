const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici')
const fs = require('node:fs')
require('dotenv').config()

let json, ip

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
                                .setDescription('Checa se o server está online'))
        .addSubcommand(subc => subc
                                .setName('players')
                                .setDescription('[precisa de cargo] lista os jogadores online')),
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
                    await interaction.followUp('**ATENÇÃO!** O IP do server agora muda diariamente e vai ser enviado quando tudo tiver pronto')
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
                await interaction.deferReply({ephemeral: true});

                json = fs.readFileSync('serverconfig.json', {encoding:'utf-8', flag: 'r'})
                ip = JSON.parse(json).ec2Ip
                console.log(ip)

                const { statusCode: httpStatus, body: httpBody } = await request(`https://api.mcstatus.io/v2/status/java/${ip}`)
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

            case 'players':
                await interaction.deferReply()

                json = fs.readFileSync('serverconfig.json', {encoding:'utf-8', flag: 'r'})
                ip = JSON.parse(json).ec2Ip
                console.log(ip)

                const { statusCode: playersStatusCode, body:playersHttpBody } = await request(`https://api.mcstatus.io/v2/status/java/${ip}`)
                if (playersStatusCode == 200) {
                    const response = await playersHttpBody.json()

                    if (!response.online) {
                        await interaction.editReply('Ocorreu um erro. O server pode estar offline')
                    }
                    else {
                        const playersOnline = response.players.online
                        const playersList = response.players.list


                        let stringResponse = `${playersOnline} jogadores online:\n\``
                        playersList.forEach(element => {
                            console.log(element.name_clean);
                            stringResponse = stringResponse.concat(element.name_clean+'\n')
                        });
                        stringResponse = stringResponse.concat('\`')

                        await interaction.editReply({content: stringResponse})
                    }
                }
        }
    }
}