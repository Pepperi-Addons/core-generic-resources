import { AddonDataScheme, PapiClient, Relation, Subscription } from "@pepperi-addons/papi-sdk";
import { SchemaService } from "./schema.service";
import * as Installation from './installation'
import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonUUID} from "../addon.config.json";
import { oldResourceNameToSchemaMap } from "./oldResourcesSchemas";
import { AccountsPapiService, NUMBER_OF_USERS_ON_IMPORT_REQUEST } from "core-resources-shared";
import { resolve } from "dns";

/**
 * Service for downgrading the addon.
 * 
 * Since the addon has many changes in the schemas, and a very complex
 * upgrade function, a downgrade service is needed to restore the old
 * schemas, relations and subscriptions.
 * 
 * This is done based on the schemas, relations and subscriptions as they were 
 * in version 0.6 of the addon (currently based on commit 4ec5937).
 */
export class DowngradeService
{
	schemaService: SchemaService;
	constructor(protected papiClient: PapiClient, protected client: Client)
	{
		this.schemaService = new SchemaService(papiClient);
	}

	/**
     * Downgrade the addon, and restore the old schemas, subscriptions and relations as they were in 0.6
     */
	public async downgrade(): Promise<void>
	{
		// Delete all schemas
		await this.purgeAllSchemas();

		// Delete all relations
		await this.deleteAllRelations();

		// Delete all subscriptions
		await this.deleteAllSubscriptions();

		// No need to create new schemas, there were none in 0.6

		// Create old schemas
		await this.createOldSchemas();

		// Create old relations
		await this.createOldRelations();
	}    

	/**
    * Delete all schemas
    */
	protected async purgeAllSchemas(): Promise<void>
	{
		await this.schemaService.purgeAllSchemas(); 
	}

	/**
    * Delete all relations
    */
	protected async deleteAllRelations(): Promise<void>
	{
		await Installation.removeDimxRelations(this.client, this.papiClient);
	}

	/**
    * Delete all subscriptions
    */
	protected async deleteAllSubscriptions(): Promise<void>
	{
		const subscriptions: Subscription[] = await this.papiClient.notification.subscriptions.find({ where: `AddonUUID = '${AddonUUID}'` });
		for (const subscription of subscriptions)
		{
			subscription.Hidden = true;
			await this.papiClient.notification.subscriptions.upsert(subscription);
		}
	}

	/**
    * Create 0.6 schemas
    */
	protected async createOldSchemas(): Promise<void>
	{
		const oldSchemas: AddonDataScheme[] = Object.keys(oldResourceNameToSchemaMap).map(key => oldResourceNameToSchemaMap[key]);
		await this.schemaService.createCoreSchemas(oldSchemas);
	}

	/**
     * Create 0.6 relations
     * @throws In case a relation failed to create.
     */
	protected async createOldRelations(): Promise<void>
	{
		const oldResources = Object.keys(oldResourceNameToSchemaMap);

		for (const resource of oldResources)
		{
			await this.postDimxImportRelation(resource);
		    await this.postDimxExportRelation(resource);
		}
	}

	protected async postDimxImportRelation(resource: string): Promise<void>
	{
		const importRelation: Relation = this.getPapiRelation("DataImportResource", resource);

		switch(resource)
		{
		case 'users':
		{
			// Since the creation of users takes a long while, there's a need to limit the number of posted users a single request
			importRelation['MaxPageSize'] = NUMBER_OF_USERS_ON_IMPORT_REQUEST;
			break;
		}
		}

		await this.upsertRelation(importRelation);
	}

	protected async postDimxExportRelation(resource: string): Promise<void>
	{
        const exportRelation: Relation = this.getPapiRelation("DataExportResource", resource);

		switch(resource)
		{
		case 'accounts':
		{
			// Get the DefaultDefinitionTypeID
			const papiService = new AccountsPapiService(this.papiClient);
			let typeDefinitionID: number;
			try
			{
				typeDefinitionID = (await papiService.getAccountTypeDefinitionID())[0].InternalID;
			}
			catch (error)
			{
				throw new Error(`Failed to get the DefaultDefinitionTypeID. Distributor might be missing Account with name 'Customer'. Error: ${error}`);
			}

			// Add the DefaultDefinitionTypeID to the where clauses on DIMX exports
			exportRelation['DataSourceExportParams'] = {ForcedWhereClauseAddition: `TypeDefinitionID=${typeDefinitionID}`};
			break;
		}		
		}

		await this.upsertRelation(exportRelation);
	}

	protected async upsertRelation(relation: Relation) 
	{
		this.papiClient.addons.data.relations.upsert(relation)
	}

    protected getPapiRelation(relationName: string, resourceName: string): Relation
    {
        const res: Relation = {
			RelationName: relationName,
			AddonUUID: AddonUUID,
			AddonRelativeURL: '',
			Name: resourceName,
			Type: 'AddonAPI',
			Source: 'papi',
		};

        return res;
    }
}
