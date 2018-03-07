import * as puppeteer from "puppeteer";

export class ynabTransactionImporter {
  email: string;
  password: string;

  constructor(username: string, password: string) {
    this.email = username;
    this.password = password;
  }

  public async importTransactions(accountIds: string[]) {
    // Setup
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setViewport({ width: 1366, height: 768 });

    await this.login(page);
    for (let accountId of accountIds) {
      console.log(`Importing transactions for account: ${accountId}`);
      await this.importForAccount(page, accountId);
    }

    await browser.close();
  }

  private async login(page: any) {
    const loginPath = "https://app.youneedabudget.com/users/login";

    console.log(`Logging into YNAB...`);
    await page.goto(loginPath);
    await page.type(".login-username", this.email);
    await page.type(".login-password", this.password);
    await page.keyboard.press("Enter");
    await this.delay(10000);
  }

  private async importForAccount(page: any, accountId: string) {
    await page.click(`a[href$='${accountId}'`);
    await this.delay(2000);
    await page.click(".accounts-toolbar-import-transactions");
    // Wait for import and server sync
    await this.delay(5000);
  }

  private delay(milliseconds: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
