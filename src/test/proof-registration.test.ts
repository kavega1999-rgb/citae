import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),list:vi.fn()}));
vi.mock('@/integrations/supabase/client.server',()=>({supabaseAdmin:{rpc:mock.rpc,storage:{from:()=>({list:mock.list})}}}));
vi.mock('@tanstack/react-start',()=>({
 createServerFn:()=>({
  inputValidator:(schema:{parse:(v:unknown)=>unknown})=>({
   handler:(fn:(v:{data:unknown})=>unknown)=>(input:{data:unknown})=>fn({data:schema.parse(input.data)})
  })
 })
}));
import { registerProof } from '@/features/booking/proof.functions';
const appointmentId='4f35c2ea-d77f-4de0-9054-fbffdcd8bd77', token='a'.repeat(64),filename='d92080a8-6356-45f1-9e6c-b3592a7ad2d3.png';
const input={appointmentId,token,path:`${appointmentId}/${filename}`};
beforeEach(()=>vi.resetAllMocks());
describe('proof registration with existing permissions',()=>{
 it('registers the existing file through the server-only RPC client',async()=>{
  mock.rpc.mockResolvedValueOnce({data:{status:'pending_payment'},error:null}).mockResolvedValueOnce({data:true,error:null});mock.list.mockResolvedValue({data:[{name:filename}],error:null});
  expect(await registerProof({data:input})).toBe(true);
  expect(mock.rpc).toHaveBeenLastCalledWith('submit_payment_proof',{p_appointment_id:appointmentId,p_token:token,p_object_path:input.path});
 });
 it('rejects invalid reservation tokens before registering files',async()=>{mock.rpc.mockResolvedValue({data:null,error:{message:'Invalid'}});await expect(registerProof({data:input})).rejects.toThrow();expect(mock.list).not.toHaveBeenCalled();expect(mock.rpc).toHaveBeenCalledTimes(1);});
 it('rejects paths belonging to another reservation',async()=>{await expect(registerProof({data:{...input,path:`313ab4f0-8e65-497a-9ccf-b4ed282f208e/${filename}`}})).rejects.toThrow();expect(mock.rpc).not.toHaveBeenCalled();});
 it('does not register a nonexistent uploaded file',async()=>{mock.rpc.mockResolvedValue({data:{status:'pending_payment'},error:null});mock.list.mockResolvedValue({data:[],error:null});await expect(registerProof({data:input})).rejects.toThrow();expect(mock.rpc).toHaveBeenCalledTimes(1);});
});
