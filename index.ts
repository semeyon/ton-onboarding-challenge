
// write your NFT miner here
import {Address, TonClient} from "ton"
import {getHttpEndpoint} from "@orbs-network/ton-access";
import {BN} from 'bn.js'

import {unixNow} from "./src/lib/utils";
import {MineMessageParams, Queries} from "./src/giver/NftGiver.data";


async function main () {

  const wallet = Address.parse('0QB1nbhjyhnW6k3s36Y3THxmg8P_K4axfxs5yYLLitju__hZ');
  const collection = Address.parse('EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX');

   // get the decentralized RPC endpoint in Testnet
   const endpoint = await getHttpEndpoint({
    network: "testnet",
  });

  // initialize ton library
  const client = new TonClient({ endpoint });

  const miningData = await client.callGetMethod(collection, 'get_mining_data')

  console.log(miningData)

  const parseStackNum = (sn: any) => new BN(sn[1].substring(2), 'hex');

  const complexity = parseStackNum(miningData.stack[0]);
  const last_success = parseStackNum(miningData.stack[1]);
  const seed = parseStackNum(miningData.stack[2]);
  const target_delta = parseStackNum(miningData.stack[3]);
  const min_cpl = parseStackNum(miningData.stack[4]);
  const max_cpl = parseStackNum(miningData.stack[5]);

  console.log('complexity', complexity);
  console.log('last_success', last_success.toString());
  console.log('seed', seed);
  console.log('target_delta', target_delta.toString());
  console.log('min_cpl', min_cpl.toString());
  console.log('max_cpl', max_cpl.toString());

  const mineParams : MineMessageParams = {
    expire: unixNow() + 300, // 5 min is enough to make a transaction
    mintTo: wallet, // your wallet
    data1: new BN(0), // temp variable to increment in the miner
    seed // unique seed from get_mining_data
  };
  
  let msg = Queries.mine(mineParams);

  let progress = 0;

  while (new BN(msg.hash(), 'be').gt(complexity)) {
    progress += 1
    console.clear()
    console.log(`Mining started: please, wait for 30-60 seconds to mine your NFT!`)
    console.log(' ')
    console.log(`⛏ Mined ${progress} hashes! Last: `, new BN(msg.hash(), 'be').toString())

    mineParams.expire = unixNow() + 300
    mineParams.data1.iaddn(1)
    msg = Queries.mine(mineParams)
  }

  console.log(' ')
  console.log('💎 Mission completed: msg_hash less than pow_complexity found!');
  console.log(' ')
  console.log('msg_hash: ', new BN(msg.hash(), 'be').toString())
  console.log('pow_complexity: ', complexity.toString())
  console.log('msg_hash < pow_complexity: ', new BN(msg.hash(), 'be').lt(complexity))

}

main()