import ynabApi = require("ynab");
import { IAmazonItemsByAmount } from "./amazonOrderInfo";

export class ynabMemoUpdator {
  ynab: ynabApi;

  constructor(accessToken: string) {
    this.ynab = new ynabApi(accessToken);
  }

  public async updateAmazonTransactionMemos(budgetId: string, amazonOrders: IAmazonItemsByAmount) {
    const unapprovedAmazonTransactions = await this.getUnapprovedAmazonTransactions(
      budgetId
    );

    for (let txn of unapprovedAmazonTransactions) {
      let txnAmount = Math.abs(txn.amount * 0.001).toFixed(2);
      let amazonOrderByAmount = amazonOrders[txnAmount];
      if (amazonOrderByAmount) {
        await this.ynab.transactions.updateTransaction(budgetId, txn.id, {
          transaction: {
            account_id: txn.account_id,
            date: txn.date,
            amount: txn.amount,
            payee_id: txn.payee_id,
            memo: amazonOrderByAmount.substring(0, 100)
          }
        });
      }
    }
  }

  private async getUnapprovedAmazonTransactions(budgetId: string) {
    const amazonPayeeIds = await this.getAmazonPayeeIds(budgetId);
    const transactions = await this.ynab.transactions.getTransactions(
      budgetId,
      undefined,
      "unapproved"
    );
    const unapprovedAmazonTransactions = transactions.data.transactions.filter(
      t => {
        return amazonPayeeIds.indexOf(t.payee_id) > 0;
      }
    );
    return unapprovedAmazonTransactions;
  }

  private async getAmazonPayeeIds(budgetId: string) {
    const payees = await this.ynab.payees.getPayees(budgetId);
    const amazonPayeeIds = payees.data.payees
      .filter(p => {
        return p.name.toLowerCase().match(/amazon/);
      })
      .map(p => {
        return p.id;
      });
    return amazonPayeeIds;
  }
}
