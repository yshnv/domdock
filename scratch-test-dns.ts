import { fetchDnsRecords } from './lib/monitoring/dnsService.js';

async function test() {
  console.log(await fetchDnsRecords('github.com'));
}

test();
