const Colors = require('colors');
const fs = require('fs');

/* Capitaliza cada palabra de un texto. */
String.prototype.capitalize = function () {
	return this.replace(/(?:^|\s)\S/g, function (a) {
		return a.toUpperCase();
	});
};

/* Reemplaza una cadena por otra dentro de una cadena. */
String.prototype.strongReplace = function(search, replace) {
	return this.split(search).join(replace);
};

module.exports = {
	showError: function (message, terminate = true) {
		console.log(message.bgRed);
		(!terminate) || process.exit();
	},
	showSuccess: function (message, terminate = true) {
		console.log(message.bgGreen);
		(!terminate) || process.exit();
	},
	showCommads: function (commands = [], terminate = true) {
		console.log("Comandos permitidos:".bgBlue);
		commands.forEach(function(command, i) {
			console.log('-> ' + command.green);
		});
		(!terminate) || process.exit();
	},
	showMessage: function (message) {
		console.log(message.yellow);
	},
	mkDir(path) {
		if (fs.existsSync(path)) {
			this.showMessage("Ya existe la carpeta '" + path + "'.");
		} else {
			fs.mkdirSync(path);
			this.showMessage("Carpeta creada '" + path + "'.");
		}
	}
}