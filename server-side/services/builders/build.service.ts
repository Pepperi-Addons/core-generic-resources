import { AddonData, PapiClient, SearchBody } from '@pepperi-addons/papi-sdk';
import { PapiGetterService } from '../getters/papiGetter.service';
import { AdalService } from '../adal.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export class BuildService
{
	protected readonly pageSize = 500;
	protected papiGetterService: PapiGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient, protected buildServiceParams: IBuildServiceParams)
	{
		this.papiGetterService = new this.buildServiceParams.papiGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	public async buildAdalTable(body: any): Promise<any>
	{
    	const res = { success: true };
    	try
    	{
			await this.hideAdalItems();
			
			let papiObjects: any[];
    		do
    		{
    			if (!body.fromPage)
				{
					body.fromPage = 1;
				}

    			papiObjects = await this.papiGetterService.getPapiObjectsByPage(this.buildServiceParams.whereClause, body.fromPage, this.pageSize);
    			console.log(`FINISHED GETTING PAPI OBJECTS. RESULTS LENGTH: ${ papiObjects.length}`);

				// fix results
    			const fixedObjects = this.papiGetterService.fixPapiObjects(papiObjects);
    			console.log(`FINISHED FIXING PAPI OBJECTS. RESULTS LENGTH: ${ fixedObjects.length}`);

				
				await this.upsertToAdal(fixedObjects);

    			body.fromPage++;
    			console.log(`${this.buildServiceParams.adalTableName} PAGE UPSERT FINISHED.`);

    		} while (papiObjects.length == this.pageSize);
    	}
    	catch (error)
    	{
    		res.success = false;
    		res['errorMessage'] = error;
    	}
    	return res;
	}

	/**
	 * Hides all objects in an ADAL table by setting the Hidden field to true and setting ExpirationDateTime to now.
	 */

	protected async hideAdalItems()
	{
		if(this.buildServiceParams.shouldCleanBuild)
		{
			let objects: AddonData[];
			let page = 1;
			do
			{
				const searchOptions: SearchBody = {
					Page: page,
					PageSize: this.pageSize,
					Fields: ["Key"]
				};

				
				objects = (await this.adalService.searchResource(this.buildServiceParams.adalTableName, searchOptions)).Objects;
				console.log(`HIDING ${objects.length} OBJECTS IN ${this.buildServiceParams.adalTableName}`);
				
				// For each object, set the Hidden field to true, and set ExpirationDateTime to now
				for (const object of objects)
				{
					object.Hidden = true;
					object.ExpirationDateTime = new Date().toISOString();
				}

				// Batch upsert to adal
				await this.adalService.batchUpsert(this.buildServiceParams.adalTableName, objects);

				page++;
			}
			while (objects.length > 0);
		}
	}

	/**
	 * Uses batch upsert to upload the objects to an ADAL table.
	 * @param fixedObjects the objects to upload to an ADAL table
	 */
	protected async upsertToAdal(fixedObjects: any[])
	{
		// Since the fixedObjects array might be larger than the maximum of 500 defined by ADAL,
		// first split the fixedObjects into array of maximal size
		const fixedObjectsChunks = this.splitArrayIntoChunks(fixedObjects, this.pageSize);

		// Batch upsert to adal
		for (const fixedObjectsChunk of fixedObjectsChunks)
		{
			const batchUpsertResponse = await this.adalService.batchUpsert(this.buildServiceParams.adalTableName, fixedObjectsChunk);
			console.log(`${this.buildServiceParams.adalTableName} BATCH UPSERT RESPONSE: ${JSON.stringify(batchUpsertResponse)}`);
		}
	}

	/**
	 * Splits an array of objects into smaller arrays of a maximum size.
	 * @param arr The array of objects to split.
	 * @param maxSize The maximum size of each resulting array.
	 * @returns An array of arrays of objects, where each inner array has a maximum size of maxSize.
	 */
	protected splitArrayIntoChunks(arr: any[], maxSize: number): any[][]
	{
		const chunks: any[][] = [];
		let currentChunk: any[] = [];

		for (const item of arr)
		{
			currentChunk.push(item);
			if (currentChunk.length === maxSize)
			{
				chunks.push(currentChunk);
				currentChunk = [];
			}
		}

		if (currentChunk.length > 0)
		{
			chunks.push(currentChunk);
		}

		return chunks;
	}
}
