import * as ynab from "ynab";

export class goalBudgeter {
  ynabAPI: ynab.api;
  budgetId: string;

  readonly boo = 100000;

  constructor(accessToken: string, budgetId: string) {
    this.ynabAPI = new ynab.api(accessToken);
    this.budgetId = budgetId;
  }

  public async run() {
    const month = ynab.utils.getCurrentMonthInISOFormat();
    const budgetMonthResponse = await this.ynabAPI.months.getBudgetMonth(this.budgetId, month);
    const currentMonthData = budgetMonthResponse.data.month;

    if (currentMonthData.to_be_budgeted >= this.boo) {
      for (let category of currentMonthData.categories) {
        if (category.goal_target > 0 && category.budgeted == 0) {
          await this.ynabAPI.categories.updateMonthCategory(this.budgetId, month, category.id, {
            category: {
              budgeted: category.goal_target
            }
          });
        }
      }
    }
  }
}
