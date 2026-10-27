import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
registerHooks({resolve(s,c,n){
 if(s==='@/lib/supabase/server')return {url:'data:text/javascript,export async function createClient(){return globalThis.client}',shortCircuit:true}
 if(s==='@/lib/auth/signup-access')return {url:new URL('../lib/auth/signup-access.ts',import.meta.url).href,shortCircuit:true}
 if(s==='next/server')return {url:'data:text/javascript,export const NextResponse={redirect(url){return new Response(null,{status:307,headers:{location:url}})}}',shortCircuit:true}
 return n(s,c)
}})
const {canSignIn}=await import('../lib/auth/signup-access.ts')
const {GET}=await import('../app/auth/callback/route.ts')
const rpc=async()=>({data:false,error:null})
test('Columbia addresses require database approval just like other addresses',async()=>{
 for(const email of ['ab1@columbia.edu','abc1234@columbia.edu','AB123@COLUMBIA.EDU'])assert.equal(await canSignIn({rpc},email),false,email)
 for(const email of [undefined,'','a1@columbia.edu','abcd1@columbia.edu','ab12345@columbia.edu','staff@columbia.edu','ab1@sub.columbia.edu','ab1@columbia.edu.evil.test',' ab1@columbia.edu'])assert.equal(await canSignIn({rpc},email),false,email)
})
test('eligibility requires literal RPC true without error',async()=>{
 for(const [data,error,expected] of [[true,null,true],[false,null,false],[null,null,false],['true',null,false],[true,{message:'failed'},false]]){
 let called=false
 assert.equal(await canSignIn({rpc:async(...args)=>{called=true;assert.deepEqual(args,['current_user_signup_allowed']);return {data,error}}},'external@example.test'),expected)
 assert.equal(called,true)
 }
})
test('RPC outage fails closed for Columbia and external accounts',async()=>{
 const client={rpc:async()=>{throw Error('offline')}}
 assert.equal(await canSignIn(client,'ab1@columbia.edu'),false)
 assert.equal(await canSignIn(client,'external@example.test'),false)
})
function client(email,allowed=true,exchangeError=null){
 let signedOut=false
 globalThis.client={auth:{exchangeCodeForSession:async()=>({error:exchangeError}),getUser:async()=>({data:{user:email?{email}:null}}),signOut:async()=>{signedOut=true}},rpc:async()=>({data:allowed,error:null})}
 return ()=>signedOut
}
test('approved OAuth account reaches requested local page',async()=>{
 const out=client('external@example.test')
 const response=await GET(new Request('https://caprate.test/auth/callback?code=test&next=/generate'))
 assert.equal(response.headers.get('location'),'https://caprate.test/generate');assert.equal(out(),false)
})
test('blocked account has its session removed',async()=>{
 const out=client('external@example.test',false)
 const response=await GET(new Request('https://caprate.test/auth/callback?code=test'))
 assert.equal(response.headers.get('location'),'https://caprate.test/?error=signup-access');assert.equal(out(),true)
})
test('missing user cannot use RPC eligibility to pass callback',async()=>{
 const out=client(null,true)
 const response=await GET(new Request('https://caprate.test/auth/callback?code=test'))
 assert.match(response.headers.get('location'),/error=signup-access/);assert.equal(out(),true)
})
test('external redirect remains blocked',async()=>{
 client('ab1@columbia.edu')
 for(const next of ['//evil.test','https://evil.test']){
 const response=await GET(new Request('https://caprate.test/auth/callback?code=test&next='+encodeURIComponent(next)))
 assert.equal(response.headers.get('location'),'https://caprate.test/dashboard')
 }
})
test('OAuth failure and direct callback are handled',async()=>{
 assert.equal((await GET(new Request('https://caprate.test/auth/callback?error=access_denied'))).headers.get('location'),'https://caprate.test/?error=signup-access')
 assert.equal((await GET(new Request('https://caprate.test/auth/callback'))).headers.get('location'),'https://caprate.test/login')
})

test('Columbia callback cannot bypass a rejected database decision',async()=>{
 const out=client('ab123@columbia.edu',false)
 const response=await GET(new Request('https://caprate.test/auth/callback?code=test'))
 assert.equal(response.headers.get('location'),'https://caprate.test/?error=signup-access');assert.equal(out(),true)
})
