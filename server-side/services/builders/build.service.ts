import { PapiClient } from '@pepperi-addons/papi-sdk';
import { PapiGetterService } from '../getters/papiGetter.service';
import { AdalService } from '../adal.service';

export abstract class BuildService 
{
	protected adalService: AdalService;
	protected abstract papiGetterService: PapiGetterService;
	protected abstract adalTable: string;
	protected abstract where: string;
	private pageSize = 500;

	constructor(papiClient: PapiClient)
	{
		this.adalService = new AdalService(papiClient);
	}


	async buildAdalTable(body: any): Promise<any>
	{
    	const res = { success: true };
    	try
    	{
    		let results: any[];
    		do
    		{
    			if(!body.fromPage) body.fromPage = 1;
    			results = await this.papiGetterService.getPapiObjectsByPage(this.where, body.fromPage, this.pageSize);
    			console.log("FINISHED GETTING PAPI OBJECTS. RESULTS LENGTH: " + results.length);
    			// // fix results and push to adal
    			const fixedObjects = this.papiGetterService.fixPapiObjects(results);
    			console.log("FINISHED FIXING PAPI OBJECTS. RESULTS LENGTH: " + fixedObjects.length);
    			const batchUpsertResponse = await this.adalService.batchUpsert(this.adalTable, fixedObjects);
    			body.fromPage++;
    			console.log(`${this.adalTable} PAGE UPSERT FINISHED. BATCH UPSERT RESPONSE: ` + JSON.stringify(batchUpsertResponse));
        
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
