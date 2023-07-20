import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import { RESOURCE_TYPES } from 'core-resources-shared/lib/shared/src/constants';
import { resourceNameToSchemaMap } from './resourcesSchemas';

export class SchemaService 
{
	constructor(protected papiClient: PapiClient)
	{}

	/**
     * Upsert all Core Resources schemas listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
     * @throw In case a resource schema failed to create.
     */
	public async createCoreSchemas(): Promise<{schemas: AddonDataScheme[]}>

	/**
     * Upsert Core Resources schemas, as listed in resourcesList parameter.
     * @param resourcesList List of resource names which will be upserted.
     * 
     * @throw In case a resource is passed in resourcesList which is not part of RESOURCE_TYPES.
     * @throw In case a resource schema failed to create.
     */
	public async createCoreSchemas(resourcesList: string[]): Promise<{schemas: AddonDataScheme[]}>

	/**
     * Upsert the passed AddonDataSchemas.
     * @param addonDataScheme List of AddonDataScheme to be upserted.
     * 
     * @throw In case a resource schema failed to create.
     */
	 public async createCoreSchemas(addonDataScheme: AddonDataScheme[]): Promise<{schemas: AddonDataScheme[]}>

	public async createCoreSchemas(resourcesList: string[] | AddonDataScheme[] = RESOURCE_TYPES): Promise<{schemas: AddonDataScheme[]}>
	{
		const resObject = { schemas: Array<AddonDataScheme>() };

		const addonDataSchemas: AddonDataScheme[] = resourcesList.length > 0 && typeof resourcesList[0] === "string" ? resourcesList.map(el => resourceNameToSchemaMap[el]) : resourcesList as AddonDataScheme[];

		for (const schema of addonDataSchemas) 
		{
			try 
			{
				console.log(`Creating schema ${schema.Name}...`);
				resObject.schemas.push(await this.papiClient.addons.data.schemes.post(schema));
				console.log(`Schema ${schema.Name} created successfully.`);
			}
			catch (error) 
			{
				const errorMessage = `Failed to create schema ${schema.Name}: ${error instanceof Error ? error.message : 'Unknown error occurred.'}`;
				console.error(errorMessage);
				throw new Error(errorMessage);
			}
		}

		return resObject;
	}

	/**
     * Create missing Core Resources schemas, as listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
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

	/**
	 * Purge all schemas owned by the addon.
	 * @throw In case a resource schema failed to delete.
	 */
	public async purgeAllSchemas(): Promise<void>
	{
		const schemas = await this.papiClient.addons.data.schemes.get({fields: ['Name']});
		for (const schema of schemas)
		{
			try
			{
				console.log(`Purging schema ${schema.Name}...`);
				await this.papiClient.post(`/addons/data/schemes/${schema.Name}/purge`, {});
				console.log(`Schema ${schema.Name} purged.`);
			}
			catch (error)
			{
				const errorMessage = `Failed to delete schema ${schema.Name}: ${error instanceof Error ? error.message : 'Unknown error occurred.'}`;
				console.error(errorMessage);
				throw new Error(errorMessage);
			}
		}
	}
}
