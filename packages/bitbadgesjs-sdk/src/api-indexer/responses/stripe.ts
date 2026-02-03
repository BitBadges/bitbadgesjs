import { CustomTypeClass } from '@/common/base.js';

export interface iGetConnectedAccountsSuccessResponse {
  accounts: Array<{
    id: string;
    object: string;
    business_type: string;
    created: number;
    default_currency: string;
    email: string;
    type: string;
    payouts_enabled: boolean;
    display_name: string;
  }>;
}

export class GetConnectedAccountsSuccessResponse extends CustomTypeClass<GetConnectedAccountsSuccessResponse> implements iGetConnectedAccountsSuccessResponse {
  accounts: Array<{
    id: string;
    object: string;
    business_type: string;
    created: number;
    default_currency: string;
    email: string;
    type: string;
    payouts_enabled: boolean;
    display_name: string;
  }>;

  constructor(response: iGetConnectedAccountsSuccessResponse) {
    super();
    this.accounts = response.accounts;
  }
}

export interface iDeleteConnectedAccountSuccessResponse {
  deleted: boolean;
}

export class DeleteConnectedAccountSuccessResponse extends CustomTypeClass<DeleteConnectedAccountSuccessResponse> implements iDeleteConnectedAccountSuccessResponse {
  deleted: boolean;

  constructor(response: iDeleteConnectedAccountSuccessResponse) {
    super();
    this.deleted = response.deleted;
  }
}
