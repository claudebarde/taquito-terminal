import inquirer from "../inquirer/inquirer";

export default async ({ Tezos, publicKeyHash, signingMethod, network }) => {
  // ask user to provide contract address
  const { inputContractAddress } = await inquirer.inputContractAddress();
  // loads contract instance
  const contract = await Tezos.contract.at(inputContractAddress);

  console.log(
    JSON.stringify(
      contract.script.code.filter(el => el.prim === "parameter")[0].args
    )
  );
};
