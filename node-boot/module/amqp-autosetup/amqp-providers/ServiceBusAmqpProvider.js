const azure = require("azure-sb");
const {ServiceBusClient, ReceiveMode} = require("@azure/service-bus");

module.exports = class ServiceBusAmqpProvider {

    constructor({application, logger}) {
        this.application = application;
        this.logger = logger;
    }

    /**
     * Publish to a Topic in Azure ServiceBus
     * @param routingKey
     * @param exchangeName
     * @param data
     * @param headers
     * @returns {Promise<unknown>}
     */
    async publishToExchange({routingKey, exchangeName, data, headers}) {
        const {application} = this;
        const sbClient = ServiceBusClient.createFromConnectionString(application.connectionString);
        const topicClient = sbClient.createTopicClient(exchangeName);
        const sender = topicClient.createSender();

        return new Promise(async (resolve, reject) => {
            try {
                const message = this.buildQueueObject(data, headers);
                const payload = {
                    "body": message,
                    "label": routingKey
                };
                await sender.send(payload);

                await topicClient.close();
                await sbClient.close();
                resolve();
            } catch (e) {
                await sbClient.close();
                reject(e);
            }
        });

    }

    /**
     * Consume subscription(queue) from a topic(exchange)
     * Receive as param an array
     * [
     *      [String exchangeName, String queueName, Function consumerHandler],
     *      ...
     * ]
     * @param paramArray
     * @returns {Promise<void>}
     */
    async consumeExchangeByQueue(paramArray) {
        const {application, logger} = this;

        const sbClient = ServiceBusClient.createFromConnectionString(application.connectionString);

        await this.consume({sbClient}, paramArray);
    }

    /**
     * Consume Subscription by Topic
     * @param sbClient
     * @param paramArray
     * @returns {Promise<unknown>}
     */
    async consume({sbClient}, paramArray) {
        return new Promise(async (resolve, reject) => {

            paramArray.forEach((data) => {
                const subscriptionClient = sbClient.createSubscriptionClient(data[0], data[1]);
                const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete);
                if(this.application.bindDebug){
                    subscriptionClient.getRules().then((result)=>this.logger.info("Filters of "+data[1]+" :"+JSON.stringify(result)));
                }
                receiver.registerMessageHandler((payload) => {
                    data[2](payload.body);
                }, error => reject(error));
            });

        });
    }

    /**
     * Setup the queues and exchanges based on the application file
     */
    async setupQueues() {
        const {application} = this;
        const binds = application.binds;
        const amqpConfig = application.amqp;

        const serviceBusService = azure.createServiceBusService(amqpConfig.connectionString);
        for (const bind of binds) {
            //Checking if Topic exists
            serviceBusService.getTopic(application.constants[bind.exchange.name], (error, gettopicresult, resp) => {
                if (error) this.logger.error(error);
                if(gettopicresult == null){
                    //Topic Not exist
                    if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Topic not exist.`);
                    this.createTopic(serviceBusService, application, bind);
                }else{
                    //Topic Exist
                    if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Topic already exist.`);
                    if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Deleting Topic...`);
                    serviceBusService.deleteTopic(application.constants[bind.exchange.name], async (err, resp)=>{
                        if (err) this.logger.error(err);
                        this.createTopic(serviceBusService, application, bind);
                    });
                }
            });
        }
    }


    /**
     * Create a Topic
     * @param serviceBusService
     * @param application
     * @param bind
     */
    createTopic(serviceBusService, application, bind){
        if (application.bindDebug) this.logger.info(`[${application.constants[bind.exchange.name]}] - Creating Topic...`);
        serviceBusService.createTopicIfNotExists(application.constants[bind.exchange.name], bind.exchange.options, (error) => {
            this.errorHandler(error);
            for (const queue of bind.queues) {
                //Check if subscription (queue) exist
                serviceBusService.getSubscription(application.constants[bind.exchange.name], application.constants[queue.name], (error, getsubscriptionresult, resp) => {
                    if(getsubscriptionresult == null){
                        //Queue not exist
                        if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Subscription not exist.`);
                        this.createSubscription(serviceBusService, application, bind, queue);
                    }else{
                        //Queue already exist
                        if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Subscription already exist.`);
                        if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Deleting Subscription...`);
                        serviceBusService.deleteSubscription(application.constants[bind.exchange.name], application.constants[queue.name], (error) => {
                            this.createSubscription(serviceBusService, application, bind, queue);
                        });
                    }
                });
            }
        });
    }

    /**
     * Create a subscription
     * @param serviceBusService
     * @param application
     * @param bind
     */
    async createSubscription(serviceBusService, application, bind, queue){
        if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - Creating Subscription...`);
        serviceBusService.createSubscription(application.constants[bind.exchange.name], application.constants[queue.name], (error) => {
            if (queue.routingKey != null) {
                const rule = {
                    deleteDefault: function () {
                        serviceBusService.deleteRule(application.constants[bind.exchange.name],
                            application.constants[queue.name],
                            azure.Constants.ServiceBusConstants.DEFAULT_RULE_NAME,
                            rule.handleError);
                    },
                    create: function () {
                        const ruleOptions = {
                            sqlExpressionFilter: 'sys.label=\''+queue.routingKey+'\''
                        };
                        rule.deleteDefault();
                        serviceBusService.createRule(application.constants[bind.exchange.name],
                            application.constants[queue.name],
                            queue.routingKey,
                            ruleOptions,
                            rule.handleError);
                        if (application.bindDebug) this.logger.info(`[${application.constants[queue.name]}] - bind made wih RoutingKey [${queue.routingKey}]...`);
                    },
                    handleError: function (error) {
                        if (error) {
                            this.logger.error(error)
                        }
                    }
                };
                rule.create();
            }
            this.errorHandler(error);
        });
    }

    errorHandler(error) {
        if (error) {
            //409 Error means that the subscription already exists
            if (error.code != 409) {
                this.logger.error(error);
                process.exit(500);
            }
            if (error.code == 404) {
                this.logger.error(error.detail);
                this.logger.warn("Try running again the service bus setup.")
            }
        }
    }

    /**
     * Object that is transferred between topics, based on AmqpLib object
     * @param payload
     * @param headers
     * @returns {{content: *, properties: {headers: *}}}
     */
    buildQueueObject(payload, headers) {
        return {
            content: JSON.stringify(payload),
            properties: {
                headers: headers
            }
        }
    }
}