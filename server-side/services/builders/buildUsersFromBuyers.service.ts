import { PageKeyBuilder as PageKeyEtl } from '@pepperi-addons/modelsdk';
import { BuyersGetterService } from '../getters/buyersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersFromBuyersParams: IBuildServiceParams =
{
	baseGetterService: BuyersGetterService,
	adalTableName: 'users',
	etlService: PageKeyEtl
}
