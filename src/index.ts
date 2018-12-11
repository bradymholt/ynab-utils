import * as moment from "moment";
import * as program from "caporal";
import * as config from "../config.json";

import { ynabAmazonMemoUpdator } from "./ynabAmazonMemoUpdator";
import { ynabTransactionImporter } from "./ynabTransactionImporter";
import { ynabTransactionApprover } from "./ynabTransactionApprover";
import { ynabNegativeBalanceRoller } from "./ynabNegativeBalanceRoller";

export async function run() {
  process.on("unhandledRejection", r => {
    console.log(r);
    process.exit(1);
  });
  console.info(`${moment().toISOString()} - STARTING UP`);

  program.version("1.0.0");
  program.command("importTransactions", "Import transactions").action(async args => {
    await importTransactions();
  });
  program
    .command("updateAmazonMemos", "Update Amazon transactions in YNAB with list of order items")
    .action(async args => {
      await updateAmazonMemos();
    });
  program.command("approveTransactions", "Auto-approves categorized transactions").action(async args => {
    await approveTransactions();
  });
  program.command("rollNegativeBalancesForward", "Rolls negative balances from previous month forward to current month").action(async args => {
    await rollNegativeBalancesForward();
  });
  program.command("all", "Runs all commands").action(async args => {
    await importTransactions();
    await updateAmazonMemos();
    await approveTransactions();
    await rollNegativeBalancesForward();
    process.exit(0);
  });

  program.parse(process.argv);
}

async function importTransactions() {
  console.info(`RUNNING: importTransactions`);
  try {
    await new ynabTransactionImporter(config.ynab_web_email, config.ynab_web_password).run();
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
}
async function updateAmazonMemos() {
  console.info(`RUNNING: updateAmazonMemos`);
  try {
    await new ynabAmazonMemoUpdator(
      config.personal_access_token,
      config.budget_id,
      config.amazon_email,
      config.amazon_password
    ).run();
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
}
async function approveTransactions() {
  console.info(`RUNNING: approveTransactions`);
  try {
    await new ynabTransactionApprover(config.personal_access_token, config.budget_id).run();
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
}
async function rollNegativeBalancesForward() {
  console.info(`RUNNING: rollNegativeBalancesForward`);
  try {
    await new ynabNegativeBalanceRoller(config.personal_access_token, config.budget_id, config.balance_roller_account_id).run();
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
}
