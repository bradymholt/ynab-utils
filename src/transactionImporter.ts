import * as puppeteer from "puppeteer";
import * as config from "../config.json";

export class transactionImporter {
  public async run() {
    // Setup
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await this.login(page);
    await this.importForAllAccounts(page);
    await browser.close();
  }

  private async login(page: puppeteer.Page) {
    const loginPath = "https://app.youneedabudget.com/users/login";

    console.log(`Logging into YNAB...`);
    await page.goto(loginPath);
    await page.type(".login-username", config.ynab_web_email);
    await page.type(".login-password", config.ynab_web_password);
    await page.keyboard.press("Enter");
    await this.delay(10000);
  }

  private async importForAllAccounts(page: puppeteer.Page) {
    let accountAnchors = await page.$$("a.nav-account-row");

    for (const anchor of accountAnchors) {
      await anchor.click();
      await this.delay(2000);
      try {
        console.log(`Importing transactions on: ${page.url()}`);
        await page.click(".accounts-toolbar-import-transactions");
        // Wait for import and server sync
        await this.delay(5000);
      } catch (error) {
        // We expect an error for Unlinked accounts (.accounts-toolbar-import-transactions does not exist) so just ignore them.
      }
    }
  }

  private delay(milliseconds: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
