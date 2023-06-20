import { PageNumberBuilder as PageNumberEtl } from '@pepperi-addons/modelsdk';
import { AccountUsersGetterService } from '../getters/accountUsersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildAccountUsersParams: IBuildServiceParams =
{
	baseGetterService: AccountUsersGetterService,
	adalTableName: 'account_users',
	etlService: PageNumberEtl

}
