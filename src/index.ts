import * as moment from "moment";
import * as program from "commander";

import { AmazonOrderFetcher } from "./amazonOrderFetcher";
import { ynabMemoUpdator } from "./ynabMemoUpdator";
import { ynabTransactionImporter } from "./ynabTransactionImporter";

program
  .version("0.1.0")
  .option("-ae, --amazon-email <email>", "Amazon Account Email Address")
  .option("-ap, --amazon-password <password>", "Amazon Account Password")
  .option("-ye, --ynab-email <email>", "YNAB Account Email Address")
  .option("-yp, --ynab-password <password>", "YNAB Account Password")
  .option("-at, --ynab-access-token <access_token>", "YNAB API Access Token")
  .option("-bi, --ynab-budget-id <budget_id>", "YNAB Budget Id")
  .option("-ai, --ynab-account-ids <account_ids>", "YNAB Account Ids (comma delimited)")
  .parse(process.argv);

(async () => {
  // Import YNAB Transactions
  const transactionImporter = new ynabTransactionImporter(
    program.ynabEmail,
    program.ynabPassword
  );
  await transactionImporter.importTransactions(program.ynabAccountIds.split(","));

  // Fetch Amazon Orders
  let fromDate = moment()
    .subtract(1, "month")
    .toISOString();
  let toDate = moment().toISOString();

  const amazonOrderFetcher = new AmazonOrderFetcher(
    program.amazonEmail,
    program.amazonPassword
  );
  const amazonOrders = await amazonOrderFetcher.getOrders(fromDate, toDate);

  // Update Amazon Transaction memos
  const memoUpdator = new ynabMemoUpdator(program.ynabAccessToken);
  await memoUpdator.updateAmazonTransactionMemos(
    program.ynabBudgetId,
    amazonOrders
  );

  process.exit(0);
})();
