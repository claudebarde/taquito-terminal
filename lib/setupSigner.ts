import { Tezos } from "@taquito/taquito";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { InMemorySigner } from "@taquito/signer";
import chalk from "chalk";

import inquirer from "../inquirer/inquirer";
import { SigningMethods, Networks, RPC } from "../types";

export default async () => {
  let network, publicKeyHash;

  const { selectNetwork } = await inquirer.selectNetwork();
  if (selectNetwork === Networks.Main) {
    Tezos.setRpcProvider(RPC.Main);
    network = Networks.Main.toLowerCase();
  } else if (selectNetwork === Networks.Test) {
    Tezos.setRpcProvider(RPC.Test);
    network = Networks.Test.toLowerCase();
  }

  const { signingMethod } = await inquirer.signingMethod();
  if (signingMethod == SigningMethods.LedgerNano) {
    // USING LEDGER NANO
    console.log("Please provide your public key from your Ledger Nano device.");

    try {
      const transport = await TransportNodeHid.create();
      const ledgerSigner = new LedgerSigner(
        transport,
        "44'/1729'/0'/0'",
        true,
        DerivationType.tz1
      );

      Tezos.setSignerProvider(ledgerSigner);

      //Get the public key hash from the Ledger
      publicKeyHash = await Tezos.signer.publicKeyHash();
    } catch (error) {
      console.log(chalk.red("Error while setting up the signer"));
      console.log(error);
    }
  } else if (signingMethod == SigningMethods.PrivateKey) {
    // USING PRIVATE KEY
    const { inputPrivateKey: privateKey } = await inquirer.inputPrivateKey();

    const signer = new InMemorySigner(privateKey);
    Tezos.setSignerProvider(signer);

    publicKeyHash = await signer.publicKeyHash();
  }

  return { network, publicKeyHash, Tezos, signingMethod };
};
