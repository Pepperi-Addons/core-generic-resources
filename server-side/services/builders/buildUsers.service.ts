import { PageNumberBuilder as PageNumberEtl } from '@pepperi-addons/modelsdk';
import { UsersGetterService } from '../getters/usersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersParams: IBuildServiceParams =
{
	baseGetterService: UsersGetterService,
	adalTableName: 'users',
	etlService: PageNumberEtl

}
