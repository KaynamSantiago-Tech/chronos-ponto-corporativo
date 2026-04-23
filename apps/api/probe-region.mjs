import { Client } from "pg";

const REF = "ywpujrqpkjdnlslqjbrb";
const PW = "saMZkF)rFz9pWzS";
const regions = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-central-1", "eu-west-1", "eu-west-2", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  "ap-northeast-2", "ap-south-1", "ca-central-1", "sa-east-1",
];
const shards = ["aws-0", "aws-1"];

for (const shard of shards) {
  for (const region of regions) {
    const host = `${shard}-${region}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${REF}`,
      password: PW,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });
    try {
      await client.connect();
      console.log(`HIT: ${shard}-${region}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      const msg = e.message.slice(0, 60);
      if (msg.includes("ENOTFOUND")) continue;
      console.log(`${shard}-${region}: ${msg}`);
      try { await client.end(); } catch {}
    }
  }
}
