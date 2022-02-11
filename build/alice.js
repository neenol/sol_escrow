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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var BN = require("bn.js");
var utils_1 = require("./utils");
var alice = function () { return __awaiter(void 0, void 0, void 0, function () {
    var escrowProgramId, terms, aliceXTokenAccountPubkey, aliceYTokenAccountPubkey, XTokenMintPubkey, aliceKeypair, tempXTokenAccountKeypair, connection, createTempTokenAccountIx, _a, _b, initTempAccountIx, transferXTokensToTempAccIx, escrowKeypair, createEscrowAccountIx, _c, _d, initEscrowIx, tx, escrowAccount, encodedEscrowState, decodedEscrowState, _e, _f, _g, _h, _j, _k, _l;
    var _m, _o, _p;
    return __generator(this, function (_q) {
        switch (_q.label) {
            case 0:
                escrowProgramId = (0, utils_1.getProgramId)();
                terms = (0, utils_1.getTerms)();
                aliceXTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_x");
                aliceYTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_y");
                XTokenMintPubkey = (0, utils_1.getPublicKey)("mint_x");
                aliceKeypair = (0, utils_1.getKeypair)("alice");
                tempXTokenAccountKeypair = new web3_js_1.Keypair();
                connection = new web3_js_1.Connection("http://localhost:8899", "confirmed");
                _b = (_a = web3_js_1.SystemProgram).createAccount;
                _m = {
                    programId: spl_token_1.TOKEN_PROGRAM_ID,
                    space: spl_token_1.AccountLayout.span
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span)];
            case 1:
                createTempTokenAccountIx = _b.apply(_a, [(_m.lamports = _q.sent(),
                        _m.fromPubkey = aliceKeypair.publicKey,
                        _m.newAccountPubkey = tempXTokenAccountKeypair.publicKey,
                        _m)]);
                initTempAccountIx = spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, XTokenMintPubkey, tempXTokenAccountKeypair.publicKey, aliceKeypair.publicKey);
                transferXTokensToTempAccIx = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, aliceXTokenAccountPubkey, tempXTokenAccountKeypair.publicKey, aliceKeypair.publicKey, [], terms.bobExpectedAmount);
                escrowKeypair = new web3_js_1.Keypair();
                _d = (_c = web3_js_1.SystemProgram).createAccount;
                _o = {
                    space: utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.span
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.span)];
            case 2:
                createEscrowAccountIx = _d.apply(_c, [(_o.lamports = _q.sent(),
                        _o.fromPubkey = aliceKeypair.publicKey,
                        _o.newAccountPubkey = escrowKeypair.publicKey,
                        _o.programId = escrowProgramId,
                        _o)]);
                initEscrowIx = new web3_js_1.TransactionInstruction({
                    programId: escrowProgramId,
                    keys: [
                        { pubkey: aliceKeypair.publicKey, isSigner: true, isWritable: false },
                        {
                            pubkey: tempXTokenAccountKeypair.publicKey,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: aliceYTokenAccountPubkey,
                            isSigner: false,
                            isWritable: false
                        },
                        { pubkey: escrowKeypair.publicKey, isSigner: false, isWritable: true },
                        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    ],
                    data: Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray([0], new BN(terms.aliceExpectedAmount).toArray("le", 8), false)))
                });
                tx = new web3_js_1.Transaction().add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
                console.log("Sending Alice's transaction...");
                return [4 /*yield*/, connection.sendTransaction(tx, [aliceKeypair, tempXTokenAccountKeypair, escrowKeypair], { skipPreflight: false, preflightCommitment: "confirmed" })];
            case 3:
                _q.sent();
                // sleep to allow time to update
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
            case 4:
                // sleep to allow time to update
                _q.sent();
                return [4 /*yield*/, connection.getAccountInfo(escrowKeypair.publicKey)];
            case 5:
                escrowAccount = _q.sent();
                if (escrowAccount === null || escrowAccount.data.length === 0) {
                    (0, utils_1.logError)("Escrow state account has not been initialized properly");
                    process.exit(1);
                }
                encodedEscrowState = escrowAccount.data;
                decodedEscrowState = utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
                if (!decodedEscrowState.isInitialized) {
                    (0, utils_1.logError)("Escrow state initialization flag has not been set");
                    process.exit(1);
                }
                else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerPubkey).equals(aliceKeypair.publicKey)) {
                    (0, utils_1.logError)("InitializerPubkey has not been set correctly / not been set to Alice's public key");
                    process.exit(1);
                }
                else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerReceivingTokenAccountPubkey).equals(aliceYTokenAccountPubkey)) {
                    (0, utils_1.logError)("initializerReceivingTokenAccountPubkey has not been set correctly / not been set to Alice's Y public key");
                    process.exit(1);
                }
                else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerTempTokenAccountPubkey).equals(tempXTokenAccountKeypair.publicKey)) {
                    (0, utils_1.logError)("initializerTempTokenAccountPubkey has not been set correctly / not been set to temp X token account public key");
                    process.exit(1);
                }
                console.log("\u2728Escrow successfully initialized. Alice is offering " + terms.bobExpectedAmount + "X for " + terms.aliceExpectedAmount + "Y\u2728\n");
                (0, utils_1.writePublicKey)(escrowKeypair.publicKey, "escrow");
                _f = (_e = console).table;
                _p = {};
                _g = "Alice Token Account X";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(aliceXTokenAccountPubkey, connection)];
            case 6:
                _p[_g] = _q.sent();
                _h = "Alice Token Account Y";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection)];
            case 7:
                _p[_h] = _q.sent();
                _j = "Bob Token Account X";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("bob_x"), connection)];
            case 8:
                _p[_j] = _q.sent();
                _k = "Bob Token Account Y";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("bob_y"), connection)];
            case 9:
                _p[_k] = _q.sent();
                _l = "Temporary Token Account X";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(tempXTokenAccountKeypair.publicKey, connection)];
            case 10:
                _f.apply(_e, [[
                        (_p[_l] = _q.sent(),
                            _p)
                    ]]);
                console.log("");
                return [2 /*return*/];
        }
    });
}); };
alice();
