import { AddonData, PapiClient } from '@pepperi-addons/papi-sdk';
import { IApiService } from 'core-resources-shared';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';

export abstract class BaseGetterService 
{
	protected _requestedFields: string | undefined;
	protected resourceTypeFields: string[] = [];

	constructor(protected papiClient: PapiClient, protected iApiService: IApiService)
	{
	}

	// this function makes sure the fields string is built only once
	protected async getRequestedFieldsString(): Promise<string>
	{
		if(!this._requestedFields)
		{
			this._requestedFields = await this.buildFixedFieldsString();
		}
		return this._requestedFields;
	}

    abstract getResourceName(): string; // search is performed on the given resource
    abstract buildFixedFieldsString(): Promise<string>; 
    abstract additionalFix(object): void;

    protected async getObjects(body: any, additionalFieldsString?: string): Promise<AddonData[]> 
    {
    	console.log("GETTING OBJECTS");
    	console.log(body);
    	const fieldsString = await this.getRequestedFieldsString();
    	body["Fields"] = additionalFieldsString ? `${fieldsString},${additionalFieldsString}` : fieldsString;
    	body["IncludeDeleted"] = true;
    	body["OrderBy"] = "CreationDateTime";
    	const searchResponse = await this.iApiService.searchResource(this.getResourceName(), body);
    	console.log("FINISHED GETTING OBJECTS");
    	return searchResponse.Objects;
    }

    public async getObjectsByPage(whereClause: string, page: number, pageSize: number, additionalFields?: string): Promise<AddonData[]>
    {
    	const body = {
    		PageSize: pageSize,
    		Page: page,
    		Where: whereClause
    	}
    	return await this.getObjects(body, additionalFields);
    }

    public async getObjectsByKeys(Keys: string[], additionalFields?: string): Promise<AddonData[]>
    {
    	const body = { KeyList: Keys };
    	return await this.getObjects(body, additionalFields);
    }

    protected async getSchemeFields(schemeName: string): Promise<string[]>
    {
    	const scheme = resourceNameToSchemaMap[schemeName];
    	// save fields of type "Resource" for later use
    	for(const fieldName in scheme.Fields)
    	{
    		if(scheme.Fields[fieldName].Type == "Resource") this.resourceTypeFields.push(fieldName);
    	}
    	const fields = Object.keys(scheme.Fields as any);
    	fields.push('Hidden');
    	return fields;
    }

    public fixObjects(papiObjects: any[]): any[]
    {
    	console.log("FIXING OBJECTS");
    	for (const papiObject of papiObjects)
    	{
    		this.additionalFix(papiObject);
    		// fix resource type fields
    		for (const field of this.resourceTypeFields)
    		{
    			// based on resource type field structure
    			papiObject[field] = papiObject[field]?.Data?.UUID;
    		}
    	}
    	return papiObjects;
    }
}
