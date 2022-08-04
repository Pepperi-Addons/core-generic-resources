
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { CORE_BASE_URL, RESOURCE_TYPES } from './constants';
import { Helper } from './helper';

export async function install(client: Client, request: Request): Promise<any> 
{
    const res = { success: true };
	
    const papiClient = Helper.getPapiClient(client);
    try
    {
       res['resultObject'] =  await createCoreSchemas(papiClient);
    }
    catch(error)
    {
        res.success = false;
        res['errorMessage'] = error;
    }

	return res;
}

export async function uninstall(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

async function createCoreSchemas(papiClient: PapiClient)
{
    const resObject = { schemas: Array<any>() }
    for (const resource of RESOURCE_TYPES)
    {
        resObject.schemas.push( await papiClient.post(`${CORE_BASE_URL}/create?resource_name=${resource}`));
    }

    return resObject;
}
