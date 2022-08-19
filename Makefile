
stg-cnsec2022-diff:
	EVENTABBR=cnsec2022 cdk diff -c config=stg --all

stg-cnsec2022-deploy:
	EVENTABBR=cnsec2022 cdk deploy -c config=stg --all

stg-cnsec2022-destroy:
	EVENTABBR=cnsec2022 cdk destroy -c config=stg --all

prd-cnsec2022-diff:
	EVENTABBR=cnsec2022 cdk diff -c config=prd --all

prd-cnsec2022-deploy:
	EVENTABBR=cnsec2022 cdk deploy -c config=prd --all

prd-cnsec2022-destroy:
	EVENTABBR=cnsec2022 cdk destroy -c config=prd --all
