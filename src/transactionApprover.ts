import * as ynab from "ynab";
import * as config from "../config.json";

export class transactionApprover {
  ynabAPI: ynab.api;

  constructor() {
    this.ynabAPI = new ynab.api(config.personal_access_token);
  }

  public async run() {
    console.log(`Fetching unapproved transaction from YNAB...`);
    const unapprovedTransactionResponse = await this.ynabAPI.transactions.getTransactions(
      config.budget_id,
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
          console.log(`Approving: ${transaction.date} ${transaction.payee_name} ${transaction.category_name}`);
          transaction.approved = true;
          await this.ynabAPI.transactions.updateTransaction(config.budget_id, transaction.id, {
            transaction
          });
        }
      }
    }
  }
}
