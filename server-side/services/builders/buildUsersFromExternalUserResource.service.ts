import { PageKeyBuilder as PageKeyEtl } from '@pepperi-addons/etl-sdk';
import { ExternalUserResourceGetterService } from '../getters/externalUserResourceGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersFromExternalUserResourceParams: IBuildServiceParams =
{
	baseGetterService: ExternalUserResourceGetterService,
	adalTableName: 'users',
	etlService: PageKeyEtl
}
