import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class Helper
{
	static getPapiClient(client: Client): PapiClient
	{
		return new PapiClient({
			baseURL: client.BaseURL,
			token: client.OAuthAccessToken,
			addonUUID: client.AddonUUID,
			actionUUID: client.ActionUUID,
			addonSecretKey: client.AddonSecretKey,
		});
	}

	static queryParamsToString(params: any) 
	{
		const ret: string[] = [];

		Object.keys(params).forEach((key) => 
		{
			ret.push(key + '=' + params[key]);
		});

		return ret.join('&');
	}

	static queryStringToParams(queryString: string) 
	{
		// Create an empty object to store the key-value pairs of the query string
		const params: any = {};
	  
		// Split the query string into an array of individual key-value pairs
		const keyValuePairs = queryString.split('&');
	  
		// Loop over the array of key-value pairs
		for (const pair of keyValuePairs) 
		{
		  // Split the current key-value pair into an array containing the key and value
		  // Use the split method's optional limit argument to ensure that the resulting
		  // array always contains exactly two elements (the key and the value)
		  const [key, value] = pair.split(/=(.*)/s, 2);
	  
		  // Add the key-value pair to the params object
		  params[key] = value;
		}
	  
		// Return the params object
		return params;
	  }
}
