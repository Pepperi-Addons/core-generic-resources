import { PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalHelperService } from '../adalHelper.service';
import { PapiGetterService } from '../getters/papiGetter.service';

export abstract class BuildService 
{
	protected papiClient: PapiClient;
	protected adalHelperService: AdalHelperService;
	private pageSize = 500;

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
		this.adalHelperService = new AdalHelperService(papiClient);
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
    			if(!body.fromPage) body.fromPage = 1;
    			results = await this.papiGetterService.getPapiObjectsByPage(where, body.fromPage, this.pageSize);
    			console.log("FINISHED GETTING PAPI OBJECTS. RESULTS LENGTH: " + results.length);
    			// // fix results and push to adal
    			const fixedObjects = this.papiGetterService.fixPapiObjects(results);
    			console.log("FINISHED FIXING PAPI OBJECTS. RESULTS LENGTH: " + fixedObjects.length);
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
