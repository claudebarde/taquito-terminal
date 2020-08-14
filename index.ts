import clear from "clear";
import chalk from "chalk";
import figlet from "figlet";
import ora from "ora";
import terminalLink from "terminal-link";

import inquirer from "./inquirer/inquirer";
import { SigningMethods, Actions, TokenFaucetType } from "./types";
import setupSigner from "./lib/setupSigner";
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
        const { selectTokenFaucet } = await inquirer.selectTokenFaucet();
        if (selectTokenFaucet === TokenFaucetType.FA12) {
          // FA1.2
        } else if (selectTokenFaucet === TokenFaucetType.FA2_FT) {
          // FA2 Fungible tokens
          const loadingBalance = ora({
            text: "Searching for your token balance",
            color: "cyan"
          }).start();
          // creates instance of contract
          const contract = await Tezos.contract.at(tokenFaucets.FA2_FT);
          // creates storage
          const storage: any = await contract.storage();
          // gets user's token balance
          const balance = await storage.assets.ledger.get(publicKeyHash);
          if (balance) {
            loadingBalance.info(
              `Your token balance: ${chalk.bold(
                balance.toNumber() + " tokens"
              )}`
            );
          } else {
            loadingBalance.info("No balance");
          }

          if (selectAction === Actions.TokenFaucet) {
            const {
              inputAddress,
              inputAmount,
              confirmTx
            } = await inquirer.inputFaucetMinting("fungible");

            if (confirmTx) {
              let spinner1, spinner2;
              if (signingMethod === SigningMethods.LedgerNano) {
                console.log(
                  "Please confirm the transfer on your Ledger Nano..."
                );
              }

              try {
                spinner1 = ora({
                  text: "Preparing your tokens",
                  color: "cyan"
                }).start();
                // prepare for transfer
                let owner;
                if (inputAddress === "own") {
                  owner = publicKeyHash;
                } else {
                  owner = inputAddress;
                }
                const op = await contract.methods
                  .mint_tokens([{ owner, amount: inputAmount }])
                  .send();
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
          } else if (selectAction === Actions.TokenFaucetTransfer) {
            const {
              recipient,
              inputAmount,
              confirmTx
            } = await inquirer.inputFaucetTransfer("fungible");

            if (confirmTx) {
              let spinner1, spinner2;
              if (signingMethod === SigningMethods.LedgerNano) {
                console.log(
                  "Please confirm the transfer on your Ledger Nano..."
                );
              }

              try {
                spinner1 = ora({
                  text: "Preparing your transfer",
                  color: "cyan"
                }).start();
                // prepare for transfer
                let owner;
                if (recipient === "own") {
                  owner = publicKeyHash;
                } else {
                  owner = recipient;
                }
                const transfer = [
                  {
                    from_: publicKeyHash,
                    txs: [{ to_: recipient, token_id: 0, amount: inputAmount }]
                  }
                ];
                const op = await contract.methods.transfer(transfer).send();
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
          }
        } else if (selectTokenFaucet === TokenFaucetType.FA2_NFT) {
          // non fungible tokens
        }
      } else if (selectAction === Actions.Exit) {
        /*
         * EXIT TERMINAL
         */
        break;
      }
    }
  }
})();
