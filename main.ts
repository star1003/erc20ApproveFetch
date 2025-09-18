import {
  HypersyncClient,
  Decoder,
  Query,
  JoinMode,
  LogField,
} from "npm:@envio-dev/hypersync-client";
import express, { NextFunction, Request, Response} from "npm:express@4.18.2";
import { isAddress } from "npm:viem";
// import cors from 'npm:cors';
// import { readFileSync } from 'npm:fs@^0.0.1-security'

const app = express();
// app.use(cors());

// app.use(cors({
//   origin: 'https://hsiphoner.vercel.app/home', // Replace with your frontend's origin (e.g., production domain)
//   methods: ['GET', 'POST'], // Adjust based on your needs
//   credentials: true, // If you need to send cookies or auth headers
// }));
const client = HypersyncClient.new({
    url: 'https://eth.hypersync.xyz',
    maxNumRetries: 3,
  });

const approvalEventSigHash =
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";


// const options = {
//   cert: readFileSync("./cert.pem"),
//   key: readFileSync("./key.pem"),
// };

app.get("/approveFetch", async(_req, _res) => {
  const {address , creationBlock} = _req.query;

  const tokenAddress = address;
  const block = Number(creationBlock);
  console.log('Token Address:' , tokenAddress);
  if (!isAddress(tokenAddress as string)) {
    _res.status(400).send({ error: "Invalid token address" });
    return;
  }
  const query: Query = {
    fromBlock: block,
    logs: [
      {
        address: [
          tokenAddress
        ],

        topics: [
          [approvalEventSigHash],
          [],
          [],
          [],
        ],
      },
    ],
    fieldSelection: {
      log: [
        LogField.Data,
        LogField.Address,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
      ],
    },
    joinMode: JoinMode.JoinNothing,
  };
  const receiver = await client.stream(query, {});

  const decoder = Decoder.fromSignatures([
    "Transfer(address indexed from, address indexed to, uint256 amount)",
    "Approval(address indexed owner, address indexed spender, uint256 value)",
  ]);

  // const erc20_balances: {
  //   [address: string]: { balance: bigint; count_in: number; count_out: number };
  // } = {};
  const erc20_approvals: { [address: string]:  boolean } = {};
  while (true) {
    const res = await receiver.recv();
    if(res === null) {
      break;
    }

    const decodedLogs = await decoder.decodeLogs(res.data.logs);

    for (let i = 0; i < decodedLogs.length; i++) {
      const log = decodedLogs[i];
      const rawLogData = res.data.logs[i];

      if (
        rawLogData == undefined
      ) {
        continue;
      }

      /* if (rawLogData.topics[0] === transferEventSigHash) {
        const from = log.indexed[0].val as string;
        const to = log.indexed[1].val as string;
        const value = log.body[0].val as bigint;

        if (!erc20_balances[erc20Address]) {
          erc20_balances[erc20Address] = {
            balance: BigInt(0),
            count_in: 0,
            count_out: 0,
          };
        }

        if (from === targetAddress) {
          erc20_balances[erc20Address].balance -= value;
          erc20_balances[erc20Address].count_out++;
        }
        if (to === targetAddress) {
          erc20_balances[erc20Address].balance += value;
          erc20_balances[erc20Address].count_in++;
        }
      } else */
      if (rawLogData.topics[0] === approvalEventSigHash) {
        const owner = log.indexed[0].val as string;
        const spender = log.indexed[1].val as string;
        const value = log.body[0].val as bigint;

        // if (owner === targetAddress) {
          // if (!erc20_approvals[tokenAddress]) {
          //   erc20_approvals[tokenAddress] = {};
          // }
          erc20_approvals[owner] = true;
        }
    }

    // _res.send(JSON.stringify({approvals : erc20_approvals}));
    _res.send({approvals : erc20_approvals});
  }
});
const port = 7000;

app.listen(port, () => {
  console.log(`Listening on ${port} ...`);
});