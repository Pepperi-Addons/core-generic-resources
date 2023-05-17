import { FindOptions, PapiClient, SchemeField } from '@pepperi-addons/papi-sdk';
import { getAdalFieldTypeFromPopulatableObjectType, OwnerObjectTypeIDToResourceTypeMap, SchemaNameAndFields, TSA } from './constants';

export class TsaService 
{
	constructor(protected papiClient: PapiClient)
	{}

	/**
     * Creates TSA fields for supported resources, given TSA keys.
     * @public
     * @param {string|string[]} tsaKeys - TSA key(s) as a string or an array of strings.
     * @returns {Promise<void>} - Promise that resolves when the upsert is complete.
     */
	public async createTsaFieldsOnSchemas(tsaKeys: string | string[]): Promise<void>
	{
		tsaKeys = Array.isArray(tsaKeys) ? tsaKeys : [tsaKeys];

		console.log(`Adding TSA fields to schemas: ${tsaKeys}`);

		// Get the TSAs from PAPI, fields: Name, OwnerObjectTypeID, PopulatableObjectType
		const tsas: TSA[] = await this.getSupportedResourcesTsas(tsaKeys);
        
		console.log(`Found ${tsas.length} TSAs to add to schemas`);

		// Translate OwnerObjectTypeID to schema name, and get the relevant schemas.
		// fields: Name, Fields
		const schemas: SchemaNameAndFields[] = await this.getRelevantSchemas(tsas);

		// Add the TSA to the relevant schema, translating PopulatableObjectType to Types
		this.addTsaFieldsToSchemasFieldsObject(tsas, schemas);

		// Upsert schemas
		await this.upsertSchemas(schemas);
	}

	/**
     * Adds and removes TSA fields on schemas based on the provided list of modified objects.
     * @public
     * @async
     * @param {{ Key: string; OldName: string; }[]} modifiedObjects - Array of modified objects with Key and OldName properties.
     * @returns {Promise<void>} - Promise that resolves with void when the operation is completed.
     */
	public async modifyTsaFieldsOnSchemas(modifiedObjects: { Key: string; OldName: string;}[]): Promise<void>
	{
		// Since PNS notifications are not reliable in terms, we will always delete the old name,
		// get the TSA from PAPI, and add the new name.
		// That way, by the end of the process, we will have the correct TSA fields on the schemas.

		// Get the TSAs from PAPI, fields: Name, OwnerObjectTypeID, PopulatableObjectType
		const newTsas: TSA[] = await this.getSupportedResourcesTsas(modifiedObjects.map(obj => obj.Key));
		const outdatedTsas: TSA[] = await this.getOutdatedTsas(modifiedObjects, newTsas)
        
		console.log(`Found ${newTsas.length} TSAs to add to schemas`);

		// Translate OwnerObjectTypeID to schema name, and get the relevant schemas.
		// fields: Name, Fields
		const schemas: SchemaNameAndFields[] = await this.getRelevantSchemas(newTsas);

		// Remove the old TSA fields from the schemas
		this.removeTsasFromSchemasFieldsObject(outdatedTsas, schemas);
        
		// Add the TSA to the relevant schema, translating PopulatableObjectType to Types
		this.addTsaFieldsToSchemasFieldsObject(newTsas, schemas);

		// Upsert schemas
		await this.upsertSchemas(schemas);
	}

	/**
     * Gets the outdated TSAs from the modifiedObjects and newTsas inputs.
     * @private
     * @param {Array<{ Key: string; OldName: string; }>} modifiedObjects - Array of modified objects with 'Key' and 'OldName' properties.
     * @param {TSA[]} newTsas - Array of new TSAs to compare against.
     * @returns {TSA[]} - Array of outdated TSAs with UUID, Name, OwnerObjectTypeID, and PopulatableObjectType properties.
     */
	private getOutdatedTsas(modifiedObjects: { Key: string; OldName: string; }[], newTsas: TSA[]): TSA[]
	{
		const outdatedTsas: TSA[] = [];
		// build a map of Key to old TSA name
		const keyToOldNameMap = new Map<string, string>(modifiedObjects.map(obj => [obj.Key, obj.OldName]));

		for (const newTsa of newTsas)
		{
			const oldName = keyToOldNameMap.get(newTsa.UUID);
			if (oldName)
			{
				outdatedTsas.push({
					UUID: newTsa.UUID,
					Name: oldName,
					OwnerObjectTypeID: newTsa.OwnerObjectTypeID,
					PopulatableObjectType: newTsa.PopulatableObjectType
				});

				console.log(`Found outdated TSA '${oldName}' for new TSA '${newTsa.Name}'`);

				keyToOldNameMap.delete(newTsa.UUID);
			}
		}

		return outdatedTsas;
	}

	/**
     * Removes the fields associated with outdated TSAs from the given schemas' fields object.
     * @private
     * @param {TSA[]} outdatedTsas - Array of outdated TSAs with UUID, Name, OwnerObjectTypeID, and PopulatableObjectType properties.
     * @param {SchemaNameAndFields[]} schemas - Array of schemas with Name and Fields properties to remove TSA fields from.
     * @returns {void}
     */
	private removeTsasFromSchemasFieldsObject(outdatedTsas: TSA[], schemas: SchemaNameAndFields[]): void
	{
		console.log(`Removing TSA fields from schemas: ${outdatedTsas.map(tsa => tsa.Name).join(', ')}`);
		console.log(`Schemas: ${schemas.map(schema => schema.Name).join(', ')}`);

		const schemaNameToFieldsMap = new Map<string, {[key: string]: SchemeField}>(
			schemas.map(schema => [schema.Name, schema.Fields])
		);

		for (const tsa of outdatedTsas) 
		{
			let schemaFields: { [key: string]: SchemeField } | undefined; 
			if(OwnerObjectTypeIDToResourceTypeMap.has(tsa.OwnerObjectTypeID))
			{
				// Since schemaFields is a pointer to the actual object in the map, we can modify it directly.
				// This is why we don't need to set the value back to the original schema object.
				schemaFields = schemaNameToFieldsMap.get(OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)!);
			}

			if (schemaFields) 
			{
				delete schemaFields[tsa.Name];
				console.log(`Deleted TSA field '${tsa.Name}' from schema '${OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)}'`);
			}
			else
			{
				console.error(`Failed to find schema for TSA '${tsa.Name}'.`);
			}
		}
	}

	/**
     * Retrieves the schemas that should include the provided TSA objects.
     * @private
     * @param {TSA[]} tsas - Array of TSA objects.
     * @returns {Promise<SchemaNameAndFields[]>} - Promise that resolves to an array of SchemaNameAndFields objects.
     * @throws {Error} - If there is an error while retrieving schemas.
     */
	private async getRelevantSchemas(tsas: TSA[]): Promise<SchemaNameAndFields[]>
	{
		const findOptions: FindOptions = {
			where: `Name in ('${tsas.map(tsa => OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)).join("','")}')`,
			fields: ['Name', 'Fields']
		};
		const schemas: SchemaNameAndFields[] = await this.papiClient.addons.data.schemes.get(findOptions) as any;
		return schemas;
	}

	/**
     * Retrieves TSA objects for the given TSA keys, filtered based on supported resources.
     * @private
     * @param {string[]} tsaKeys - Array of TSA keys.
     * @returns {Promise<TSA[]>} - Promise that resolves to an array of TSA objects.
     */
	private async getSupportedResourcesTsas(tsaKeys: string[]): Promise<TSA[]>
	{
		let tsas = await this.getTsaFields(tsaKeys);

		// Keep only TSAs that are 'papi' typed schemas supported in RESOURCE_TYPES
		tsas = tsas.filter(tsa => OwnerObjectTypeIDToResourceTypeMap.has(tsa.OwnerObjectTypeID));
		return tsas;
	}

	/**
    * Add TSA fields to schemas
    * @param tsas TSA fields to add to schemas
    * @param schemas Schemas to add TSA fields to
    * @private
    */
	private addTsaFieldsToSchemasFieldsObject(tsas: TSA[],
		schemas: SchemaNameAndFields[]): void
	{
		console.log(`Adding TSA fields to schemas: ${tsas.map(tsa => tsa.Name).join(', ')}`);
		console.log(`Schemas: ${schemas.map(schema => schema.Name).join(', ')}`);

		const schemaNameToFieldsMap = new Map<string, {[key: string]: SchemeField}>(
			schemas.map(schema => [schema.Name, schema.Fields])
		);

		for (const tsa of tsas) 
		{
			let schemaFields: { [key: string]: SchemeField } | undefined; 
			if(OwnerObjectTypeIDToResourceTypeMap.has(tsa.OwnerObjectTypeID))
			{
				// Since schemaFields is a pointer to the actual object in the map, we can modify it directly.
				// This is why we don't need to set the value back to the original schema object.
				schemaFields = schemaNameToFieldsMap.get(OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)!);
			}

			if (schemaFields) 
			{
				schemaFields[tsa.Name] = {
					Type: getAdalFieldTypeFromPopulatableObjectType(tsa.PopulatableObjectType),
				};
    
				console.log(`Added TSA field '${tsa.Name}' to schema '${OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)}'`);
			}
			else
			{
				console.error(`Failed to find schema for TSA '${tsa.Name}'.`);
			}
		}
	}

	/**
     * Get TSA fields from PAPI
     * @param tsaKeys TSA key(s) to get
     * @private
     * @return TSA fields
     */
	private async getTsaFields(tsaKeys: string[]): Promise<TSA[]>
	{
		const fields = ['UUID', 'Name', 'OwnerObjectTypeID', 'PopulatableObjectType'];

		const searchBody = {
			UUIDList: tsaKeys,
			Fields: fields.join(','),
		}

		return await this.papiClient.post('/type_safe_attribute/search', searchBody);
	}

	/**
     * Upserts the given schemas.
     * @private
     * @param {SchemaNameAndFields[]} schemas - Array of schemas with Name and Fields properties to upsert.
     * @returns {Promise<void>} - Promise that resolves when all schemas have been upserted.
     * @throws {Error} - If there is an error while upserting schemas.
     */
	private async upsertSchemas(schemas: SchemaNameAndFields[]): Promise<void>
	{
		for (const schema of schemas) 
		{
			await this.papiClient.addons.data.schemes.post(schema);
		}
	}
}
