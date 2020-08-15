import chalk from "chalk";
import ora from "ora";

import inquirer from "../inquirer/inquirer";

export default async ({ Tezos, publicKeyHash, signingMethod, network }) => {
  // ask user to provide contract address
  const { inputContractAddress } = await inquirer.inputContractAddress();
  // loads contract instance
  const loadingContractInfo = ora({
    text: "Loading contract information",
    color: "cyan"
  }).start();
  const contract = await Tezos.contract.at(inputContractAddress);
  // gets contract info
  const balance = await Tezos.tz.getBalance(inputContractAddress);
  loadingContractInfo.succeed(
    chalk.white.bold(`Contract balance: XTZ ${balance}`)
  );
  console.log(chalk.blue("ℹ ") + chalk.white.bold(`Contract entrypoints:`));
  Object.keys(contract.methods).forEach(method =>
    console.log(chalk.white.bold(`    • ${method}`))
  );
};
