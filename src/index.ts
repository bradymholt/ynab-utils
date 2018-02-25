import { AmazonOrderFetcher } from "./AmazonOrderFetcher";
import * as moment from "moment";
import ynabApi = require("ynab");

(async () => {
  const amazonEmail = process.argv[2];
  const amazonPassword = process.argv[3];
  const ynabAccessToken = process.argv[4];
  const budgetId = process.argv[5];
  let fromDate = moment()
    .subtract(1, "month")
    .toISOString();
  let toDate = moment().toISOString();

  const fetcher = new AmazonOrderFetcher(amazonEmail, amazonPassword);
  const orders = await fetcher.getOrders(fromDate, toDate);

  const ynab = new ynabApi(ynabAccessToken);
  const payees = await ynab.payees.getPayees(budgetId);
  const amazonPayeeIds = payees.data.payees
    .filter(p => {
      return p.name.toLowerCase().match(/amazon/);
    })
    .map(p => {
      return p.id;
    });
  const transactions = await ynab.transactions.getTransactions(
    budgetId,
    undefined,
    "unapproved"
  );
  const unapprovedAmazonTransactions = transactions.data.transactions.filter(
    t => {
      return amazonPayeeIds.indexOf(t.payee_id) > 0;
    }
  );

  for (let txn of unapprovedAmazonTransactions) {
    let txnAmount = Math.abs(txn.amount * 0.001).toFixed(2);
    let amazonOrderByAmount = orders[txnAmount];
    if (amazonOrderByAmount) {
      try {
        await ynab.transactions.updateTransaction(budgetId, txn.id, {
          transaction: {
            account_id: txn.account_id,
            date: txn.date,
            amount: txn.amount,
            payee_id: txn.payee_id,
            memo: amazonOrderByAmount.substring(0, 100)
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
})();
