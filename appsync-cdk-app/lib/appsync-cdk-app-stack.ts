import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from "@aws-cdk/aws-s3";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";

export class AppsyncCdkAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "S3Bucket", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });
    //s3 bucket deployment and specifying that where is the content
    new s3Deployment.BucketDeployment(this, "buketdeploy", {
      sources: [s3Deployment.Source.asset("../public")],
      destinationBucket: bucket,
    });
    //cloudfront (aws cdn)
    new cloudfront.Distribution(this, "distribution", {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });
    // Creates the AppSync API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-notes-appsync-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          // apiKeyConfig: {
          //   expires: cdk.Expiration.after(cdk.Duration.days(365))
          // }
        },
      },
      xrayEnabled: true,
    });

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });
    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });
    // lib/appsync-cdk-app-stack.ts
    const notesLambda = new lambda.Function(this, 'AppSyncNotesHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    // Set the new Lambda function as a data source for the AppSync API
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', notesLambda);

    // lib/appsync-cdk-app-stack.ts
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getNoteById"
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listNotes"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createNote"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteNote"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateNote"
    });

    // create DynamoDB table
    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(notesLambda)
    
    notesLambda.addEnvironment('NOTES_TABLE', notesTable.tableName);
  }
}
