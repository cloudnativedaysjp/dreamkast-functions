import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BuildConfig } from './build-config'
import { IFunction } from 'aws-cdk-lib/aws-lambda';


export class VoteCFPStack extends Stack {
    public readonly voteCFPFunction: IFunction 

    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        // Dynamo DB

        const voteTable = new Table(this, 'VoteTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'eventName', type: AttributeType.STRING },
            sortKey: { name: 'timestamp', type: AttributeType.NUMBER },
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Lambda: Vote

        this.voteCFPFunction = new NodejsFunction(this, 'voteCFP',{
            entry: 'src/vote_cfp.ts',
            environment: {
                TABLENAME: voteTable.tableName,
            },
        });
        this.voteCFPFunction.addToRolePolicy(new PolicyStatement({
            resources: [
                voteTable.tableArn,
            ],
            actions: [
                'dynamodb:PutItem',
            ]
        }));
    }
}

