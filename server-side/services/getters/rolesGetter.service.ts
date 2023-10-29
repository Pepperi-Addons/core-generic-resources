import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient, Subscription } from "@pepperi-addons/papi-sdk";
import { rolesPnsSubscription } from "../../constants";
import { AddonUUID } from "../../../addon.config.json";

export class RolesGetterService extends BaseGetterService
{ 
	// protected readonly papiRolesFields: string[] = ["InternalID", "CreationDateTime", "ModificationDateTime", "Name", "ParentInternalID"];

	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}

	public getResourceName(): string 
	{
		return 'roles';
	}
	
	public async buildFixedFieldsArray(): Promise<string[]> 
	{
		const schemaFields = await this.getSchemeFields(this.getResourceName());

		// Remove "Hidden" from the array of requested fields
		// This is done since PAPI doesn't have a Hidden field for roles.
		schemaFields.splice(schemaFields.indexOf("Hidden"), 1 );

		return schemaFields;
	}

	public singleObjectFix(role: any): void
	{
		return;
	}


	/*

	Since the roles building process can introduce numerous roles
	it might cause numerous executions of the role_roles clean build.
	In order to avoid that, the subscription is removed in the preBuildLogic,
	then put back in the postBuildLogic, as well as an async call to clean build 
	role_roles once the role building process is completed.

	*/


	public override async preBuildLogic(): Promise<void> 
	{
		await this.removeRolesSubscription()
	}

	public override async postBuildLogic(): Promise<void>
	{
		await this.setRolesSubscription();

		const asyncCall = await this.papiClient.post(`/addons/api/async/${AddonUUID}/adal/clean_build_role_roles`, {})
		console.log(`Started building role_roles. For more details see: ${JSON.stringify(asyncCall)}`);

	}

	protected async removeRolesSubscription(): Promise<Subscription>
	{
		const shouldHide = false;
		return await this.upsertSubscription(rolesPnsSubscription, shouldHide)
	}

	protected async setRolesSubscription(): Promise<Subscription>
	{
		const shouldHide = false;
		return await this.upsertSubscription(rolesPnsSubscription, shouldHide)
	}

	protected async upsertSubscription(subscription: Subscription, isHidden = false): Promise<Subscription>
	{
		const subscriptionUpdatedHidden: any = {
			...subscription,
			Hidden: isHidden,
		}
		
		return await this.papiClient.notification.subscriptions.upsert(subscriptionUpdatedHidden);
	}
}
