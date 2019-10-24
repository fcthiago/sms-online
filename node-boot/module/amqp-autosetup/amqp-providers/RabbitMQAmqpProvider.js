const amqp = require("amqplib");

module.exports = class RabbitMQAmqpProvider {

    constructor({application, logger}) {
        this.application = application;
        this.logger = logger;
    }

    /**
     * Publish to a RabbitMQ Exchange
     * @param routingKey
     * @param exchangeName
     * @param data
     * @param headers
     * @returns {Promise<unknown>}
     */
    async publishToExchange({ routingKey, exchangeName, data, headers }) {
        const {application} = this;
        // connect to Rabbit MQ and create a channel
        let connection = await amqp.connect(application.RABBITMQ_AMQP_URL);
        let channel = await connection.createConfirmChannel();

        return new Promise((resolve, reject) => {
            channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true, headers: headers }, function (err, ok) {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    /**
     * Receive as param an array
     * [
     *      [String exchangeName, String queueName, Function consumerHandler],
     *      ...
     * ]
     * @param paramArray
     * @returns {Promise<void>}
     */
    async consumeExchangeByQueue(paramArray){
        const { application } = this;

        // connect to Rabbit MQ
        let connection = await amqp.connect(application.RABBITMQ_AMQP_URL);

        // create a channel and prefetch 1 message at a time
        let channel = await connection.createChannel();
        await channel.prefetch(1);

        await this.consume({connection, channel}, paramArray);
    }

    /**
     * Consume from a queue
     * @param connection
     * @param channel
     * @param paramArray
     * @returns {Promise<unknown>}
     */
    async consume({ connection, channel}, paramArray){
        return new Promise((resolve, reject) => {

            paramArray.forEach((data)=>{

                channel.consume(data[1], async (payload) => {
                    await data[2](payload);
                    // acknowledge message as received
                    await channel.ack(payload);
                });

            });

            // handle connection closed
            connection.on("close", (err) => {
                return reject(err);
            });

            // handle errors
            connection.on("error", (err) => {
                return reject(err);
            });
        });
    }

    /**
     * Setup the queues and exchanges based on the application file
     */
    async setupQueues(){
        const {application} = this;
        const binds = application.binds;
        const amqpConfig = application.amqp;

        const connection = await amqp.connect(amqpConfig.connectionString);
        let channel;

        for (const bind of binds) {
            channel = await connection.createChannel();
            try{
                //Check if exchange exist
                await channel.checkExchange(application.constants[bind.exchange.name]);
                await channel.deleteExchange(application.constants[bind.exchange.name]);
                if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Exchange already exist. Deleting...`);
            }catch (e) {
                //When exchange dont exist the channel is closed
                //Here we create another channel to create an exchange on finally
                if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Exchange not exist.`);
                channel = await connection.createChannel();
            }finally {
                //Create exchange
                await channel.assertExchange(application.constants[bind.exchange.name], bind.exchange.type, bind.exchange.options);
                if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Creating Exchange...`);
            }
            await channel.close();

            for(const queue of bind.queues){
                channel = await connection.createChannel();
                try{
                    //Check if a queue exist
                    await channel.checkQueue(application.constants[queue.name]);
                    await channel.deleteQueue(application.constants[queue.name]);
                    if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Queue already exist. Deleting...`);
                }catch (e) {
                    //When queue dont exist the channel is closed
                    //Here we create another channel to create a queue on finally
                    if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Queue not exist.`);
                    channel = await connection.createChannel();
                }finally {
                    //Create Queue
                    await channel.assertQueue(application.constants[queue.name], queue.options);
                    if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Creating Queue...`);
                    await channel.bindQueue(application.constants[queue.name], application.constants[bind.exchange.name], queue.routingKey);
                    if (application.bindDebug && queue.routingKey) this.logger.info(`[${application.constants[queue.name]}] - Binding with exchange - [${application.constants[bind.exchange.name]}] with RoutingKey [${queue.routingKey}]...`);
                    if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Binding with exchange - [${application.constants[bind.exchange.name]}] ...`);
                }
                await channel.close();
            }
        }
        if (application.bindDebug) this.logger.info("[RabbitMQ Setup] - Everything ok");
    }

}