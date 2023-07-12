import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class AccountUsersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}
	
	getResourceName(): string
	{
		return 'account_users';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		const fields = await this.getSchemeFields('account_users');
		return fields.join(',');
	}

	singleObjectFix(object): void
	{
		return;
	}

	// account_users latency compare
	async compareAccountUsersLatency() 
	{
    	const body = {
    		Fields: "Account,User",
    		IncludeDeleted: true,
    		OrderBy: "CreationDateTime",
    		PageSize: 500
    	}
		const pages = 900;
    	const papiService = new PapiService(this.papiClient) 
    	const startTime1 = Date.now();
    	for(let i=0; i<pages; i++)
    	{
			body["Page"] = i+1;
    		await papiService.searchResource("account_users", body);
    	}
    	const endTime1 = Date.now();
    	const latency1 = endTime1 - startTime1;
    	console.log(`Latency for core: ${latency1/pages} milliseconds`);
	  
    	const startTime2 = Date.now();
    	for(let i=0; i<pages; i++)
    	{
			body["Page"] = i+1;
    		await this.papiClient.post('/account_users/search', body);
    	}
    	const endTime2 = Date.now();
    	const latency2 = endTime2 - startTime2;
    	console.log(`Latency for papi: ${latency2/pages} milliseconds`);
	  
    	// Compare the latencies
    	if (latency1 < latency2) 
    	{
		  console.log('Endpoint 1 has lower latency.');
    	}
    	else if (latency1 > latency2) 
    	{
		  console.log('Endpoint 2 has lower latency.');
    	}
    	else 
    	{
		  console.log('Both endpoints have similar latency.');
    	}
	  }
}
