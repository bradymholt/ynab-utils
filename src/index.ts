import { AmazonOrderFetcher } from "./amazonOrderFetcher";
import { ynabMemoUpdator } from "./ynabMemoUpdator";
import * as moment from "moment";

(async () => {
  const amazonEmail = process.argv[2];
  const amazonPassword = process.argv[3];

  const ynabAccessToken = process.argv[4];
  const budgetId = process.argv[5];

  let fromDate = moment()
    .subtract(1, "month")
    .toISOString();
  let toDate = moment().toISOString();

  const amazonOrderFetcher = new AmazonOrderFetcher(amazonEmail, amazonPassword);
  const amazonOrders = await amazonOrderFetcher.getOrders(fromDate, toDate);
  
  const ynabMemoUpdater = new ynabMemoUpdator(ynabAccessToken);
  await ynabMemoUpdater.updateAmazonTransactionMemos(budgetId, amazonOrders);
})();
