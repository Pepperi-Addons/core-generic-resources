import { PapiAccountBuyersGetterService } from '../getters/papiAccountBuyersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountBuyersParams: IBuildServiceParams =
{
	papiGetterService: PapiAccountBuyersGetterService,
	adalTableName: 'account_users',
	whereClause: ""
}
