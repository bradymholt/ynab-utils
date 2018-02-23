export interface IAmazonOrderInfo {
  orders: Array<IAmazonOrder>;
  items: Array< IAmazonItem>;
}

export interface IAmazonItem {
  orderId: string;
  description: string;
}

export interface IAmazonOrder {
  orderId: string;
  amount: string;
}

