import moment from "moment";
import program from "caporal";

import { amazonMemoUpdator } from "./amazonMemoUpdator";
import { transactionImporter } from "./transactionImporter";
import { transactionApprover } from "./transactionApprover";
import { negativeBalanceRoller } from "./negativeBalanceRoller";
import { goalBudgeter } from "./goalBudgeter";

export async function run() {
  process.on("unhandledRejection", r => {
    console.log(r);
    process.exit(1);
  });
  console.info(`${moment().toISOString()} - STARTING UP`);

  program.version("1.0.0");
  program.command("transactionImporter", "Import transactions").action(async args => {
    await runUtil(transactionImporter);
  });
  program
    .command("amazonMemoUpdator", "Update Amazon transactions in YNAB with list of order items")
    .action(async args => {
      await runUtil(amazonMemoUpdator);
    });
  program.command("transactionApprover", "Auto-approves categorized transactions").action(async args => {
    await runUtil(transactionApprover);
  });
  program
    .command("negativeBalanceRoller", "Rolls negative balances from previous month forward to current month")
    .action(async args => {
      await runUtil(negativeBalanceRoller);
    });
  program.command("goalBudgeter", "Budgets current month according to Goal Targets").action(async args => {
    await runUtil(goalBudgeter);
  });
  program.command("all", "Runs all commands").action(async args => {
    await runUtil(transactionImporter);
    await runUtil(amazonMemoUpdator);
    await runUtil(transactionApprover);
    await runUtil(negativeBalanceRoller);
    await runUtil(goalBudgeter);
    process.exit(0);
  });

  program.parse(process.argv);
}

interface IRunnable {
  run(): void;
}
async function runUtil<T extends IRunnable>(a: { new (): T }) {
  try {
    console.info(`RUNNING: ${a.name}`);
    await new a().run();
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
}
