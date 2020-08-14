import clear from "clear";
import chalk from "chalk";
import figlet from "figlet";
import ora from "ora";
import terminalLink from "terminal-link";

import inquirer from "./inquirer/inquirer";
import { SigningMethods, Actions, TokenFaucetType } from "./types";
import setupSigner from "./lib/setupSigner";
import tokenFaucetInteractions from "./lib/tokenFaucetInteractions";
import { tokenFaucets } from "./utils";

(async () => {
  // setup
  clear();
  console.log(
    chalk.yellow(figlet.textSync("Taquito", { horizontalLayout: "full" }))
  );

  /*
   * SET UP SIGNER
   */
  const { network, publicKeyHash, Tezos, signingMethod } = await setupSigner();

  // at this point, the public key hash must be known
  if (publicKeyHash) {
    console.log("Public key:", chalk.yellow.bold(publicKeyHash));
    // gets the user's balance
    const balance = await Tezos.tz.getBalance(publicKeyHash);
    if (balance) {
      console.log(
        "Balance for this address:",
        chalk.white.bold(
          "XTZ " + (balance.toNumber() / 1000000).toLocaleString("en-US")
        )
      );
    } else {
      console.log("No balance");
    }

    while (true) {
      // SELECT ACTION
      console.log(" ");
      const { selectAction } = await inquirer.selectAction(network);
      if (selectAction === Actions.Transfer) {
        /*
         * TRANSFER
         */
        const {
          inputAddress,
          inputAmount,
          confirmTx
        } = await inquirer.inputTransfer();

        if (confirmTx) {
          let spinner1, spinner2;
          if (signingMethod === SigningMethods.LedgerNano) {
            console.log("Please confirm the transfer on your Ledger Nano...");
          }

          try {
            spinner1 = ora({
              text: "Preparing your transfer",
              color: "cyan"
            }).start();
            // prepare for transfer
            const op = await Tezos.contract.transfer({
              to: inputAddress,
              amount: inputAmount
            });
            // creates clickable link in terminal emulators
            const link = terminalLink(
              op.hash,
              `https://${network.slice(0, -3)}.tzkt.io/${op.hash}`
            );
            spinner1.succeed("Transaction sent! Hash: " + link);
            spinner2 = ora({
              text: "Waiting for confirmation",
              color: "cyan"
            }).start();
            await op.confirmation();
            spinner2.succeed("Transaction successful!");
          } catch (error) {
            // clears spinners if necessary
            if (spinner1) spinner1.stop();
            if (spinner2) spinner2.stop();
            console.log(chalk.red("Error while processing the transfer"));
            console.log(error);
          }
        }
      } else if (
        selectAction === Actions.TokenFaucet ||
        selectAction === Actions.TokenFaucetTransfer
      ) {
        /*
         * TOKEN FAUCET INTERACTION
         */
        await tokenFaucetInteractions({
          Tezos,
          publicKeyHash,
          selectAction,
          signingMethod,
          network
        });
      } else if (selectAction === Actions.Exit) {
        /*
         * EXIT TERMINAL
         */
        break;
      }
    }
  }
})();
