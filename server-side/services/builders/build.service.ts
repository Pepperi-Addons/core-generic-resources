import { PapiClient } from '@pepperi-addons/papi-sdk';
import { PapiGetterService } from '../getters/papiGetter.service';
import { AdalService } from '../adal.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export class BuildService 
{
	protected readonly pageSize = 500;
	protected papiGetterService: PapiGetterService;
	protected adalService: AdalService;

	constructor(protected papiClient: PapiClient, protected buildServiceParams: IBuildServiceParams)
	{
		this.papiGetterService = new this.buildServiceParams.papiGetterService(this.papiClient);
		this.adalService = new AdalService(this.papiClient);
	}

	public async buildAdalTable(body: any): Promise<any>
	{
    	const res = { success: true };
    	try
    	{
    		let papiObjects: any[];
    		do
    		{
    			if(!body.fromPage)
				{
					body.fromPage = 1;
				} 

    			papiObjects = await this.papiGetterService.getPapiObjectsByPage(this.buildServiceParams.whereClause, body.fromPage, this.pageSize);
    			console.log("FINISHED GETTING PAPI OBJECTS. RESULTS LENGTH: " + papiObjects.length);
    			
				// fix results
    			const fixedObjects = this.papiGetterService.fixPapiObjects(papiObjects);
    			console.log("FINISHED FIXING PAPI OBJECTS. RESULTS LENGTH: " + fixedObjects.length);

				// Batch upsert to adal
    			const batchUpsertResponse = await this.adalService.batchUpsert(this.buildServiceParams.adalTableName, fixedObjects);

    			body.fromPage++;
    			console.log(`${this.buildServiceParams.adalTableName} PAGE UPSERT FINISHED. BATCH UPSERT RESPONSE: ` + JSON.stringify(batchUpsertResponse));
        
    		} while(papiObjects.length == this.pageSize);
    	}
    	catch (error)
    	{
    		res.success = false;
    		res['errorMessage'] = error;
    	}
    	return res;
	}
}
