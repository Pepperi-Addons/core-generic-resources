import { AddonDataScheme, FindOptions, PapiClient, SchemeField } from '@pepperi-addons/papi-sdk';
import { RESOURCE_TYPES } from 'core-resources-shared/lib/shared/src/constants';
import { getAdalFieldTypeFromPopulatableObjectType, OwnerObjectTypeIDToResourceTypeMap } from './constants';
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
    public async createCoreSchemas(papiClient: PapiClient): Promise<{schemas: AddonDataScheme[]}>

    /**
     * Upsert Core Resources schemas, as listed in resourcesList parameter.
     * @param papiClient 
     * @param resourcesList List of resource names which will be upserted.
     * 
     * @throw In case a resource is passed in resourcesList which is not part of RESOURCE_TYPES.
     * @throw In case a resource schema failed to create.
     */
    public async createCoreSchemas(papiClient: PapiClient, resourcesList: string[]): Promise<{schemas: AddonDataScheme[]}>

    public async createCoreSchemas(papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES): Promise<{schemas: AddonDataScheme[]}>
    {
        const resObject = { schemas: Array<AddonDataScheme>() };

        for (const resource of resourcesList) 
        {
            try 
            {
                resObject.schemas.push(await papiClient.addons.data.schemes.post(resourceNameToSchemaMap[resource]));
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

    public async createMissingSchemas(papiClient: PapiClient): Promise<{schemas: AddonDataScheme[]}>
    {
        const missingSchemas: Array<string> = await this.getMissingSchemas(papiClient);
        return await this.createCoreSchemas(papiClient, missingSchemas);
    }

    /**
     * Get a list of missing schemas, as listed in core-resources-shared/lib/shared/src/constants/RESOURCE_TYPES
     * @param papiClient
     * @return List of missing schemas.
     * 
     */
    protected async getMissingSchemas(papiClient: PapiClient): Promise<Array<string>>
    {
        const existingSchemas = (await papiClient.addons.data.schemes.get({fields: ['Name']})).map(obj => obj.Name);

        const missingSchemas: Array<string> = RESOURCE_TYPES.filter(resource => !existingSchemas.includes(resource));

        return missingSchemas;
    }

    /**
     * Add TSA fields to schemas
     * @param tsaKeys TSA key(s) to get to add to schemas
     */
    public async addTsaFieldToSchema(tsaKeys: string | string[]): Promise<void>
    {
        tsaKeys = Array.isArray(tsaKeys) ? tsaKeys : [tsaKeys];

        console.log(`Adding TSA fields to schemas: ${tsaKeys}`);

        // Get the TSAs from PAPI, fields: Name, OwnerObjectTypeID, PopulatableObjectType
        let tsas = await this.getTsaFields(tsaKeys);

        // Keep only TSAs that are 'papi' typed schemas supported in RESOURCE_TYPES
        tsas = tsas.filter(tsa => OwnerObjectTypeIDToResourceTypeMap.has(tsa.OwnerObjectTypeID));
        
        console.log(`Found ${tsas.length} TSAs to add to schemas`);

        // Translate OwnerObjectTypeID to schema name, and get the relevant schemas.
        // fields: Name, Fields
        const findOptions: FindOptions = {
            where: `Name in ('${tsas.map(tsa => OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID)).join("','")}')`,
            fields: ['Name', 'Fields']
        };
        const schemas: { Name: string,
                        Fields: {[key: string]: SchemeField}
                    }[] = await this.papiClient.addons.data.schemes.get(findOptions) as any;

        // Add the TSA to the relevant schema, translating PopulatableObjectType to Types
        this.addTsaFieldsToSchemas(tsas, schemas);

        // Upsert schemas
        for (const schema of schemas)
        {
            await this.papiClient.addons.data.schemes.post(schema);
        }
    }

    /*
    * Add TSA fields to schemas
    * @param tsas TSA fields to add to schemas
    * @param schemas Schemas to add TSA fields to
    * @private
    */
    private addTsaFieldsToSchemas(tsas: { Name: string; OwnerObjectTypeID: number; PopulatableObjectType: number; }[],
                                schemas: { Name: string; Fields: { [key: string]: SchemeField; }; }[])
    {
        console.log(`Adding TSA fields to schemas: ${tsas.map(tsa => tsa.Name).join(', ')}`);
        console.log(`Schemas: ${schemas.map(schema => schema.Name).join(', ')}`);

        for (const tsa of tsas) 
        {
            const schema = schemas.find(schema => schema.Name === OwnerObjectTypeIDToResourceTypeMap.get(tsa.OwnerObjectTypeID));
            if (!schema) 
            {
                console.error(`Failed to find schema for TSA '${tsa.Name}'.`);
                continue;
            }

            schema.Fields[tsa.Name] = {
                Type: getAdalFieldTypeFromPopulatableObjectType(tsa.PopulatableObjectType),
            };

            console.log(`Added TSA field '${tsa.Name}' to schema '${schema.Name}'`);
        }
    }

    /**
     * Get TSA fields from PAPI
     * @param tsaKeys TSA key(s) to get
     * @private
     * @return TSA fields
     */
    private async getTsaFields(tsaKeys: string[]): Promise<{Name: string, OwnerObjectTypeID: number, PopulatableObjectType: number}[]>
    {
        const fields = ['Name', 'OwnerObjectTypeID', 'PopulatableObjectType'];

        const searchBody = {
            UUIDList: tsaKeys,
            Fields: fields.join(','),
        }

        return await this.papiClient.post('/type_safe_attribute/search', searchBody);
    }
}
