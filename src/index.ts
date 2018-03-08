import * as moment from "moment";
import * as program from "caporal";

import { AmazonOrderFetcher } from "./amazonOrderFetcher";
import { ynabMemoUpdator } from "./ynabMemoUpdator";
import { ynabTransactionImporter } from "./ynabTransactionImporter";

program.version("1.0.0");

program
  .command("importTransactions", "Import transactions for an account")
  .argument("<email>", "YNAB Account Email Address")
  .argument("<password>", "YNAB Account Password")
  .argument("<account_id>", "YNAB Account Id")
  .action(async args => {
    const transactionImporter = new ynabTransactionImporter(args.email, args.password);
    await transactionImporter.importTransactions(args.accountId);
  });

program
  .command("updateAmazonMemos", "Update Amazon transactions in YNAB with list of order items")
  .argument("<email>", "Amazon Account Email Address")
  .argument("<password>", "Amazon Account Password")
  .argument("<budget_id>", "YNAB Budget Id")
  .argument("<access_token>", "YNAB API Access Token")
  .action(async args => {
    let fromDate = moment()
      .subtract(1, "month")
      .toISOString();
    let toDate = moment().toISOString();

    const amazonOrderFetcher = new AmazonOrderFetcher(args.email, args.password);
    const amazonOrders = await amazonOrderFetcher.getOrders(fromDate, toDate);

    const memoUpdator = new ynabMemoUpdator(args.accessToken);
    await memoUpdator.updateAmazonTransactionMemos(args.budgetId, amazonOrders);
  });

program.parse(process.argv);
