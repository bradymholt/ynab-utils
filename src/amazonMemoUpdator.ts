import * as ynab from "ynab";
import moment from "moment";
import { AmazonOrderFetcher } from "./support/amazonOrderFetcher";
import { IAmazonItemsByAmount } from "./support/amazonOrderInfo";
import config from "../config.json";

export class amazonMemoUpdator {
  readonly amazonOrdersSinceDaysAgo = 30;

  ynabAPI: ynab.api;

  constructor() {
    this.ynabAPI = new ynab.api(config.personal_access_token);
  }

  public async run() {
    let fromISODate = moment()
      .subtract(Math.abs(this.amazonOrdersSinceDaysAgo), "days")
      .toISOString();
    let toISODate = moment().toISOString();

    const unapprovedAmazonTransactions = await this.fetchUnapprovedAmazonTransactions(config.budget_id);
    if (unapprovedAmazonTransactions.length) {
      console.log("At least one unapproved Amazon transaction found!");
      const amazonOrderFetcher = new AmazonOrderFetcher(config.amazon_email, config.amazon_password);
      const amazonOrders = await amazonOrderFetcher.getOrders(fromISODate, toISODate);
      await this.updateAmazonTransactionMemos(config.budget_id, unapprovedAmazonTransactions, amazonOrders);
    } else {
      console.log("No unapproved Amazon transactions found.");
    }
  }

  private async fetchUnapprovedAmazonTransactions(budgetId: string) {
    console.log(`Fetching unapproved Amazon transactions from YNAB...`);
    const unapprovedAmazonTransactions = await this.getUnapprovedAmazonTransactions(budgetId);
    return unapprovedAmazonTransactions;
  }

  private async updateAmazonTransactionMemos(
    budgetId: string,
    unapprovedAmazonTransactions: ynab.TransactionDetail[],
    amazonOrders: IAmazonItemsByAmount
  ) {
    console.log(`Updating transaction memos in YNAB...`);
    for (let transaction of unapprovedAmazonTransactions) {
      let txnAmount = Math.abs(transaction.amount * 0.001).toFixed(2);
      let amazonOrderByAmount = amazonOrders[txnAmount];
      if (amazonOrderByAmount) {
        const updatedMemo = (transaction.memo = amazonOrderByAmount.substring(0, 100));

        console.log(`  ${transaction.date} ${transaction.amount} ${updatedMemo}`);

        transaction.payee_name = null!;
        transaction.memo = updatedMemo;

        await this.ynabAPI.transactions.updateTransaction(budgetId, transaction.id, {
          transaction
        });
      }
    }
  }

  private async getUnapprovedAmazonTransactions(budgetId: string) {
    const transactions = await this.ynabAPI.transactions.getTransactions(budgetId, undefined, "unapproved");
    const unapprovedAmazonTransactions = transactions.data.transactions.filter(t => {
      if (!t.payee_name) {
        return false;
      }

      return t.payee_name.toLowerCase().indexOf("amazon") > -1;
    });
    return unapprovedAmazonTransactions;
  }
}
