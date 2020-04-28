import * as ynab from "ynab";
import config from "../config.json";

export class transactionImporter {
  ynabAPI: ynab.api;

  constructor() {
    this.ynabAPI = new ynab.api(config.personal_access_token);
  }

  public async run() {
    await this.ynabAPI.transactions.importTransactions(config.budget_id);
  }
}
