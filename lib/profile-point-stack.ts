import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface ProfilePointProps extends StackProps {}

export class ProfilePointStack extends Stack {
    
    public readonly postProfilePointFunction: IFunction
    public readonly getProfilePointFunction: IFunction 

    constructor(scope: Construct, id: string, props: ProfilePointProps ) {
        super(scope, id, props)

        // Dynamo DB

        const profilePointTable = new Table(this, 'Table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'profileId#conference', type: AttributeType.STRING },
            sortKey: { name: 'timestamp', type: AttributeType.NUMBER },
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Lambda: postProfilePoint

        this.postProfilePointFunction = new NodejsFunction(this, 'postProfilePoint',{
            entry: 'src/post_profile_point.ts',
            environment: {
                TABLENAME: profilePointTable.tableName,
            },
        });
        this.postProfilePointFunction.addToRolePolicy(new PolicyStatement({
            resources: [
                profilePointTable.tableArn,
            ],
            actions: [
                'dynamodb:PutItem',
            ]
        }));

        // Lambda: GetProfilePoint

        this.getProfilePointFunction = new NodejsFunction(this, 'getProfilePoint',{
            entry: 'src/get_profile_point.ts',
            environment: {
                TABLENAME: profilePointTable.tableName,
            },
        });
        this.getProfilePointFunction.addToRolePolicy(new PolicyStatement({
            resources: [
                profilePointTable.tableArn,
            ],
            actions: [
                'dynamodb:Query',
            ]
        }));
    }
}

