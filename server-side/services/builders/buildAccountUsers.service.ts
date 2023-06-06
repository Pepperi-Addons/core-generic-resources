import { AccountUsersGetterService } from '../getters/accountUsersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountUsersParams: IBuildServiceParams =
{
	baseGetterService: AccountUsersGetterService,
	adalTableName: 'account_users',
	whereClause: ""
}
