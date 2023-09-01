"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.create = exports.help = void 0;
const help_1 = __importDefault(require("./commands/help"));
exports.help = help_1.default;
const create_1 = __importDefault(require("./commands/create"));
exports.create = create_1.default;
const compile_1 = __importDefault(require("./commands/compile"));
exports.compile = compile_1.default;
