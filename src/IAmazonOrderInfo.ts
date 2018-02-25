export interface IAmazonOrder {
  orderId: string;
  amount: number;
}

export interface IAmazonOrderItem {
  orderId: string;
  description: string;
}
