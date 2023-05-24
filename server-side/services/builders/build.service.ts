import { PapiClient } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { AdalService } from '../adal.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export class BuildService
{
	protected readonly pageSize = 500;
	protected baseGetterService: BaseGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient, protected buildServiceParams: IBuildServiceParams)
	{
		this.baseGetterService = new this.buildServiceParams.baseGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	public async buildAdalTable(body: any): Promise<any>
	{
    	const res = { success: true };
    	try
    	{
    		let papiObjects: any[];
    		do
    		{
    			if (!body.fromPage)
				{
					body.fromPage = 1;
				}

    			papiObjects = await this.baseGetterService.getObjectsByPage(this.buildServiceParams.whereClause, body.fromPage, this.pageSize);
    			console.log(`FINISHED GETTING PAPI OBJECTS. RESULTS LENGTH: ${papiObjects.length}`);

				// fix results
    			const fixedObjects = this.baseGetterService.fixObjects(papiObjects);
    			console.log(`FINISHED FIXING PAPI OBJECTS. RESULTS LENGTH: ${fixedObjects.length}`);

				
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
