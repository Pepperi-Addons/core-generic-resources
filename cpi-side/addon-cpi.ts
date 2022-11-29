import '@pepperi-addons/cpi-node'
import { CoreResourceServiceFactory } from 'core-resources-shared';
import CatalogClientApiService from './catalogsClientApi.service';
import ClientApiService from './catalogsClientApi.service';
import ClientApiFactory from './clientApiFactory';


export const router = Router();

export async function load(configuration: any) {
}

router.all('/:resourceName', async (req, res, next) => {
    try
    {
        validateResourceSupportedInCpiSide(req.params.resourceName);
    } 
    catch (err)
    {
        console.log(err);
        next(err)
    }

    req.query.resource_name = req.params.resourceName;
    next();
});

function validateResourceSupportedInCpiSide(resourceName: string)
{
    const supportedResources = ['catalogs'];

    if(!supportedResources.includes(resourceName))
    {
        throw new Error();
    }
}

router.post('/:resourceName', async (req, res, next) => {
    
    try {
       const genericResourceService = getGenericResourceService(req);
       const createdResource =  await genericResourceService.createResource();

       res.json(createdResource);
    } catch (err) {
        console.log(err);
        next(err)
    }
});

router.post('/:resourceName/key/:key', async (req, res, next) => {
    req.query.key = req.params.key;

    try {
       const genericResourceService = getGenericResourceService(req);
       const resource = await genericResourceService.getResourceByKey();

       res.json(resource);
    } catch (err) {
        console.log(err);
        next(err)
    }
});

function getGenericResourceService(req)
{
    const clientApi = ClientApiFactory.getClientApi(req.query.resource_name);
    const coreResourceService = CoreResourceServiceFactory.getResourceService(req.query?.resource_name, req, clientApi);
	return coreResourceService;
}