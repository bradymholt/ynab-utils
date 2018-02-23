import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";

import {
  IAmazonOrderInfo,
  IAmazonItem,
  IAmazonOrder
} from "./IAmazonOrderInfo";

import { AmazonOrderReportType } from "./AmazonOrderReportType";

export class AmazonOrderFetcher {
  username: string;
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  public async getOrders(fromDateISO: string, toDateISO: string) {
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36";
    const acceptLanguageHeader = {
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8"
    };

    // Setup
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders(acceptLanguageHeader);

    // Login
    await this.login(page);

    // Get orders
    const orders = await this.fetchOrders(page, fromDateISO, toDateISO);
    const items = await this.fetchItems(page, fromDateISO, toDateISO);
    await browser.close();

    const ordersById = _.keyBy(orders, "orderId");
    const itemsByOrder = _.groupBy(items, "orderId");
    const itemsByOrderCollapsed = _.mapValues(itemsByOrder, i => {
      return i.map(o => {
        return o.description;
      }).join(", ");
    });
    const itemsByAmount = _.mapKeys(itemsByOrderCollapsed, (value, key) => {
      return ordersById[key].amount;
    });

    console.log(itemsByAmount);
  }

  private async login(page: any) {
    const loginPath = "https://www.amazon.com";

    await page.goto(loginPath);
    await page.click("#nav-signin-tooltip .nav-action-button");
    await page.waitForSelector("#ap_email");
    await page.type("#ap_email", this.username);
    await page.click(".a-button-input");
    await page.waitForSelector("#ap_password");
    await page.type("#ap_password", this.password);
    await page.click("#signInSubmit");
    await page.waitFor("#nav-your-amazon");
  }

  private async fetchOrders(page: any, fromDateISO: string, toDateISO: string) {
    const tmpDir = path.resolve(__dirname, "../tmp");
    await this.setupReport(
      page,
      fromDateISO,
      toDateISO,
      AmazonOrderReportType.Shipments
    );
    await page.click("#report-confirm");
    const fileName = await this.waitForFileToBeCreated(tmpDir);
    let items = fs.readFileSync(path.resolve(tmpDir, fileName)).toString();
    let parsed: Array<IAmazonOrder> = items.split("\n").map(a => {
      let ary = a.split(",");
      return { orderId: ary[1], amount: ary[ary.length - 3] };
    });

    return parsed;
  }

  private async fetchItems(page: any, fromDateISO: string, toDateISO: string) {
    const tmpDir = path.resolve(__dirname, "../tmp");
    await this.setupReport(
      page,
      fromDateISO,
      toDateISO,
      AmazonOrderReportType.Items
    );
    await page.click("#report-confirm");
    const fileName = await this.waitForFileToBeCreated(tmpDir);
    let items = fs.readFileSync(path.resolve(tmpDir, fileName)).toString();
    let parsed: Array<IAmazonItem> = items.split("\n").map(a => {
      let ary = a.split(",");
      return { orderId: ary[1], description: ary[2] };
    });
    return parsed;
  }

  private async setupReport(
    page: any,
    fromDateISO: string,
    toDateISO: string,
    reportType: AmazonOrderReportType
  ) {
    const orderReportsPath = "https://www.amazon.com/gp/b2b/reports";
    const fromYear = fromDateISO.substr(0, 4);
    const fromMonth = fromDateISO.substr(5, 2).replace(/^0/, "");
    const fromDay = fromDateISO.substr(8, 2).replace(/^0/, "");
    const toYear = toDateISO.substr(0, 4);
    const toMonth = toDateISO.substr(5, 2).replace(/^0/, "");
    const toDay = toDateISO.substr(8, 2).replace(/^0/, "");

    await page.goto(orderReportsPath);
    await page.select("#report-type", reportType);
    await page.select("#report-month-start", fromMonth);
    await page.select("#report-day-start", fromDay);
    await page.select("#report-year-start", fromYear);
    await page.select("#report-month-end", toMonth);
    await page.select("#report-day-end", toDay);
    await page.select("#report-year-end", toYear);

    const tmpDir = path.resolve(__dirname, "../tmp");
    this.resetDirectory(tmpDir);

    let itemsReportName = `${Date.now().toString()}-items`;
    await page.type("#report-name", itemsReportName);
    await page._client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: tmpDir
    });
  }

  private async waitForFileToBeCreated(dirPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.watch(dirPath, (eventType, filename) => {
        if (!filename.endsWith(".crdownload")) {
          resolve(filename);
        }
      });
      setTimeout(() => {
        //Timeout after 10 seconds
        reject();
      }, 10000);
    });
  }

  private resetDirectory(directoryPath: string) {
    if (fs.existsSync(directoryPath)) {
      const files = fs.readdirSync(directoryPath);
      // Delete all files
      for (const file of files) {
        fs.unlinkSync(path.join(directoryPath, file));
      }
    } else {
      // Create the directory
      fs.mkdirSync(directoryPath);
    }
  }
}
