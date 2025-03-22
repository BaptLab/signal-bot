import dotenv from "dotenv";
dotenv.config(); // Charge les variables d'environnement

import { exec } from "child_process";
import { generateLillianeResponse } from "./openAIService.mjs";
import logger from "./utils/logger.js";
import config from "./config.js";

let isListening = false;

function listenForMessages() {
	if (isListening) return;
	isListening = true;

	logger.info("🔍 Écoute des messages en cours...");

	exec(`cmd /c ${config.SIGNAL_CLI_PATH} -u ${config.PHONE_NUMBER} receive --ignore-attachments`, (error, stdout, stderr) => {
		isListening = false;

		if (error) {
			logger.error(`❌ Erreur d'exécution : ${error.message}`);
			return;
		}
		if (stderr) {
			logger.warn(`⚠️ Erreur stderr : ${stderr}`);
		}

		logger.info("📥 Réponse brute reçue de signal-cli:");
		logger.debug(stdout);

		const messages = parseSignalResponse(stdout);

		messages.forEach(async (msg) => {
			logger.message(msg.groupId || msg.sender, msg.text);

			// Vérifie si le message contient l'un des alias de Lilliane
			const aliases = ["lilliane", "liliane", "lillianne", "lilianne"];
			if (aliases.some((alias) => msg.text.toLowerCase().includes(alias))) {
				const response = await generateLillianeResponse(msg.text);

				if (msg.groupId) {
					sendMessageToGroup(msg.groupId, response);
				} else {
					sendMessage(msg.sender, response);
				}
			}
		});

		// Relance l'écoute
		listenForMessages();
	});
}

/**
 * Parse la sortie de signal-cli et retourne un tableau d'objets message
 * avec { sender, groupId, text }.
 */
function parseSignalResponse(response) {
	// Découper la réponse en blocs sur "Envelope from:"
	const envelopes = response.split("Envelope from:");
	const messages = [];

	for (const block of envelopes) {
		if (block.trim() === "") continue;

		const envelope = "Envelope from:" + block;

		// Extraction du numéro de l'expéditeur (premier numéro rencontré)
		const senderMatch = envelope.match(/Envelope from:.*?(\+\d{9,})/);
		const sender = senderMatch ? senderMatch[1] : null;

		// Extraction du corps du message (Body)
		const bodyMatch = envelope.match(/Body:\s*(.+)/);
		const text = bodyMatch ? bodyMatch[1].trim() : null;

		// Extraction de l'ID du groupe s'il existe (on accepte aussi les retours à la ligne et espaces)
		let groupId = null;
		const groupInfoMatch = envelope.match(/Group info:\s*[\r\n]+\s*Id:\s*([^\r\n]+)/i);
		if (groupInfoMatch) {
			groupId = groupInfoMatch[1].trim();
		}

		if ((sender || groupId) && text) {
			messages.push({ sender, groupId, text });
		}
	}
	return messages;
}

function sendMessage(number, message) {
	logger.info(`📤 Envoi d'un message à ${number} : "${message}"`);
	exec(`cmd /c ${config.SIGNAL_CLI_PATH} -u ${config.PHONE_NUMBER} send -m "${message}" ${number}`, (error, stdout, stderr) => {
		if (error) {
			logger.error(`❌ Erreur d'envoi : ${error.message}`);
		}
		if (stderr) {
			logger.warn(`⚠️ Erreur stderr : ${stderr}`);
		}
		logger.info(`✅ Message envoyé avec succès à ${number}`);
	});
}

function sendMessageToGroup(groupId, message) {
	logger.info(`📤 Envoi d'un message au groupe ${groupId} : "${message}"`);
	// La syntaxe peut varier selon votre version de signal-cli.
	exec(`cmd /c ${config.SIGNAL_CLI_PATH} -u ${config.PHONE_NUMBER} send --group ${groupId} -m "${message}"`, (error, stdout, stderr) => {
		if (error) {
			logger.error(`❌ Erreur d'envoi (groupe) : ${error.message}`);
		}
		if (stderr) {
			logger.warn(`⚠️ Erreur stderr (groupe) : ${stderr}`);
		}
		logger.info(`✅ Message envoyé avec succès au groupe ${groupId}`);
	});
}

// Démarre l'écoute dès l'exécution du script
listenForMessages();
