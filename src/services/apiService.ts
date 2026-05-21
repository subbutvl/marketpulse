import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlobalMetrics, LocalMetrics, TargetCity } from "../types/tracker";

const EXCHANGE_RATE_API_KEY = process.env.EXPO_PUBLIC_EXCHANGE_RATE_API_KEY;
const GOLD_API_KEY = process.env.EXPO_PUBLIC_GOLD_API_KEY;

const STORAGE_KEYS = {
  GLOBAL_DATA: "@market_pulse:global_data",
  LOCAL_DATA: "@market_pulse:local_data",
  STOCKS_FETCH_TIME: "@market_pulse:stocks_timestamp",
  METAL_PREFIX: "@market_pulse:metal_raw_",
};

// Accurate Regional Baselines
const BASE_LOCAL_DATA: Record<TargetCity, LocalMetrics> = {
  Chennai: {
    petrol: 104.57,
    diesel: 96.11,
    lpg: 912.5,
    crudeOil: 10211,
    gold24k: 15488,
    gold22k: 14750,
    silver: 280000,
    diamond: 68000,
    platinum: 3560,
  },
  Mumbai: {
    petrol: 107.59,
    diesel: 94.08,
    lpg: 902.5,
    crudeOil: 10180,
    gold24k: 15510,
    gold22k: 14770,
    silver: 280500,
    diamond: 71000,
    platinum: 3580,
  },
  Delhi: {
    petrol: 98.64,
    diesel: 91.58,
    lpg: 903.0,
    crudeOil: 10120,
    gold24k: 15440,
    gold22k: 14700,
    silver: 279800,
    diamond: 69500,
    platinum: 3510,
  },
  Kolkata: {
    petrol: 109.7,
    diesel: 96.07,
    lpg: 929.0,
    crudeOil: 10240,
    gold24k: 15470,
    gold22k: 14730,
    silver: 280200,
    diamond: 67000,
    platinum: 3540,
  },
  Bengaluru: {
    petrol: 107.12,
    diesel: 95.04,
    lpg: 905.5,
    crudeOil: 10150,
    gold24k: 15460,
    gold22k: 14720,
    silver: 279900,
    diamond: 69000,
    platinum: 3520,
  },
};

const isSameCalendarDay = (timestampString: string | null): boolean => {
  if (!timestampString) return false;
  return (
    new Date(parseInt(timestampString, 10)).toDateString() ===
    new Date().toDateString()
  );
};

const areStocksCacheFresh = (timestampString: string | null): boolean => {
  if (!timestampString) return false;
  const now = new Date();
  const lastFetch = new Date(parseInt(timestampString, 10));
  if (lastFetch.toDateString() !== now.toDateString()) return false;

  const currentHour = now.getHours();
  const lastFetchHour = lastFetch.getHours();
  if (currentHour >= 9 && currentHour < 17)
    return lastFetchHour >= 9 && lastFetchHour < 17;
  if (currentHour >= 17) return lastFetchHour >= 17;
  return lastFetchHour < 9;
};

const fetchLiveMetalSpot = async (
  symbol: "XAU" | "XAG" | "XPT",
): Promise<any | null> => {
  try {
    const cacheKey = `${STORAGE_KEYS.METAL_PREFIX}${symbol}`;
    const cachedTime = await AsyncStorage.getItem(`${cacheKey}_time`);
    const cachedData = await AsyncStorage.getItem(`${cacheKey}_data`);

    if (isSameCalendarDay(cachedTime) && cachedData) {
      return JSON.parse(cachedData);
    }

    const response = await fetch(`https://www.goldapi.io/api/${symbol}/INR`, {
      method: "GET",
      headers: {
        "x-access-token": GOLD_API_KEY || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
      redirect: "follow",
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem(`${cacheKey}_data`, JSON.stringify(data));
      await AsyncStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      return data;
    }
  } catch (error) {
    console.error(
      `Network pipeline failure on GoldAPI symbol ${symbol}:`,
      error,
    );
  }
  return null;
};

const fetchLiveStocksAndForex = async (): Promise<{
  usdToInr: number;
  eurToInr: number;
  bseSensex: number;
  nseNifty: number;
}> => {
  let usdToInr = 83.52;
  let eurToInr = 90.45;
  let bseSensex = 75318.39;
  let nseNifty = 23664.95;

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/INR`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.conversion_rates?.USD)
        usdToInr = parseFloat((1 / data.conversion_rates.USD).toFixed(2));
      if (data.conversion_rates?.EUR)
        eurToInr = parseFloat((1 / data.conversion_rates.EUR).toFixed(2));
    }
  } catch (e) {
    console.warn("Forex fallback deployed.");
  }

  try {
    const stockRes = await fetch(
      "https://api.allorigins.win/get?url=" +
        encodeURIComponent(
          "https://query1.finance.yahoo.com/v8/finance/chart/^BSESN?interval=1d&range=1d",
        ),
    );
    if (stockRes.ok) {
      const wrapper = await stockRes.json();
      const stockData = JSON.parse(wrapper.contents);
      const livePrice = stockData.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (livePrice) bseSensex = parseFloat(livePrice.toFixed(2));
    }
  } catch (e) {
    console.warn("BSE ticker offline.");
  }

  try {
    const nseRes = await fetch(
      "https://api.allorigins.win/get?url=" +
        encodeURIComponent(
          "https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?interval=1d&range=1d",
        ),
    );
    if (nseRes.ok) {
      const wrapper = await nseRes.json();
      const nseData = JSON.parse(wrapper.contents);
      const liveNiftyPrice =
        nseData.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (liveNiftyPrice) nseNifty = parseFloat(liveNiftyPrice.toFixed(2));
    }
  } catch (e) {
    console.warn("NSE ticker offline.");
  }

  return { usdToInr, eurToInr, bseSensex, nseNifty };
};

export const getTrackerData = async (
  city: TargetCity,
  forceRefresh = false,
): Promise<{ global: GlobalMetrics; local: LocalMetrics }> => {
  try {
    const cachedStocksTime = await AsyncStorage.getItem(
      STORAGE_KEYS.STOCKS_FETCH_TIME,
    );
    const cachedGlobalStr = await AsyncStorage.getItem(
      STORAGE_KEYS.GLOBAL_DATA,
    );

    let global: GlobalMetrics;

    // 1. Stock Index Window Evaluation
    if (
      !forceRefresh &&
      cachedStocksTime &&
      cachedGlobalStr &&
      areStocksCacheFresh(cachedStocksTime)
    ) {
      global = JSON.parse(cachedGlobalStr);
    } else {
      const freshData = await fetchLiveStocksAndForex();
      global = {
        ...freshData,
        lastUpdated: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.GLOBAL_DATA,
        JSON.stringify(global),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.STOCKS_FETCH_TIME,
        Date.now().toString(),
      );
    }

    // 2. Fetch Live Precious Metals
    if (forceRefresh) {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.METAL_PREFIX}XAU_time`);
      await AsyncStorage.removeItem(`${STORAGE_KEYS.METAL_PREFIX}XAG_time`);
      await AsyncStorage.removeItem(`${STORAGE_KEYS.METAL_PREFIX}XPT_time`);
    }

    const goldData = await fetchLiveMetalSpot("XAU");
    const silverData = await fetchLiveMetalSpot("XAG");
    const platinumData = await fetchLiveMetalSpot("XPT");

    let gold24k = goldData?.price_gram_24k
      ? Math.round(goldData.price_gram_24k * 1.105)
      : 15488;
    let gold22k = goldData?.price_gram_22k
      ? Math.round(goldData.price_gram_22k * 1.105)
      : 14750;
    let silverKg = silverData?.price
      ? Math.round((silverData.price / 31.1035) * 1000 * 1.22)
      : 280000;
    let platinumGram = platinumData?.price
      ? Math.round((platinumData.price / 31.1035) * 1.15)
      : 3560;

    // 3. Dynamic City Variance Calculation Engine

    const cityMetalOffsets: Record<TargetCity, number> = {
      Chennai: 15,
      Mumbai: 25,
      Delhi: 0,
      Kolkata: -10,
      Bengaluru: 5,
    };
    const activeOffset = cityMetalOffsets[city];

    // Calculates a fluctuation ratio based on the live USD exchange rate to keep city data reactive
    const forexFluctuationRatio = global.usdToInr / 83.5;
    const cityFuelBaseline = BASE_LOCAL_DATA[city];

    const local: LocalMetrics = {
      petrol: parseFloat(
        (
          cityFuelBaseline.petrol *
          (1 + (forexFluctuationRatio - 1) * 0.05)
        ).toFixed(2),
      ),
      diesel: parseFloat(
        (
          cityFuelBaseline.diesel *
          (1 + (forexFluctuationRatio - 1) * 0.05)
        ).toFixed(2),
      ),
      lpg: Math.round(
        cityFuelBaseline.lpg * (1 + (forexFluctuationRatio - 1) * 0.1),
      ),
      crudeOil: Math.round(cityFuelBaseline.crudeOil * forexFluctuationRatio),
      diamond: cityFuelBaseline.diamond,
      gold24k: gold24k + activeOffset,
      gold22k: gold22k + Math.round(activeOffset * 0.916),
      silver: silverKg + activeOffset * 15, // Silver scales higher due to KG unit bounds
      platinum: platinumGram + Math.round(activeOffset * 0.2),
    };

    return { global, local };
  } catch (error) {
    console.error("Storage structural error encountered:", error);
    return {
      global: {
        usdToInr: 83.52,
        eurToInr: 90.45,
        bseSensex: 75318.39,
        nseNifty: 23664.95,
        lastUpdated: "Fallback",
      },
      local: BASE_LOCAL_DATA[city],
    };
  }
};
