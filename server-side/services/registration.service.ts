import { PapiClient } from "@pepperi-addons/papi-sdk";

export class RegistrationService
{
	constructor(private papiClient: PapiClient)
	{}
	
	async registerForExternalUserResource(resourceName: string): Promise<any>
	{
		const res = { success: true };
		try 
		{
			const usersSchema = await this.papiClient.addons.data.schemes.name('users').get();
			if(usersSchema.Internals?.ExternalUserResourcesRegistration)
			{
				usersSchema.Internals.ExternalUserResourcesRegistration.push({SchemaName: resourceName});
			} 
			else
			{
				usersSchema.Internals = {
					ExternalUserResourcesRegistration: [
						{SchemaName: resourceName}
					]
				}
			}
			await this.papiClient.addons.data.schemes.post(usersSchema);
		}
		catch (error)
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
		}
		return res;
	}
}
