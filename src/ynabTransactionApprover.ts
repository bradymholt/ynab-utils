import * as ynab from "ynab";

export class ynabTransactionApprover {
  ynabAPI: ynab.api;
  budgetId: string;

  constructor(accessToken: string, budgetId: string) {
    this.ynabAPI = new ynab.api(accessToken);
    this.budgetId = budgetId;
  }

  public async run() {
    console.log(`Fetching unapproved transaction from YNAB...`);
    const unapprovedTransactionResponse = await this.ynabAPI.transactions.getTransactions(
      this.budgetId,
      undefined,
      "unapproved"
    );

    const unapprovedCategorizedTransactions = unapprovedTransactionResponse.data.transactions.filter(
      t => t.category_id != null
    );
    if (unapprovedCategorizedTransactions.length == 0) {
      console.log(`No unapproved categorized transactions to approve!`);
    } else {
      for (let transaction of unapprovedCategorizedTransactions) {
        if (transaction.category_id) {
          console.log(`APPROVING: ${transaction.date} ${transaction.payee_name} ${transaction.category_name}`);
          transaction.approved = true;
          await this.ynabAPI.transactions.updateTransaction(this.budgetId, transaction.id, {
            transaction
          });
        }
      }
    }
  }
}
