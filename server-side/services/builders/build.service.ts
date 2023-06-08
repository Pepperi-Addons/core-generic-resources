import { AddonData, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { AdalService } from '../adal.service';
import { IBuildServiceParams } from './iBuildServiceParams';
import { AsyncResultObject } from '../../constants';


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

	/**
	 * Hides all items in the ADAL table, and build the table again.
	 * @param body - used to pass the fromPage parameter. Must be the entire body of the request,
	 * to support retries in an async call.
	 * @returns {AsyncResultObject} - A promise that resolves to the result of the build
	 */
	public async cleanBuildAdalTable(body: any): Promise<AsyncResultObject>
	{
		let res: AsyncResultObject = await this.hideAdalItems();

		if (res.success)
		{
			res = await this.buildAdalTable(body);
		}

		return res;	
	}

	public async buildAdalTable(body: any): Promise<AsyncResultObject>
	{
    	const res: AsyncResultObject = { success: true };
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
    		res.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    	}
    	return res;
	}

	/**
	 * Hides all objects in an ADAL table by setting the Hidden field to true and setting ExpirationDateTime to now.
	 */
	protected async hideAdalItems(): Promise<AsyncResultObject>
	{
		console.log(`HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName}`);
		
		const res: AsyncResultObject = { success: true };

		let searchResponse: SearchData<AddonData>;
		let NextPageKey: string | undefined = undefined;
		// ExpirationDateTime must be a future time, otherwise an exception is thrown
		const minuteFromNow = new Date(new Date().getTime() + new Date(1000 * 60).getTime());
		try
		{
			do
			{
				const searchOptions: SearchBody = {
					...(NextPageKey && {PageKey: NextPageKey}),
					Fields: ["Key"],
					PageSize: this.pageSize
				};

				searchResponse = await this.adalService.searchResource(this.buildServiceParams.adalTableName, searchOptions);
				console.log(`HIDING ${searchResponse.Objects.length} OBJECTS IN ${this.buildServiceParams.adalTableName}`);
				
				// For each object, set the Hidden field to true, and set ExpirationDateTime to now
				for (const object of searchResponse.Objects)
				{
					object.Hidden = true;
					object.ExpirationDateTime = minuteFromNow;
				}

				// Batch upsert to adal
				await this.adalService.batchUpsert(this.buildServiceParams.adalTableName, searchResponse.Objects);

				NextPageKey = searchResponse.NextPageKey;
			}
			while (NextPageKey);
		}
		catch (error)
		{
			res.success = false;
			res.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			console.log(`HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName} FAILED: ${res.errorMessage}`);
			return res;
		}

		console.log(`FINISHED HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName}`);
		
		return res;
	}

	/**
	 * Uses batch upsert to upload the objects to an ADAL table.
	 * @param fixedObjects the objects to upload to an ADAL table
	 */
	protected async upsertToAdal(fixedObjects: any[]): Promise<void>
	{
		// Since the fixedObjects array might be larger than the maximum of 500 defined by ADAL,
		// first split the fixedObjects into array of maximal size
		const fixedObjectsChunks = this.splitArrayIntoChunks(fixedObjects, this.pageSize);

		// Concurrently batch upsert to adal
		const maxConcurrentRequests = 5;
		
		for (let i = 0; i < fixedObjectsChunks.length; i += maxConcurrentRequests)
		{
			const end = Math.min(i + maxConcurrentRequests, fixedObjectsChunks.length);
			const concurrentBatchRequests = fixedObjectsChunks.slice(i, end).map(chunk => this.adalService.batchUpsert(this.buildServiceParams.adalTableName, chunk));
			
			const concurrentBatchResults = await Promise.allSettled(concurrentBatchRequests);

			concurrentBatchResults.forEach((result, index) => {
				if (result.status === 'rejected')
				{
					throw new Error(`Error batch upserting to ADAL: ${result.reason}`);
				}
			});
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
