import { AddonData, PapiClient, SearchData } from '@pepperi-addons/papi-sdk';
import { ISearchService } from 'core-resources-shared';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';

export abstract class BaseGetterService 
{
	protected _requestedFields: string | undefined;
	protected resourceTypeFields: string[] = [];

	constructor(protected papiClient: PapiClient, protected iSearchService: ISearchService, private whereClause: string = "")
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

    protected async getObjects(body: any, additionalFieldsString?: string): Promise<SearchData<AddonData>> 
    {
    	console.log("GETTING OBJECTS");
    	console.log(body);
    	const fieldsString = await this.getRequestedFieldsString();
    	body["Fields"] = additionalFieldsString ? `${fieldsString},${additionalFieldsString}` : fieldsString;
    	body["IncludeDeleted"] = true;
    	body["OrderBy"] = "CreationDateTime";
    	const searchResponse = await this.iSearchService.searchResource(this.getResourceName(), body);
    	console.log("FINISHED GETTING OBJECTS");
    	return searchResponse;
    }

    public async getObjectsByPage(page: number, pageSize: number, additionalFields?: string): Promise<SearchData<AddonData>>
    {
    	const body = {
    		PageSize: pageSize,
    		Page: page,
    		Where: this.whereClause
    	}
    	return await this.getObjects(body, additionalFields);
    }

    public async getObjectsByKeys(Keys: string[], additionalFields?: string): Promise<SearchData<AddonData>>
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
