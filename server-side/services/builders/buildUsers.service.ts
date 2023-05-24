import { UsersGetterService } from '../getters/usersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersParams: IBuildServiceParams =
{
	baseGetterService: UsersGetterService,
	adalTableName: 'users',
	whereClause: ""
}
