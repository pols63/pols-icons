"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Themes = void 0;
const fs = require("fs");
const path = require("path");
const utilities_1 = require("./utilities");
var Themes;
(function (Themes) {
    Themes["info"] = "info";
    Themes["success"] = "success";
    Themes["warning"] = "warning";
    Themes["error"] = "error";
    Themes["debug"] = "debug";
})(Themes || (exports.Themes = Themes = {}));
const logger = ({ label, description, body, exit = false, theme = Themes.info, tags = [], showInConsole = true, logPath, date = null }) => {
    let bgColor = 'bg-cyan';
    let fgColor = 'fg-black';
    switch (theme) {
        case Themes.error:
            fgColor = 'fg-white';
            bgColor = 'bg-red';
            break;
        case Themes.warning:
            bgColor = 'bg-yellow';
            break;
        case Themes.success:
            bgColor = 'bg-green';
            break;
    }
    const now = date ?? new Date;
    const nowString = utilities_1.Utilities.Date.format(now, '@dd/@mm/@y @hh:@ii:@ss');
    if (showInConsole) {
        const logMethod = theme == Themes.error ? 'error' : 'log';
        const headers = [
            utilities_1.Utilities.String.ansiColor(`<${bgColor}><${fgColor}><bright> ${label} >>> </bright></${fgColor}></${bgColor}>`)
        ];
        if (description)
            headers.push(utilities_1.Utilities.String.ansiColor(`<bg-white><fg-black> ${description} </fg-black></bg-white>`));
        headers.push(...tags.map(t => utilities_1.Utilities.String.ansiColor(`<bg-blue><fg-black> ${t} </fg-black></bg-blue>`)));
        console.log(headers.join(' '));
        if (body instanceof Array) {
            for (const b of body) {
                console[logMethod](b);
            }
        }
        else if (body instanceof Error) {
            console[logMethod](body.stack);
        }
        else if (typeof body == 'string') {
            console[logMethod](body);
        }
    }
    if (logPath) {
        if (!fs.existsSync(logPath)) {
            try {
                fs.mkdirSync(logPath);
            }
            catch (err) {
                return (0, exports.logger)({ label: 'LOG', description: `Ocurrió un error al intentar crear el directorio para los logs del sistema en '${logPath}'`, body: err, exit: true, showInConsole: true });
            }
        }
    }
    const headers = [
        (() => {
            switch (theme) {
                case Themes.error:
                    return '[ ERROR ]';
                case Themes.warning:
                    return '[ WARNING ]';
                case Themes.success:
                    return '[ SUCCESS ]';
                case Themes.info:
                    return '[ INFO ]';
                case Themes.debug:
                    return '[ DEBUG ]';
            }
        })(),
        `[ ${nowString} ]`,
        `[ ${label} >>> ]`
    ];
    if (description)
        headers.push(description);
    headers.push(...tags.map(t => `[ ${t} ]`));
    let bodyFile = '';
    if (body instanceof Array) {
        bodyFile = body.join('\n');
    }
    else if (body instanceof Error) {
        bodyFile = body.stack ?? '';
    }
    else if (typeof body == 'string') {
        bodyFile = body;
    }
    const response = `${headers.join(' ')}${bodyFile ? `\n${bodyFile}` : ''}`;
    if (logPath)
        fs.appendFileSync(path.join(logPath, `LOGS ${utilities_1.Utilities.Date.format(now, '@y-@mm-@dd')}.log`), `${response}\n`, { encoding: 'utf-8' });
    if (exit)
        process.exit();
    return response;
};
exports.logger = logger;
