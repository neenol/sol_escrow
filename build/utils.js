"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ESCROW_ACCOUNT_DATA_LAYOUT = exports.getTokenBalance = exports.getTerms = exports.getProgramId = exports.getKeypair = exports.getPrivateKey = exports.getPublicKey = exports.writePublicKey = exports.logError = void 0;
var web3_js_1 = require("@solana/web3.js");
//@ts-expect-error missing types
var BufferLayout = require("buffer-layout");
var fs = require("fs");
var logError = function (msg) {
    console.log("\u001B[31m" + msg + "\u001B[0m");
};
exports.logError = logError;
var writePublicKey = function (publicKey, name) {
    fs.writeFileSync("./keys/" + name + "_pub.json", JSON.stringify(publicKey.toString()));
};
exports.writePublicKey = writePublicKey;
var getPublicKey = function (name) {
    return new web3_js_1.PublicKey(JSON.parse(fs.readFileSync("./keys/" + name + "_pub.json")));
};
exports.getPublicKey = getPublicKey;
var getPrivateKey = function (name) {
    return Uint8Array.from(JSON.parse(fs.readFileSync("./keys/" + name + ".json")));
};
exports.getPrivateKey = getPrivateKey;
var getKeypair = function (name) {
    return new web3_js_1.Keypair({
        publicKey: (0, exports.getPublicKey)(name).toBytes(),
        secretKey: (0, exports.getPrivateKey)(name)
    });
};
exports.getKeypair = getKeypair;
var getProgramId = function () {
    try {
        return (0, exports.getPublicKey)("program");
    }
    catch (e) {
        (0, exports.logError)("Given programId is missing or incorrect");
        process.exit(1);
    }
};
exports.getProgramId = getProgramId;
var getTerms = function () {
    return JSON.parse(fs.readFileSync("./terms.json"));
};
exports.getTerms = getTerms;
var getTokenBalance = function (pubkey, connection) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = parseInt;
                return [4 /*yield*/, connection.getTokenAccountBalance(pubkey)];
            case 1: return [2 /*return*/, _a.apply(void 0, [(_b.sent()).value.amount])];
        }
    });
}); };
exports.getTokenBalance = getTokenBalance;
/**
 * Layout for a public key
 */
var publicKey = function (property) {
    if (property === void 0) { property = "publicKey"; }
    return BufferLayout.blob(32, property);
};
/**
 * Layout for a 64bit unsigned value
 */
var uint64 = function (property) {
    if (property === void 0) { property = "uint64"; }
    return BufferLayout.blob(8, property);
};
exports.ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    publicKey("initializerPubkey"),
    publicKey("initializerTempTokenAccountPubkey"),
    publicKey("initializerReceivingTokenAccountPubkey"),
    uint64("expectedAmount"),
]);
