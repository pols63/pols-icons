const ph = require('pols-helper');
const fs = require('fs');
const path = require('path');

module.exports = {
	create: function (fontName) {
		var pathDest = process.cwd();
		var configFile = path.resolve(pathDest, 'config.json');
		var pathIcons = path.resolve(pathDest, 'icons');
		if (!fs.existsSync(configFile)) {
			fs.writeFileSync(configFile, JSON.stringify({ fontName: fontName }, null, "\t"), { encoding: 'utf8' });
			ph.showMessage("Archivo '" + configFile + "' creado.");
		} else {
			ph.showMessage("El archivo '" + configFile + "' ya existe y no se ha creado uno nuevo.");
		}
		ph.mkDir(pathIcons);
	},
	compile: function () {
		/* Nombre de la fuente */
		var pathName = process.cwd();
		var configFile = path.resolve(pathName, 'config.json');

		/* Valida que exista el archivo de configuración */
		if (!fs.existsSync(configFile)) ph.showError("No existe el archivo de definición '" + configFile + "'.");
		var config = require(configFile);
		(config.fontName) || ph.showError("No se ha definido la propiedad 'fontName' en el archivo de configuración.");
		var fontName = config.fontName;

		/* Crea la carpeta de destino */
		var directoryDist = path.resolve(pathName, 'dist');
		ph.mkDir(directoryDist);

		/* Valida la existencia de la carpeta de íconos. */
		var directorySrc = path.resolve(pathName, 'icons');
		if (!fs.existsSync(directorySrc)) ph.showError("No existe la carpeta de íconos '" + directorySrc + "'.");

		try {
			require('icon.font')({
				fontName: fontName,
				src: directorySrc,
				dest: directoryDist,
				configFile: configFile,
				saveConfig: true,
				image: false,
				html: true,
				htmlTemplate: path.resolve(__dirname, 'resources', 'html.hbs'),
				outputHtml: true,
				css: true,
				cssTemplate: path.resolve(__dirname, 'resources', 'css.hbs'),
				outputCss: true,
				fixedWidth: true,
				normalize: true,
				silent: false,
				types: ['woff2', 'woff', 'ttf', 'eot', 'svg'],
				templateOptions: {
					classPrefix: 'ic-',
					baseSelector: 'pf-' + fontName.toLowerCase(),
					pathNameLower: fontName.toLowerCase()
					//baseClassname: '_icon',
				},
				codepointRanges: [
					[97, 122], // a - z
					[65, 90], // A - Z
					[48, 57], // 0 - 9
					[0xe001, Infinity] //57345 - infinito
				]
			}).then(function () {
				let directoryFinal = path.resolve(directoryDist, fontName.toLowerCase());
				ph.mkDir(directoryFinal);

				let arreglo = ['css', 'eot', 'svg', 'ttf', 'woff', 'woff2'];
				arreglo.forEach(function (extension) {
					fs.copyFileSync(path.resolve(directoryDist, fontName + '.' + extension), path.resolve(directoryFinal, fontName.toLowerCase() + '.' + extension));
					fs.unlinkSync(path.resolve(directoryDist, fontName.toLowerCase() + '.' + extension));
				});
				fs.renameSync(path.resolve(directoryDist, fontName + '.html'), path.resolve(directoryDist, 'index.html'));

				/* Actualiza el archivo de configuración */
				// var config2 = require(configFile);
				// console.log(config2);
				// fs.writeFileSync(configFile, JSON.stringify(config2, null, "\t"), 'utf8');
				ph.showSuccess("Fuente creada.");
			});
		} catch (err) {
			console.log(err);
		}
	}
};