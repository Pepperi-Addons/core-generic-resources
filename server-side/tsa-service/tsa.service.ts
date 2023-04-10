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
    public async createTsaFieldsForSchemas(tsaKeys: string | string[]): Promise<void>
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
        for (const schema of schemas)
        {
            await this.papiClient.addons.data.schemes.post(schema);
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
        const fields = ['Name', 'OwnerObjectTypeID', 'PopulatableObjectType'];

        const searchBody = {
            UUIDList: tsaKeys,
            Fields: fields.join(','),
        }

        return await this.papiClient.post('/type_safe_attribute/search', searchBody);
    }
}
