import { AccountsPapiService, IApiService, PapiService } from "core-resources-shared";
import OfflineAccountsClientApiService from "./offlineAccountsClientApi.service";
import BaseClientApiService from "./baseClientApi.service";
import CatalogClientApiService from "./catalogsClientApi.service";
import { FieldType, JSONFilter, JSONRegularFilter, parse, transform } from '@pepperi-addons/pepperi-filters';
import config from '../addon.config.json';


export default class ClientApiFactory
{
	public static async getClientApi(request: any): Promise<IApiService>
	{
		const resourceName = request.query.resource_name;

		switch(resourceName)
		{
		case 'catalogs':
		{
			return new CatalogClientApiService();
		}
		case 'accounts':
		{
			const isWebAppAndNotBuyer = await ClientApiFactory.isWebAppAndNotBuyer();

			if(isWebAppAndNotBuyer)
			{
				const papiClient = await pepperi.papiClient;
				return new AccountsPapiService(papiClient);
			}
			else
			{
				return new OfflineAccountsClientApiService();
			}
		}
		case 'users':
		case 'items':
		case 'account_users':
		{
			const isWebAppAndNotBuyer = await ClientApiFactory.isWebAppAndNotBuyer();

			if(isWebAppAndNotBuyer)
			{
				const papiClient = await pepperi.papiClient;
				return new PapiService(papiClient);
			}
			else
			{
				throw new Error(`The '${resourceName}' resource doest not have offline support.`);
			}
		}
		case 'contacts':
		{
			const isInAccountScope = ClientApiFactory.isInAccountScope(request);
			const isWebAppAndNotBuyer = await ClientApiFactory.isWebAppAndNotBuyer();

			if(!isInAccountScope &&isWebAppAndNotBuyer)
			{
				const papiClient = await pepperi.papiClient;
				return new PapiService(papiClient);
			}
			else
			{
				throw new Error(`The 'contacts' resource doest not have offline support.`);
			}
		}
		default:
		{
			return new BaseClientApiService();
		}
		}
	}
	
	private static async isWebAppAndNotBuyer(): Promise<boolean>
	{
		const isWebApp = await global['app']['wApp']['isWebApp']();
		const isBuyer = await global['app']['wApp']['isBuyer']();
		return isWebApp && !isBuyer
	}

	private static async isInAccountScope(request: any): Promise<boolean> 
	{
		let isInAccountScope = false;
		const whereClause = request.body.Where;
		const resourceName = request.query.resource_name;

		const filter: JSONFilter = parse(whereClause, await ClientApiFactory.getClientApiFieldsTypes(resourceName))!;
		
		transform(filter, {
			'Account.UUID': (filter) => 
			{
				isInAccountScope = true 
			},
			'AccountUUID': (filter) => 
			{
				isInAccountScope = true 
			},
		});
		
		return isInAccountScope;
	}

	private static async getClientApiFieldsTypes(resourceName: string) : Promise<{[key: string]: FieldType}>
	{
    	const res: {[key: string]: FieldType} = {}
    	const schema = await pepperi.addons.data.schemes.uuid(config.AddonUUID).name(resourceName).get();
        
    	for(const fieldName in schema.Fields)
    	{
    		res[fieldName] = schema.Fields[fieldName].Type
    	}

    	return res;
	}
}
