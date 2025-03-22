import OpenAI from "openai";
import config from "./config.js";
import logger from "./utils/logger.js";

const openai = new OpenAI({
	apiKey: config.openai.apiKey,
});

/**
 * Génère une réponse au message en tenant compte du persona de Lilliane.
 * @param {string} userMessage - Le message reçu de l'utilisateur
 * @returns {Promise<string>} - La réponse générée par l'IA
 */
export async function generateLillianeResponse(userMessage) {
	logger.info("Appel à OpenAI pour générer une réponse...");

	try {
		const chatCompletion = await openai.chat.completions.create({
			model: config.openai.model || "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: config.openai.persona,
				},
				{
					role: "user",
					content: userMessage,
				},
			],
		});
		console.log("Using model:", config.openai.model);

		const answer = chatCompletion.choices[0].message.content.trim();
		logger.bot(answer);
		return answer;
	} catch (error) {
		logger.error("Échec lors de la génération de réponse depuis OpenAI:");
		logger.error(error.message);
		return "Je suis confuse, je ne peux pas répondre pour le moment.";
	}
}
