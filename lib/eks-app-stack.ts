import * as cdk from "@aws-cdk/core";
import * as eks from "@aws-cdk/aws-eks";

export class EksAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const cluster = new eks.Cluster(this, "cdk-eks-cluster", {
      version: eks.KubernetesVersion.V1_18,
    });
    // The code that defines your stack goes here
  }
}
