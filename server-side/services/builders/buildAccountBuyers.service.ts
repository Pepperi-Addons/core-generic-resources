import { AccountBuyersGetterService } from '../getters/accountBuyersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountBuyersParams: IBuildServiceParams =
{
	baseGetterService: AccountBuyersGetterService,
	adalTableName: 'account_users',
	whereClause: ""
}
