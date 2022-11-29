import { IApiService } from "core-resources-shared";
import config from '../addon.config.json'

export default abstract class AClientApiService implements IApiService
{
    abstract createResource(resourceName: string, body: any);
    abstract getResources(resourceName: string, query: string, whereClause: string | undefined);
    abstract getResourceByKey(resourceName: string, key: string, whereClause: undefined);
    abstract getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined);
    abstract searchResource(resourceName: string, body: void);
    abstract getAccountTypeDefinitionID();
    
    protected async getRequestedFields(resourceName: string) {
        const schema = await pepperi.addons.data.schemes.uuid(config.AddonUUID).name(resourceName).get();
        const schemaFields = Object.keys(schema.Fields);
        return schemaFields;
    }
}
