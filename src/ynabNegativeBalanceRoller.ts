import * as ynab from "ynab";
import { SaveTransaction } from "ynab";
import * as _ from "lodash";

export class ynabNegativeBalanceRoller {
  ynabAPI: ynab.api;
  budgetId: string;
  balanceRollerAccountId: string;

  constructor(accessToken: string, budgetId: string, balanceRollerAccountId: string) {
    this.ynabAPI = new ynab.api(accessToken);
    this.budgetId = budgetId;
    this.balanceRollerAccountId = balanceRollerAccountId;
  }

  public async run() {
    const toBeBudgetedCategoryId = await this.getToBeBudgetedCategoryId();
    if (toBeBudgetedCategoryId) {
      const lastMonthISO = this.getLastMonthInISOFormat();
      console.log(`Finding overspent categories in ${lastMonthISO.substr(0, 7)} ...`);
      const currentMonthISO = ynab.utils.getCurrentMonthInISOFormat(); // First day of the current month
      const budgetMonthResponse = await this.ynabAPI.months.getBudgetMonth(this.budgetId, lastMonthISO);
      const overspentCategories = budgetMonthResponse.data.month.categories.filter(
        c => c.balance < 0 && c.name != "Uncategorized"
      );
      const existingBalanceRollerTransactions = (await this.ynabAPI.transactions.getTransactionsByAccount(
        this.budgetId,
        this.balanceRollerAccountId,
        currentMonthISO
      )).data.transactions;

      const lastMonthName = this.getLastMonthName();
      const transactionUpdates: Array<ynab.SaveTransaction> = [];
      for (let category of overspentCategories) {
        console.log(`ROLLING: ${category.name} ${category.balance}`);

        const date = currentMonthISO;
        const account_id = this.balanceRollerAccountId;
        const cleared = SaveTransaction.ClearedEnum.Uncleared;
        const memo = `${lastMonthName} overspending for ${category.name}`;
        const approved = true;

        // Send balance out of category in current month
        const existingOutflow = existingBalanceRollerTransactions.find(t => t.memo == memo && t.amount < 0);
        const outflow = Object.assign(existingOutflow || {}, {
          date,
          account_id,
          category_id: category.id,
          amount: category.balance,
          cleared,
          memo,
          approved
        });

        transactionUpdates.push(outflow);

        // Bring balance into TbB category
        const existingInflow = existingBalanceRollerTransactions.find(t => t.memo == memo && t.amount > 0);
        const inflow = Object.assign(existingInflow || {}, {
          date,
          account_id,
          category_id: toBeBudgetedCategoryId,
          amount: -category.balance,
          cleared,
          memo,
          approved
        });

        transactionUpdates.push(inflow);
      }

      if (transactionUpdates.length > 0) {
        await this.ynabAPI.transactions.updateTransactions(this.budgetId, { transactions: transactionUpdates });
      }
    }
  }

  private async getToBeBudgetedCategoryId() {
    console.log(`Finding the TbB category...`);
    let tbbCategoryId = null;
    const categoriesResponse = await this.ynabAPI.categories.getCategories(this.budgetId);
    const internalMasterCategory = categoriesResponse.data.category_groups.find(
      c => c.name == "Internal Master Category"
    );
    if (internalMasterCategory) {
      const toBeBudgetedCategory = internalMasterCategory.categories.find(c => c.name == "To be Budgeted");
      if (toBeBudgetedCategory) {
        tbbCategoryId = toBeBudgetedCategory.id;
      }
    }

    return tbbCategoryId;
  }

  private getLastMonthInISOFormat() {
    let currentDate = new Date();
    let lastDateAsMilliseconds = currentDate.setMonth(currentDate.getMonth() - 1);
    let isoLocalDateString = new Date(lastDateAsMilliseconds - currentDate.getTimezoneOffset() * 60000).toISOString();
    let lastMonthInISOFormat = `${isoLocalDateString.substr(0, 7)}-01`;
    return lastMonthInISOFormat;
  }

  private getLastMonthName() {
    let currentDate = new Date();
    let lastMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    let locale = "en-us";
    let month = lastMonthDate.toLocaleString(locale, {
      month: "long"
    });
    return month;
  }
}
