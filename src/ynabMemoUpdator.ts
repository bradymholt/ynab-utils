import * as ynab from "ynab";
import { IAmazonItemsByAmount } from "./amazonOrderInfo";

export class ynabMemoUpdator {
  ynabAPI: ynab.api;

  constructor(accessToken: string) {
    this.ynabAPI = new ynab.api(accessToken);
  }

  public async updateAmazonTransactionMemos(
    budgetId: string,
    amazonOrders: IAmazonItemsByAmount
  ) {
    console.log(`Fetching unapproved Amazon transactions from YNAB...`);
    const unapprovedAmazonTransactions = await this.getUnapprovedAmazonTransactions(
      budgetId
    );

    console.log(`Updating transaction memos in YNAB...`);
    for (let transaction of unapprovedAmazonTransactions) {
      let txnAmount = Math.abs(transaction.amount * 0.001).toFixed(2);
      let amazonOrderByAmount = amazonOrders[txnAmount];
      if (amazonOrderByAmount) {
        const updatedMemo = transaction.memo = amazonOrderByAmount.substring(0, 100);
        
        console.log(`  ${transaction.date} ${transaction.amount} ${updatedMemo}`);
        
        transaction.memo = updatedMemo
        await this.ynabAPI.transactions.updateTransaction(budgetId, transaction.id, {
          transaction
        });
      }
    }
  }

  private async getUnapprovedAmazonTransactions(budgetId: string) {
    const amazonPayeeIds = await this.getAmazonPayeeIds(budgetId);
    const transactions = await this.ynabAPI.transactions.getTransactions(
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
    const payees = await this.ynabAPI.payees.getPayees(budgetId);
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
