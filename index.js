const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs')
const path = require('node:path');
const { request } = require('undici');
const token = process.env.DISCORD_TOKEN

const client = new Client({ intents: [GatewayIntentBits.Guilds]})

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.once(Events.ClientReady, c => {
    console.log(`Pronto! Logado como ${c.user.tag}`)

	// checa a cada 5 minutos o estado do servidor. desliga em caso de inatividade
	setInterval(async () =>{
		console.log("Checagem de players online")

		const { statusCode, body } = await request('https://api.mcstatus.io/v2/status/java/54.205.108.34')
		if (statusCode == 200) {
			const { online, players } = await body.json()

			if (online && players.online == 0) {
				console.log("Não há players online. Encerrando server...")
				const encerrar = await request('https://hrgt3asmotbyt3mx67qrkr2lji0qyfuz.lambda-url.us-east-1.on.aws/?operation=0')
				if(encerrar.statusCode == 200) console.log("Servidor encerrado devido a inatividade.")

			}
			else if (online && players.online > 0) {
				console.log("Há players online.")
			}
			else {
				console.log("Server está ofline no momento.")
			}
		}
		else {
			console.log("Não foi possível checar o estado do server.")
		}
	}, 600000)
})

client.login(token)