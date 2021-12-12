import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { PancakeSwap, PancakeSwapCollectionData } from "../api/pancakeswap";
import { sleep, handleError, filterMetadata } from "../utils";
import { upsertCollection } from "../utils/dynamodb";
import { COINGECKO_IDS } from "../constants";
import { Blockchain, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const collections = await PancakeSwap.getAllCollections();

  const { usd: bnbInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.BSC].geckoId
  );

  console.log(
    "Fetching metadata for PancakeSwap collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for PancakeSwap collection:",
        collection.name
      );
      await fetchCollection(collection, bnbInUSD);
    } catch (e) {
      await handleError(e, "pancakeswap-adapter:runCollections");
    }
    await sleep(1);
  }
}

/*
async function runSales(): Promise<void> {
  const MAX_INT = 2_147_483_647;
  const collections = await Collection.getSorted(
    "totalVolume",
    "DESC",
    0,
    MAX_INT,
    Blockchain.BSC
  );

  console.log(
    "Fetching sales for PancakeSwap collections:",
    collections.length
  );
  for (const collection of collections) {
    console.log("Fetching sales for PancakeSwap collection:", collection.name);
    await fetchSales(collection);
  }
}
*/

async function fetchCollection(
  collection: PancakeSwapCollectionData,
  bnbInUsd: number
): Promise<void> {
  const { metadata, statistics } = await PancakeSwap.getCollection(
    collection,
    bnbInUsd
  );

  const filteredMetadata = filterMetadata(metadata);
  const slug = filteredMetadata.slug as string;

  if (slug) {
    await upsertCollection({
      slug,
      metadata: filteredMetadata,
      statistics,
      chain: Blockchain.BSC,
      marketplace: Marketplace.PancakeSwap,
    });
  }
}

/*
async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (
      await collection.getLastSale(Marketplace.PancakeSwap)
    )?.timestamp?.getTime() || 0;

  try {
    const salesEvents = await PancakeSwap.getSales(
      collection.address,
      mostRecentSaleTime
    );
    if (salesEvents.length === 0) {
      sleep(3);
      return;
    }
    const sales = salesEvents
      .filter((event) => event !== undefined)
      .reduce(
        (allSales, nextSale) => ({
          ...allSales,
          [nextSale.txnHash]: Sale.create({
            ...nextSale,
            collection,
            marketplace: Marketplace.PancakeSwap,
          }),
        }),
        {}
      );
    Sale.save(Object.values(sales), { chunk: 1000 });
    await sleep(1);
  } catch (e) {
    await handleError(e, "pancakeswap-adapter:fetchSales");
  }
}
*/

async function run(): Promise<void> {
  try {
    await Promise.all([
      runCollections(),
      //runSales()
    ]);
  } catch (e) {
    await handleError(e, "pancakeswap-adapter");
  }
}

const PancakeSwapAdapter: DataAdapter = { run };
export default PancakeSwapAdapter;
