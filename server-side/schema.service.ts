import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import { RESOURCE_TYPES } from 'core-resources-shared/lib/shared/src/constants';
import { resourceNameToSchemaMap } from './resourcesSchemas';

export class SchemaService 
{
	constructor(protected papiClient: PapiClient)
	{}

	/**
     * Upsert all Core Resources schemas listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
     * @param papiClient 
     * @throw In case a resource schema failed to create.
     */
	public async createCoreSchemas(): Promise<{schemas: AddonDataScheme[]}>

	/**
     * Upsert Core Resources schemas, as listed in resourcesList parameter.
     * @param papiClient 
     * @param resourcesList List of resource names which will be upserted.
     * 
     * @throw In case a resource is passed in resourcesList which is not part of RESOURCE_TYPES.
     * @throw In case a resource schema failed to create.
     */
	public async createCoreSchemas(resourcesList: string[]): Promise<{schemas: AddonDataScheme[]}>

	public async createCoreSchemas(resourcesList: string[] = RESOURCE_TYPES): Promise<{schemas: AddonDataScheme[]}>
	{
		const resObject = { schemas: Array<AddonDataScheme>() };

		for (const resource of resourcesList) 
		{
			try 
			{
				resObject.schemas.push(await this.papiClient.addons.data.schemes.post(resourceNameToSchemaMap[resource]));
			}
			catch (error) 
			{
				const errorMessage = `Failed to create schema ${resource}: ${error instanceof Error ? error.message : 'Unknown error occurred.'}`;
				console.error(errorMessage);
				throw new Error(errorMessage);
			}
		}

		return resObject;
	}

	/**
     * Create missing Core Resources schemas, as listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
     * @param papiClient
     * @throw In case a resource schema failed to create.
     * @return List of created schemas.
     * 
     * @example
     * const missingSchemas = await schemaService.createMissingSchemas(papiClient);
     * console.log(`Created schemas: ${missingSchemas.map(schema => schema.Name)}`);
     */

	public async createMissingSchemas(): Promise<{schemas: AddonDataScheme[]}>
	{
		const missingSchemas: Array<string> = await this.getMissingSchemas();
		return await this.createCoreSchemas(missingSchemas);
	}

	/**
     * Get a list of missing schemas, as listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
     * @return List of missing schemas.
     * 
     */
	protected async getMissingSchemas(): Promise<Array<string>>
	{
		const existingSchemas = (await this.papiClient.addons.data.schemes.get({fields: ['Name']})).map(obj => obj.Name);

		const missingSchemas: Array<string> = RESOURCE_TYPES.filter(resource => !existingSchemas.includes(resource));

		return missingSchemas;
	}
}
