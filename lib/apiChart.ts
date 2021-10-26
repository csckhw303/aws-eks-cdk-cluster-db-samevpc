import { Construct } from "constructs";
import { App, Chart } from "cdk8s";
import { Deployment, Container, ServiceType } from "cdk8s-plus-22";

export class ApiChart extends Chart {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const label = { app: "productapi" };

    const deploy = new Deployment(this, "thedeployment", {
      containers: [
        {
          image: "661603213513.dkr.ecr.us-east-1.amazonaws.com/productapi",
          port: 80,
        },
      ],
    });

    deploy.exposeViaService({
      port: 80,
      serviceType: ServiceType.LOAD_BALANCER,
    });
  }
}
