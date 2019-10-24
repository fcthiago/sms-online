const { createContainer, asClass, asValue, Lifetime } = require('awilix');
const RabbitMQAmqpProvider = require("./amqp-providers/RabbitMQAmqpProvider");
const ServiceBusAmqpProvider = require("./amqp-providers/ServiceBusAmqpProvider");

module.exports = async (application, container, logger) => {

    if(application.amqp != null){
        if(application.amqp.provider == "RabbitMQ"){
            if(application.amqp.connectionString == null) {
                logger.warn("Amqp Connection String not set.");
                return;
            }
            container.register({
                amqpProvider : asClass(RabbitMQAmqpProvider).singleton(),
            });
        }else if(application.amqp.provider == "AzureServiceBus"){
            if(application.amqp.connectionString == null) {
                logger.warn("Amqp Connection String not set.");
                return;
            }
            container.register({
                amqpProvider : asClass(ServiceBusAmqpProvider).singleton(),
            });
        }else{
            logger.warn("Amqp provider not set. Try one of followings [RabbitMQ, AzureServiceBus]");
            return;
        }
        const amqpProvider = container.resolve("amqpProvider");
        await amqpProvider.setupQueues();
    }

};
