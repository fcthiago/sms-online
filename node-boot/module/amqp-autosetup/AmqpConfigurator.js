const { listModules } = require('awilix');
const RabbitMQAmqpProvider = require("./amqp-providers/RabbitMQAmqpProvider");
const ServiceBusAmqpProvider = require("./amqp-providers/ServiceBusAmqpProvider");

module.exports = class AmqpConfigurator {
    constructor ({ application, container }) {
        this.application = application;
        this.container = container;
    }

    start () {
        const { application } = this;
        if(application.amqp != null){
            if(application.amqp.provider == "RabbitMQ"){
                this.container.register({
                    amqpProvider : asClass(RabbitMQAmqpProvider).singleton(),
                });
            }else if(application.amqp.provider == "AzureServiceBus"){
                this.container.register({
                    amqpProvider : asClass(ServiceBusAmqpProvider).singleton(),
                });
            }else{
                console.log("Amqp provider not set. Try one of followings [RabbitMQ, AzureServiceBus]");
                return;
            }
            const amqpProvider = this.container.resolve("amqpProvider");
            amqpProvider.setupQueues();
        }
    }

}
