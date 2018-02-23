import { AmazonOrderFetcher } from "./AmazonOrderFetcher";

(async () => {
  const fetcher = new AmazonOrderFetcher("email@gmail.com", "secretPassword");
  const orders = await fetcher.getOrders("2018-02-01", "2018-02-23");
  console.log("DONE");
})();
