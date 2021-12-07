import { Router } from "express";
import { serialize } from "class-transformer";
import { Statistic } from "../models/statistic";
import {
  Blockchain,
  BlockchainReverseLookup,
  Marketplace,
  MarketplaceReverseLookup,
} from "../types";

const router = Router();

router.get("/", async (req, res) => {
  const data = await Statistic.getSummary();
  res.send(serialize(data));
  res.status(200);
});

router.get("/chains", async (req, res) => {
  const data = await Statistic.getChainsSummary();
  const chainData = data.map((elem: any) => {
    const chainName = elem.chain as Blockchain;
    const displayName = BlockchainReverseLookup.get(chainName);
    return {
      ...elem,
      displayName,
    };
  });
  res.send(serialize(chainData));
  res.status(200);
});

router.get("/marketplaces", async (req, res) => {
  const data = await Statistic.getMarketplacesSummary();
  const marketplaceData = data.map((elem: any) => {
    const marketplaceName = elem.marketplace as Marketplace;
    const displayName = MarketplaceReverseLookup.get(marketplaceName);
    return {
      ...elem,
      displayName,
    };
  });
  res.send(serialize(marketplaceData));
  res.status(200);
});

export default router;
