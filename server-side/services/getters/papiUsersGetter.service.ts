import { PapiGetterService } from "./papiGetter.service";

export class PapiUsersGetterService extends PapiGetterService
{ 

	getResourceName(): string 
	{
		return 'users';
	}
	
	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		const fieldsString = fields.join(',');
		console.log("USERS FIELDS STRING: " + fieldsString);
		return fieldsString;
	}

	additionalFix(object: any): void
	{
		object["UserType"] = "Employee";
	}
}
