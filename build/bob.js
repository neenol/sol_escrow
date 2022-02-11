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
var bob = function () { return __awaiter(void 0, void 0, void 0, function () {
    var bobKeypair, bobXTokenAccountPubkey, bobYTokenAccountPubkey, escrowStateAccountPubkey, escrowProgramId, terms, connection, escrowAccount, encodedEscrowState, decodedEscrowLayout, escrowState, PDA, exchangeInstruction, aliceYTokenAccountPubkey, _a, aliceYbalance, bobXbalance, newAliceYbalance, newBobXbalance, _b, _c, _d, _e;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                bobKeypair = (0, utils_1.getKeypair)("bob");
                bobXTokenAccountPubkey = (0, utils_1.getPublicKey)("bob_x");
                bobYTokenAccountPubkey = (0, utils_1.getPublicKey)("bob_y");
                escrowStateAccountPubkey = (0, utils_1.getPublicKey)("escrow");
                escrowProgramId = (0, utils_1.getProgramId)();
                terms = (0, utils_1.getTerms)();
                connection = new web3_js_1.Connection("http://localhost:8899", "confirmed");
                return [4 /*yield*/, connection.getAccountInfo(escrowStateAccountPubkey)];
            case 1:
                escrowAccount = _g.sent();
                if (escrowAccount === null) {
                    (0, utils_1.logError)("Could not find escrow at given address!");
                    process.exit(1);
                }
                encodedEscrowState = escrowAccount.data;
                decodedEscrowLayout = utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
                escrowState = {
                    escrowAccountPubkey: escrowStateAccountPubkey,
                    isInitialized: !!decodedEscrowLayout.isInitialized,
                    initializerAccountPubkey: new web3_js_1.PublicKey(decodedEscrowLayout.initializerPubkey),
                    XTokenTempAccountPubkey: new web3_js_1.PublicKey(decodedEscrowLayout.initializerTempTokenAccountPubkey),
                    initializerYTokenAccount: new web3_js_1.PublicKey(decodedEscrowLayout.initializerReceivingTokenAccountPubkey),
                    expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le")
                };
                return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([Buffer.from("escrow")], escrowProgramId)];
            case 2:
                PDA = _g.sent();
                exchangeInstruction = new web3_js_1.TransactionInstruction({
                    programId: escrowProgramId,
                    data: Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray([1], new BN(terms.bobExpectedAmount).toArray("le", 8), false))),
                    keys: [
                        { pubkey: bobKeypair.publicKey, isSigner: true, isWritable: false },
                        { pubkey: bobYTokenAccountPubkey, isSigner: false, isWritable: true },
                        { pubkey: bobXTokenAccountPubkey, isSigner: false, isWritable: true },
                        {
                            pubkey: escrowState.XTokenTempAccountPubkey,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: escrowState.initializerAccountPubkey,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: escrowState.initializerYTokenAccount,
                            isSigner: false,
                            isWritable: true
                        },
                        { pubkey: escrowStateAccountPubkey, isSigner: false, isWritable: true },
                        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                        { pubkey: PDA[0], isSigner: false, isWritable: false },
                    ]
                });
                aliceYTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_y");
                return [4 /*yield*/, Promise.all([
                        (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection),
                        (0, utils_1.getTokenBalance)(bobXTokenAccountPubkey, connection),
                    ])];
            case 3:
                _a = _g.sent(), aliceYbalance = _a[0], bobXbalance = _a[1];
                console.log("Sending Bob's transaction...");
                return [4 /*yield*/, connection.sendTransaction(new web3_js_1.Transaction().add(exchangeInstruction), [bobKeypair], { skipPreflight: false, preflightCommitment: "confirmed" })];
            case 4:
                _g.sent();
                // sleep to allow time to update
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
            case 5:
                // sleep to allow time to update
                _g.sent();
                return [4 /*yield*/, connection.getAccountInfo(escrowStateAccountPubkey)];
            case 6:
                if ((_g.sent()) !== null) {
                    (0, utils_1.logError)("Escrow account has not been closed");
                    process.exit(1);
                }
                return [4 /*yield*/, connection.getAccountInfo(escrowState.XTokenTempAccountPubkey)];
            case 7:
                if ((_g.sent()) !==
                    null) {
                    (0, utils_1.logError)("Temporary X token account has not been closed");
                    process.exit(1);
                }
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection)];
            case 8:
                newAliceYbalance = _g.sent();
                if (newAliceYbalance !== aliceYbalance + terms.aliceExpectedAmount) {
                    (0, utils_1.logError)("Alice's Y balance should be " + (aliceYbalance + terms.aliceExpectedAmount) + " but is " + newAliceYbalance);
                    process.exit(1);
                }
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(bobXTokenAccountPubkey, connection)];
            case 9:
                newBobXbalance = _g.sent();
                if (newBobXbalance !== bobXbalance + terms.bobExpectedAmount) {
                    (0, utils_1.logError)("Bob's X balance should be " + (bobXbalance + terms.bobExpectedAmount) + " but is " + newBobXbalance);
                    process.exit(1);
                }
                console.log("✨Trade successfully executed. All temporary accounts closed✨\n");
                _c = (_b = console).table;
                _f = {};
                _d = "Alice Token Account X";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("alice_x"), connection)];
            case 10:
                _f[_d] = _g.sent(),
                    _f["Alice Token Account Y"] = newAliceYbalance,
                    _f["Bob Token Account X"] = newBobXbalance;
                _e = "Bob Token Account Y";
                return [4 /*yield*/, (0, utils_1.getTokenBalance)(bobYTokenAccountPubkey, connection)];
            case 11:
                _c.apply(_b, [[
                        (_f[_e] = _g.sent(),
                            _f)
                    ]]);
                console.log("");
                return [2 /*return*/];
        }
    });
}); };
bob();
