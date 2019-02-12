export interface IAmazonOrder {
  orderId: string;
  amount: string;
}

export interface IAmazonOrderItem {
  orderId: string;
  description: string;
}

export interface IAmazonItemsByAmount {
  [amount: string]: string
}
