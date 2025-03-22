import chalk from "chalk";

export default {
	info: (msg) => console.log(chalk.blue("ℹ️  INFO:"), msg),
	success: (msg) => console.log(chalk.green("✅ SUCCESS:"), msg),
	warn: (msg) => console.log(chalk.yellow("⚠️  WARNING:"), msg),
	error: (msg) => console.error(chalk.red("❌ ERROR:"), msg),
	bot: (msg) => console.log(chalk.magenta("🤖 Lilliane:"), msg),
	user: (msg) => console.log(chalk.cyan("👤 Message reçu:"), msg),
	debug: (msg) => console.log(chalk.gray("🐞 DEBUG:"), msg),
	message: (sender, text) => console.log(chalk.cyan("👤 Message reçu:"), sender, text),
};
