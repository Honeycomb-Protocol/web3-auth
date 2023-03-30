import * as web3 from "@solana/web3.js";
import {
  HIVECONTROL_PROGRAM_ID,
  Honeycomb,
  User as UserChain,
  userDiscriminator,
} from "@honeycomb-protocol/hive-control";
import { MikroORM } from "@mikro-orm/core";
import { User, Wallets } from "../models";

export async function saveUser(
  orm: MikroORM,
  userAddress: web3.PublicKey,
  userChain: UserChain
) {
  await orm.em.upsert(User, {
    address: userAddress,
    wallets: Wallets.from({
      primary_wallet: userChain.primaryWallet,
      secondary_wallets: userChain.secondaryWallets,
    }),
    username: userChain.username,
    name: userChain.name,
    bio: userChain.bio,
    pfp: userChain.pfp,
  });
  return orm.em.flush();
}

export function fetchUsers(honeycomb: Honeycomb, orm: MikroORM) {
  console.log("Refreshing Users...");
  return UserChain.gpaBuilder()
    .run(honeycomb.connection)
    .then((usersChain) => {
      return Promise.all(
        usersChain.map(async (userChain) => {
          try {
            const discriminator = Array.from(
              userChain.account.data.slice(0, 8)
            );
            if (userDiscriminator.join("") !== discriminator.join("")) {
              throw new Error("User Discriminator Mismatch");
            }
            await saveUser(
              orm,
              userChain.pubkey,
              UserChain.fromAccountInfo(userChain.account)[0]
            );
          } catch {}
        })
      );
    });
}

export async function refreshData(honeycomb: Honeycomb, orm: MikroORM) {
  await fetchUsers(honeycomb, orm);
}

export function startSocket(honeycomb: Honeycomb, orm: MikroORM) {
  console.log("Started sockets...");
  return honeycomb.processedConnection.onProgramAccountChange(
    HIVECONTROL_PROGRAM_ID,
    async (account) => {
      const discriminator = Array.from(account.accountInfo.data.slice(0, 8));

      try {
        if (userDiscriminator.join("") !== discriminator.join("")) {
          throw new Error("User Discriminator Mismatch");
        }

        const userChain = UserChain.fromAccountInfo(account.accountInfo)[0];
        console.log(`User ${account.accountId.toString()} data changed`);

        saveUser(orm, account.accountId, userChain).catch((e) =>
          console.error(`User ${account.accountId.toString()} save error`, e)
        );
      } catch {
        console.log(`${account.accountId} not matched any discriminator`);
      }
    }
  );
}
