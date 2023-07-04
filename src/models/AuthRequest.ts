import { Entity, PrimaryKey, Property, BaseEntity } from "@mikro-orm/core";
import { PublicKey } from "@solana/web3.js";

export interface IAuthRequest {
  userAddress: PublicKey;
  signerWallet: PublicKey;
  nonce: PublicKey;
}

@Entity()
export class AuthRequest
  extends BaseEntity<AuthRequest, "userAddress">
  implements IAuthRequest
{
  @PrimaryKey({
    type: "string",
  })
  userAddress!: PublicKey;

  @Property({
    type: "string",
  })
  signerWallet!: PublicKey;

  @Property({
    type: "string",
  })
  nonce!: PublicKey;

  constructor(
    userAddress: PublicKey,
    signerWallet: PublicKey,
    nonce: PublicKey
  ) {
    super();
    this.userAddress = userAddress;
    this.signerWallet = signerWallet;
    this.nonce = nonce;
  }
}
