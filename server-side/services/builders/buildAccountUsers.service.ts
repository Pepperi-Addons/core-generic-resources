import { PapiAccountUsersGetterService } from '../getters/papiAccountUsersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountUsersParams: IBuildServiceParams =
{
	papiGetterService: PapiAccountUsersGetterService,
	adalTableName: 'account_users',
	whereClause: ""
}
