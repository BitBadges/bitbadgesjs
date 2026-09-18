import { Command } from 'commander';
import { registerSubscriptionV2Commands } from './subscriptions-v2.js';
import { apiRequest } from '../utils/api-client.js';
import { getSession } from '../utils/auth-store.js';
import { emitIndexerResult } from '../utils/indexer-options.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
jest.mock('../utils/api-client.js',()=>({apiRequest:jest.fn(),resolveApiKey:()=> 'test-key',resolveBaseUrl:()=> 'http://localhost/api/v0'}));
jest.mock('../utils/auth-store.js',()=>({getSession:jest.fn(),formatCookieHeader:()=> 'session=test'}));
jest.mock('../utils/indexer-options.js',()=>({...jest.requireActual('../utils/indexer-options.js'),emitIndexerResult:jest.fn(),emitIndexerError:(e:unknown)=>{throw e;}}));
const creator=convertToBitBadgesAddress('0x'+'2'.repeat(40));
beforeEach(()=>{jest.clearAllMocks();(getSession as jest.Mock).mockReturnValue({expiresAt:Date.now()+60000});(apiRequest as jest.Mock).mockResolvedValue({state:'preparing',quoteId:'q'});});
async function run(args:string[]){const root=new Command();registerSubscriptionV2Commands(root);await root.parseAsync(args,{from:'user'});}
it('requests a stable exact offer with explicit authenticated session, never a transaction',async()=>{
 await run(['quote','1','--creator',creator,'--with-session','--kind','upgrade','--token-id','2','--request-id','retry-id']);
 expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({method:'POST',path:'/subscriptions/quotes',cookie:'session=test',body:{collectionId:'1',kind:'upgrade',targetTokenId:'2',requestId:'retry-id'}}));
 expect(emitIndexerResult).toHaveBeenCalledWith(expect.objectContaining({state:'preparing'}),expect.anything());
});
it('does not silently attach a stored session',async()=>{
 await expect(run(['quote','1','--creator',creator,'--kind','purchase','--token-id','1','--request-id','retry-id'])).rejects.toThrow('with-session');
 expect(apiRequest).not.toHaveBeenCalled();
});
it('reads operator config without attaching wallet cookies',async()=>{
 await run(['config']);expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({method:'GET',path:'/subscriptions/config'}));expect((apiRequest as jest.Mock).mock.calls[0][0]).not.toHaveProperty('cookie');
});
it('rejects expired sessions and invalid quote kinds before sending',async()=>{
 (getSession as jest.Mock).mockReturnValue({expiresAt:1});await expect(run(['periods','1','--creator',creator,'--with-session'])).rejects.toThrow('auth login');
 await expect(run(['quote','1','--creator',creator,'--with-session','--kind','refund','--token-id','1','--request-id','retry-id'])).rejects.toThrow('purchase or upgrade');expect(apiRequest).not.toHaveBeenCalled();
});
