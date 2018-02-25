import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";

import { AmazonOrderReportTypeEmum } from "./AmazonOrderReportTypeEnum";
import { IAmazonOrderItem, IAmazonOrder } from "./IAmazonOrderInfo";

export class AmazonOrderFetcher {
  email: string;
  password: string;

  constructor(username: string, password: string) {
    this.email = username;
    this.password = password;
  }

  public async getOrders(fromDateISO: string, toDateISO: string) {
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36";
    const acceptLanguageHeader = {
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8"
    };

    // Setup
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders(acceptLanguageHeader);

    await this.login(page);

    // Get orders and items
    const orders = await this.fetchOrders(page, fromDateISO, toDateISO);
    const items = await this.fetchOrderItems(page, fromDateISO, toDateISO);

    await browser.close();

    const ordersById = _.keyBy(orders, "orderId");
    const itemsListByOrderId = _.mapValues(_.groupBy(items, "orderId"), i => {
      return i
        .map(d => {
          return d.description;
        })
        .join(", ");
    });

    const itemsListByOrderAmount = _.mapKeys(
      itemsListByOrderId,
      (value, key) => {
        return ordersById[key].amount;
      }
    );

    return itemsListByOrderAmount;
  }

  private async login(page: any) {
    const loginPath = "https://www.amazon.com";

    await page.goto(loginPath);
    await page.click("#nav-signin-tooltip .nav-action-button");
    await page.waitForSelector("#ap_email");
    await page.type("#ap_email", this.email);
    await page.click(".a-button-input");
    await page.waitForSelector("#ap_password");
    await page.type("#ap_password", this.password);
    await page.click("#signInSubmit");
    await page.waitFor("#nav-your-amazon");
  }

  private async fetchOrders(page: any, fromDateISO: string, toDateISO: string) {
    const tmpDirectoryPath = path.resolve(__dirname, "../tmp");
    await this.setupReportParameters(
      page,
      fromDateISO,
      toDateISO,
      AmazonOrderReportTypeEmum.Shipments
    );
    await page.click("#report-confirm");
    const fileName = await this.waitForFileToBeCreated(tmpDirectoryPath);
    let items = fs
      .readFileSync(path.resolve(tmpDirectoryPath, fileName))
      .toString();
    let parsedOrders: Array<IAmazonOrder> = items
      .split("\n")
      .filter((val, index) => {
        return index > 0 && val.length > 0;
      })
      .map(a => {
        let ary = a.split(",");
        return {
          orderId: ary[1],
          amount: Number(ary[ary.length - 3].replace(/^\$/, "")).toFixed(2)
        };
      });

    return parsedOrders;
  }

  private async fetchOrderItems(
    page: any,
    fromDateISO: string,
    toDateISO: string
  ) {
    const tmpDirectoryPath = path.resolve(__dirname, "../tmp");
    await this.setupReportParameters(
      page,
      fromDateISO,
      toDateISO,
      AmazonOrderReportTypeEmum.Items
    );
    await page.click("#report-confirm");
    const fileName = await this.waitForFileToBeCreated(tmpDirectoryPath);
    let items = fs
      .readFileSync(path.resolve(tmpDirectoryPath, fileName))
      .toString();
    let parsedOrderItems: Array<IAmazonOrderItem> = items
      .split("\n")
      .filter((val, index) => {
        return index > 0 && val.length > 0;
      })
      .map(a => {
        let ary = a.split(",");
        return {
          orderId: ary[1],
          description: ary[2].replace(/\"/, "")
        };
      });
    return parsedOrderItems;
  }

  private async setupReportParameters(
    page: any,
    fromDateISO: string,
    toDateISO: string,
    reportType: AmazonOrderReportTypeEmum
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

  /**
   * Returns a promise that will be resolved once a file has been created in a directory
   * @param directoryPath
   * @param timeoutMilliseconds
   */
  private async waitForFileToBeCreated(
    directoryPath: string,
    timeoutMilliseconds = 10000
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.watch(directoryPath, (eventType, filename) => {
        if (!filename.endsWith(".crdownload")) {
          resolve(filename);
        }
      });
      setTimeout(() => {
        reject();
      }, timeoutMilliseconds);
    });
  }

  /**
   * Creates a directory if it does exist or deletes all files in a directory if it already exists
   * @param directoryPath
   */
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
