import inquirer from "inquirer";
import { SigningMethods, Networks, Actions, TokenFaucetType } from "../types";
import { validateAddress } from "@taquito/utils";

interface Question {
  name: string;
  type: "input" | "list" | "confirm" | "password";
  message: string;
  choices?: string[];
  validate?: (any) => any;
}

export default {
  selectNetwork: () =>
    inquirer.prompt([
      {
        name: "selectNetwork",
        type: "list",
        message: "Which network do you want to connect to?",
        choices: [Networks.Test, Networks.Main]
      }
    ] as Question[]),
  signingMethod: () =>
    inquirer.prompt([
      {
        name: "signingMethod",
        type: "list",
        message: "How would you like to sign transactions?",
        choices: [SigningMethods.LedgerNano, SigningMethods.PrivateKey]
      }
    ] as Question[]),
  selectAction: network =>
    inquirer.prompt([
      {
        name: "selectAction",
        type: "list",
        message: "What would you like to do?",
        choices:
          network === Networks.Test.toLowerCase()
            ? [
                Actions.Transfer,
                Actions.TokenFaucet,
                Actions.InteractWithContract,
                Actions.Exit
              ]
            : [Actions.Transfer, Actions.InteractWithContract, Actions.Exit]
      }
    ] as Question[]),
  inputPrivateKey: () =>
    inquirer.prompt([
      {
        name: "inputPrivateKey",
        type: "password",
        message: "Please input the private key:",
        validate: value => {
          if (value.slice(0, 4) === "edsk") {
            return true;
          } else {
            return "Please input a valid key.";
          }
        }
      }
    ] as Question[]),
  inputTransfer: () =>
    inquirer.prompt([
      {
        name: "inputAddress",
        type: "input",
        message: "Please input the address:",
        validate: value => {
          if (validateAddress(value) === 3) {
            return true;
          } else {
            return "Please input a valid address.";
          }
        }
      },
      {
        name: "inputAmount",
        type: "input",
        message: "Please input the amount:",
        validate: value => {
          if (!isNaN(value)) {
            return true;
          } else {
            return "Please input a valid amount.";
          }
        }
      },
      {
        name: "confirmTx",
        type: "confirm",
        message: "Are you sure you want to proceed with this transfer?"
      }
    ] as Question[]),
  selectTokenFaucet: () =>
    inquirer.prompt([
      {
        name: "selectTokenFaucet",
        type: "list",
        message: "What kind of token do you want to get?",
        choices: [
          TokenFaucetType.FA12,
          TokenFaucetType.FA2_FT,
          TokenFaucetType.FA2_NFT
        ]
      }
    ] as Question[]),
  inputFaucetTransfer: tokenType =>
    inquirer.prompt([
      {
        name: "inputAddress",
        type: "input",
        message:
          'Address to send the tokens to (type "own" for signer\'s address):',
        validate: value => {
          if (validateAddress(value) === 3 || value === "own") {
            return true;
          } else {
            return "Please input a valid address.";
          }
        }
      },
      {
        name: "inputAmount",
        type: "input",
        message: "Amount of tokens requested:",
        validate: value => {
          if (!isNaN(value)) {
            if (tokenType === "fungible") {
              if (value > 0 && value <= 100) {
                return true;
              } else {
                return "Maximum amount for fungible tokens is 100";
              }
            } else if (tokenType === "non-fungible") {
              if (value > 0 && value <= 10) {
                return true;
              } else {
                return "Maximum amount for non fungible tokens is 10";
              }
            } else {
              return "Please input a valid amount";
            }
          } else {
            return "Please input a valid amount.";
          }
        }
      },
      {
        name: "confirmTx",
        type: "confirm",
        message: "Are you sure you want to proceed with this request?"
      }
    ])
};
