import amqp, { Connection, Channel } from 'amqplib';
import { AnyDomainEvent } from '../shared-events';

/**
 * RabbitMQ Message Broker Service
 * Maneja la conexión y comunicación con RabbitMQ
 */
export class MessageBroker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private brokerUrl: string;
  private exchangeName = 'hardware-legends-events';
  private exchangeType = 'topic';

  constructor(brokerUrl: string = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672') {
    this.brokerUrl = brokerUrl;
  }

  /**
   * Conectar a RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.brokerUrl);
      this.channel = await this.connection.createChannel();

      // Asegurar que el exchange existe
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, { durable: true });

      console.log(`[MessageBroker] Connected to RabbitMQ at ${this.brokerUrl}`);
    } catch (error: any) {
      console.error('[MessageBroker] Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Desconectar de RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('[MessageBroker] Disconnected from RabbitMQ');
    } catch (error: any) {
      console.error('[MessageBroker] Disconnect error:', error.message);
    }
  }

  /**
   * Publicar evento a una cola/topico
   */
  async publishEvent(event: AnyDomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('MessageBroker: Channel not initialized. Call connect() first.');
    }

    const routingKey = this.getRoutingKey(event.eventType);
    const messageBuffer = Buffer.from(JSON.stringify(event));

    try {
      this.channel.publish(this.exchangeName, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      });

      console.log(`[MessageBroker] Published event: ${event.eventType} (ID: ${event.eventId})`);
    } catch (error: any) {
      console.error(`[MessageBroker] Failed to publish event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Suscribirse a eventos de un tipo
   */
  async subscribe(
    eventType: string,
    handler: (event: AnyDomainEvent) => Promise<void>,
    serviceName: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('MessageBroker: Channel not initialized. Call connect() first.');
    }

    try {
      // Crear cola específica del servicio para este evento
      const queueName = `${serviceName}.${eventType}`;
      const routingKey = this.getRoutingKey(eventType);

      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, this.exchangeName, routingKey);

      // Consumir mensajes
      await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString()) as AnyDomainEvent;
            console.log(`[MessageBroker] ${serviceName} received: ${event.eventType} (ID: ${event.eventId})`);

            await handler(event);

            // Acknowledge el mensaje
            this.channel!.ack(msg);
          } catch (error: any) {
            console.error(`[MessageBroker] Error processing message: ${error.message}`);
            // Nack el mensaje y lo recoloca en la cola
            this.channel!.nack(msg, false, true);
          }
        }
      });

      console.log(`[MessageBroker] ${serviceName} subscribed to ${eventType}`);
    } catch (error: any) {
      console.error(`[MessageBroker] Subscription failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convertir tipo de evento a routing key
   */
  private getRoutingKey(eventType: string): string {
    return `event.${eventType.toLowerCase()}`;
  }

  /**
   * Health check
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

// Singleton instance
let brokerInstance: MessageBroker | null = null;

export function getBroker(url?: string): MessageBroker {
  if (!brokerInstance) {
    brokerInstance = new MessageBroker(url);
  }
  return brokerInstance;
}
