import { Entity, PrimaryKey, Property, BaseEntity } from "@mikro-orm/core";
import { PublicKey } from "@solana/web3.js";

export interface IWallets {
  primary_wallet: PublicKey;
  secondary_wallets: PublicKey[];
}

export interface IUser {
  address: PublicKey;
  wallets: IWallets;
}

export class Wallets implements IWallets {
  public primary_wallet: PublicKey;
  public secondary_wallets: PublicKey[];

  constructor(input: string = "{}") {
    const parsed = Wallets.parse(input);
    this.primary_wallet = parsed.primary_wallet || PublicKey.default;
    this.secondary_wallets = parsed.secondary_wallets || [];
  }

  public toString(): string {
    return Wallets.stringify(this);
  }

  public static from(wallets: IWallets) {
    return new Wallets(Wallets.stringify(wallets));
  }

  public static parse(input: string) {
    const parsed = {} as IWallets;
    parsed.secondary_wallets = [];

    input.split(";").forEach((wallet) => {
      if (wallet.startsWith("p:")) {
        parsed.primary_wallet = new PublicKey(wallet.replace("p:", ""));
      } else {
        parsed.secondary_wallets.push(new PublicKey(wallet.replace("s:", "")));
      }
    });
    if (!parsed.primary_wallet)
      throw new Error("Primary wallet not found in input");
    return parsed;
  }

  public static stringify(wallets: IWallets) {
    const stringified = [`p:${wallets.primary_wallet.toString()}`];
    wallets.secondary_wallets.forEach((wallet) =>
      stringified.push(`s:${wallet.toString()}`)
    );
    return stringified.join(";");
  }
}

@Entity()
export class User extends BaseEntity<User, "address"> implements IUser {
  @PrimaryKey({
    type: "string",
  })
  address!: PublicKey;

  @Property({
    type: "string",
  })
  wallets!: Wallets;

  @Property({
    type: "string",
    nullable: true,
  })
  name?: string;

  @Property({
    type: "string",
    nullable: true,
  })
  bio?: string;

  constructor(address: PublicKey, wallets: Wallets) {
    super();
    this.address = address;
    this.wallets = wallets;
  }
}
