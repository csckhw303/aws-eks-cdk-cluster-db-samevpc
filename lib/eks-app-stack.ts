import * as cdk from "@aws-cdk/core";
import * as eks from "@aws-cdk/aws-eks";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk8s from "cdk8s";
import * as rds from "@aws-cdk/aws-rds";
import { ApiChart } from "./apiChart";
import { CustomResource, RemovalPolicy, SecretValue } from "@aws-cdk/core";

export class EksAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const cluster = new eks.Cluster(this, "cdk-eks-cluster", {
      version: eks.KubernetesVersion.V1_18,
    });
    cluster.addNodegroupCapacity("nodegroupcapa", {
      maxSize: 5,
      minSize: 2,
      instanceTypes: [new ec2.InstanceType("t3.small")],
    });
    cluster.addAutoScalingGroupCapacity("spot-group", {
      instanceType: new ec2.InstanceType("t3.small"),
      //spotPrice: cdk.Stack.of(this).region == primaryRegion ? "0.248" : "0.192",
    });
    cluster.addCdk8sChart(
      "apichart",
      new ApiChart(new cdk8s.App(), "ApiChart")
    );

    new cdk.CfnOutput(this, "clusterVPCId", {
      value: cluster.vpc.vpcId,
    });
    new cdk.CfnOutput(this, "clusterSG", {
      value: cluster.clusterSecurityGroup.securityGroupId,
    });

    var rdsSG = new ec2.SecurityGroup(this, "productSqlDbSG", {
      vpc: cluster.vpc,
      securityGroupName: "productSqlDbSG",
      allowAllOutbound: false,
    });

    //allow my local ip
    rdsSG.addIngressRule(
      ec2.Peer.ipv4("73.195.208.133/32"),
      ec2.Port.tcp(1433)
    );
    rdsSG.connections.allowFrom(
      cluster.clusterSecurityGroup, //cluster secruity group node group sg + pod sg
      ec2.Port.tcp(1433),
      "allow eks cluster sg to access"
    );
    var sql = new rds.DatabaseInstance(this, "productSqlDb", {
      vpc: cluster.vpc,
      instanceIdentifier: "productSqlServerDb",
      engine: rds.DatabaseInstanceEngine.sqlServerEx({
        version: rds.SqlServerEngineVersion.VER_14,
      }),
      credentials: rds.Credentials.fromPassword(
        "adminUser",
        new SecretValue("Skydrive0404")
      ),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      securityGroups: [rdsSG],
      multiAz: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, "ProductSqlDbEndPointAddress", {
      value: sql.dbInstanceEndpointAddress,
    });
    //sg.addIngressRule(cluster.clusterSecurityGroup.securityGroupId);

    //https://www.youtube.com/watch?v=O1PHOVZERLI&ab_channel=AWSEvents
    // cluster.addFargateProfile("FargateProfile", {
    //   selectors: [{ namespace: "default" }, { namespace: "kube-system" }],
    // });
  }
}
