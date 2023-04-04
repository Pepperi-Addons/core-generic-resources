import { PapiGetterService } from "./papiGetter.service";

export class PapiUsersService extends PapiGetterService
{ 

	getResourceName(): string 
	{
		return 'users';
	}
	
	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		return fields.join(',');
	}

	additionalFix(object: any): void
	{
		object["UserType"] = "Employee";
	}
}
