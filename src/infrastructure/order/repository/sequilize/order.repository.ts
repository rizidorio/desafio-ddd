import { where } from "sequelize";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        total: entity.total(),
      },
      {
        where: {
          id: entity.id
        },
      }
    );

    await OrderItemModel.destroy({where: {order_id: entity.id}})

    for (const item of entity.items) {
      await OrderItemModel.create({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        order_id: entity.id,
        product_id: item.productId,
      })
    }
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({ where: {id}, include: ["items"]})
    return new Order(
      orderModel.id, orderModel.customer_id, this.convertOrderItemModelToEntity(orderModel.items))
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({include: ["items"]})
    return orders.map((order) => 
      new Order(order.id, order.customer_id, this.convertOrderItemModelToEntity(order.items)))

  }

  private convertOrderItemModelToEntity(orderItemModels: OrderItemModel[]): OrderItem[] {
    return orderItemModels.map((item) => new OrderItem(
      item.id, item.name, item.price, item.product_id, item.quantity))
  }
}
