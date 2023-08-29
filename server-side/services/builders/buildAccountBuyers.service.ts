import { PageNumberBuilder as PageNumberEtl } from '@pepperi-addons/etl-sdk';
import { AccountBuyersGetterService } from '../getters/accountBuyersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountBuyersParams: IBuildServiceParams =
{
	baseGetterService: AccountBuyersGetterService,
	adalTableName: 'account_users',
	etlService: PageNumberEtl
}
