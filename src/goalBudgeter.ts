import * as ynab from "ynab";
import * as config from "../config.json";

export class goalBudgeter {
  ynabAPI: ynab.api;

  readonly skipIfTbBLessThan = 300000;

  constructor() {
    this.ynabAPI = new ynab.api(config.personal_access_token);
  }

  public async run() {
    const month = ynab.utils.getCurrentMonthInISOFormat();
    console.log(`Fetching budget month: ${month}...`);
    const budgetMonthResponse = await this.ynabAPI.months.getBudgetMonth(config.budget_id, month);
    const currentMonthData = budgetMonthResponse.data.month;

    if (currentMonthData.to_be_budgeted >= this.skipIfTbBLessThan) {
      for (let category of currentMonthData.categories) {
        if (category.goal_target > 0 && category.budgeted == 0) {
          console.log(`Budgeting: ${category.goal_target} to ${category.name}`);
          await this.ynabAPI.categories.updateMonthCategory(config.budget_id, month, category.id, {
            category: {
              budgeted: category.goal_target
            }
          });
        }
      }
    } else {
      console.log(`Skipping because TbB of ${currentMonthData.to_be_budgeted} was less than ${this.skipIfTbBLessThan}.`);
    }
  }
}
