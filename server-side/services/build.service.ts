import { Helper } from 'core-resources-shared';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { AdalHelperService } from './adalHelper.service';
import { PapiGetterService } from './papiGetter.service';

export abstract class BuildService 
{
	papiClient: PapiClient;
	adalHelperService: AdalHelperService;
	pageSize = 500;

	constructor(client: Client)
	{
		this.papiClient = Helper.getPapiClient(client);
		this.adalHelperService = new AdalHelperService(client);
	}

	abstract papiGetterService: PapiGetterService;
    abstract buildAdalTable(body: any): Promise<any>;

    async buildAdalTableHelper(adalTable: string, body: any, where = ""): Promise<any>
    {
    	const res = { success: true };
    	try
    	{
    		let results: any[];
    		do
    		{
    			results = await this.papiGetterService.getPapiObjectsByPage(where, body.fromPage, this.pageSize);
    			// // fix results and push to adal
    			const fixedObjects = this.papiGetterService.fixPapiObjects(results);
    			const batchUpsertResponse = await this.adalHelperService.batchUpsert(fixedObjects, adalTable);
    			body.fromPage++;
    			console.log(`${adalTable} PAGE UPSERT FINISHED. BATCH UPSERT RESPONSE: ` + JSON.stringify(batchUpsertResponse));
        
    		} while(results.length == this.pageSize);
    	}
    	catch (error)
    	{
    		res.success = false;
    		res['errorMessage'] = error;
    	}
    	return res;
    }

    
}
