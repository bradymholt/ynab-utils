import * as moment from "moment";
import * as program from "commander";

import { AmazonOrderFetcher } from "./amazonOrderFetcher";
import { ynabMemoUpdator } from "./ynabMemoUpdator";
import { ynabTransactionImporter } from "./ynabTransactionImporter";

program
  .version("0.1.0")
  .option("--amazon-email <email>", "Amazon Account Email Address")
  .option("--amazon-password <password>", "Amazon Account Password")
  .option("--ynab-email <email>", "YNAB Account Email Address")
  .option("--ynab-password <password>", "YNAB Account Password")
  .option("--ynab-access-token <access_token>", "YNAB API Access Token")
  .option("--ynab-budget-id <budget_id>", "YNAB Budget Id")
  .option(
    "-ai, --ynab-account-ids <account_ids>",
    "YNAB Account Ids (comma delimited)"
  )
  .parse(process.argv);

// If any require options are not provided print help and exit
if (
  !program.amazonEmail ||
  !program.amazonPassword ||
  !program.ynabEmail ||
  !program.ynabPassword ||
  !program.ynabAccessToken ||
  !program.ynabBudgetId ||
  !program.ynabAccountIds
) {
  program.help();
}

(async () => {
  // Import YNAB Transactions
  const transactionImporter = new ynabTransactionImporter(
    program.ynabEmail,
    program.ynabPassword
  );
  await transactionImporter.importTransactions(
    program.ynabAccountIds.split(",")
  );

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
