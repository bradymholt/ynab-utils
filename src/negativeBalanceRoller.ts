import * as ynab from "ynab";
import { SaveTransaction } from "ynab";
import _ from "lodash";
import moment from "moment";
import config from "../config.json";

export class negativeBalanceRoller {
  ynabAPI: ynab.api;

  constructor() {
    this.ynabAPI = new ynab.api(config.personal_access_token);
  }

  public async run() {
    const toBeBudgetedCategoryId = await this.getToBeBudgetedCategoryId();
    if (toBeBudgetedCategoryId) {
      const lastMonthISO = moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
      console.log(`Finding overspent categories in ${lastMonthISO.substr(0, 7)} ...`);
      const currentMonthISO = ynab.utils.getCurrentMonthInISOFormat(); // First day of the current month
      const budgetMonthResponse = await this.ynabAPI.months.getBudgetMonth(config.budget_id, lastMonthISO);
      const overspentCategories = budgetMonthResponse.data.month.categories.filter(
        (c) => c.balance < 0 && c.name != "Uncategorized"
      );
      const existingBalanceRollerTransactions = (
        await this.ynabAPI.transactions.getTransactionsByAccount(
          config.budget_id,
          config.balance_roller_account_id,
          currentMonthISO
        )
      ).data.transactions;

      const lastMonthName = moment().subtract(1, "month").startOf("month").format("MMMM");
      const transactionUpdates: Array<ynab.UpdateTransaction> = [];
      for (let category of overspentCategories) {
        console.log(`ROLLING: ${category.name} ${category.balance}`);

        const date = currentMonthISO;
        const account_id = config.balance_roller_account_id;
        const cleared = SaveTransaction.ClearedEnum.Uncleared;
        const memo = `${lastMonthName} overspending for ${category.name}`;
        const approved = true;

        // Send balance out of category in current month
        const existingOutflow = existingBalanceRollerTransactions.find((t) => t.memo == memo && t.amount < 0);
        const outflow = Object.assign(existingOutflow || {}, {
          date,
          account_id,
          category_id: category.id,
          amount: category.balance,
          cleared,
          memo,
          approved,
        }) as ynab.TransactionDetail;

        transactionUpdates.push(outflow);

        // Bring balance into TbB category
        const existingInflow = existingBalanceRollerTransactions.find((t) => t.memo == memo && t.amount > 0);
        const inflow = Object.assign(existingInflow || {}, {
          date,
          account_id,
          category_id: toBeBudgetedCategoryId,
          amount: -category.balance,
          cleared,
          memo,
          approved,
        }) as ynab.TransactionDetail;

        transactionUpdates.push(inflow);
      }

      if (transactionUpdates.length > 0) {
        await this.ynabAPI.transactions.updateTransactions(config.budget_id, { transactions: transactionUpdates });
      }
    }
  }

  private async getToBeBudgetedCategoryId() {
    console.log(`Finding the TbB category...`);
    let tbbCategoryId = null;
    const categoriesResponse = await this.ynabAPI.categories.getCategories(config.budget_id);
    const internalMasterCategory = categoriesResponse.data.category_groups.find(
      (c) => c.name == "Internal Master Category"
    );
    if (internalMasterCategory) {
      const toBeBudgetedCategory = internalMasterCategory.categories.find((c) => c.name == "To be Budgeted");
      if (toBeBudgetedCategory) {
        tbbCategoryId = toBeBudgetedCategory.id;
      }
    }

    return tbbCategoryId;
  }
}
