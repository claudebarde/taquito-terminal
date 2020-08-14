export enum Networks {
  Test = "Carthagenet",
  Main = "Mainnet"
}

export enum RPC {
  Test = "https://carthagenet.smartpy.io",
  Main = "https://mainnet.smartpy.io"
}

export enum SigningMethods {
  LedgerNano = "Ledger Nano",
  PrivateKey = "Private Key"
}

export enum Actions {
  Transfer = "Transfer tezzies",
  TokenFaucet = "Request tokens from the token faucet",
  InteractWithContract = "Interact with a contract",
  Exit = "Exit"
}

export enum TokenFaucetType {
  FA12 = "FA1.2",
  FA2_FT = "FA2 fungible",
  FA2_NFT = "FA2 non fungible"
}
