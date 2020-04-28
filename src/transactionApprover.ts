import * as ynab from "ynab";
import config from "../config.json";

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
      (t) => t.category_id != null
    );
    if (unapprovedCategorizedTransactions.length == 0) {
      console.log(`No unapproved categorized transactions to approve!`);
    } else {
      const toApproveListForDisplay = unapprovedCategorizedTransactions.map(
        (t) => ` ${t.date} ${t.payee_name} ${t.category_name}`
      );

      console.log(`Approving these transactions:\n${toApproveListForDisplay.join("\n")}`);

      unapprovedCategorizedTransactions.forEach((t) => (t.approved = true));
      const approvedTransactions = unapprovedCategorizedTransactions;
      await this.ynabAPI.transactions.updateTransactions(config.budget_id, {
        transactions: approvedTransactions,
      });
    }
  }
}
