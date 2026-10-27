import assert from 'node:assert/strict'
import test from 'node:test'
import { fixtures } from './configuration-fixtures.mjs'
import { selectChain, buildStepPrompt, loadConfiguration } from '../lib/generation/configuration.ts'
test('weighted selection uses only complete executable chains',()=>{
 const c=fixtures(),second=structuredClone(c.prompt_chain_mix[0]);second.id='mix-2';second.chain.id='chain-2';second.weight=3
 c.prompt_chain_mix.push(second);c.prompt_chain_steps.push({...structuredClone(c.prompt_chain_steps[0]),id:'step-2',prompt_chain_id:'chain-2'})
 for(const [random,expected] of [[0,'chain-1'],[0.249,'chain-1'],[0.25,'chain-2'],[0.999,'chain-2']])assert.equal(selectChain(c.prompt_chain_mix,c.prompt_chain_steps,()=>random).chain.id,expected)
 c.prompt_chain_steps[1].model.is_active=false
 assert.equal(selectChain(c.prompt_chain_mix,c.prompt_chain_steps,()=>0.99).chain.id,'chain-1')
})
test('empty, disabled, inactive, unsupported, oversized and invalid configurations cannot execute',()=>{
 for(const change of [c=>c.prompt_chain_mix=[],c=>c.prompt_chain_mix[0].is_enabled=false,c=>c.prompt_chain_mix[0].chain.is_active=false,c=>c.prompt_chain_steps=[],c=>c.prompt_chain_steps[0].model.provider.is_active=false,c=>c.prompt_chain_steps[0].model.supports_images=false,c=>c.prompt_chain_steps[0].model.model_identifier='../escape',c=>c.prompt_chain_steps[0].model.provider.slug='openai',c=>c.prompt_chain_steps[0].prompt_template=' ',c=>{for(let i=2;i<=5;i++)c.prompt_chain_steps.push({...c.prompt_chain_steps[0],id:`step-${i}`,position:i})}]){
 const c=fixtures();change(c);assert.throws(()=>selectChain(c.prompt_chain_mix,c.prompt_chain_steps))
 }
})
test('step ordering is deterministic and previous output is passed literally',()=>{
 const c=fixtures();c.prompt_chain_steps[0].position=2;c.prompt_chain_steps.push({...c.prompt_chain_steps[0],id:'first',position:1})
 const config={...selectChain(c.prompt_chain_mix,c.prompt_chain_steps),terms:[],examples:[]}
 assert.equal(config.steps[0].id,'first')
 assert.match(buildStepPrompt(config.steps[0],config,{liked:[],disliked:[]},'', '{{literal}}'),/Previous step output:\n{{literal}}/)
})
test('flags exclude optional content and enabled flags distinguish positive/negative examples',()=>{
 const c=fixtures();const config={...selectChain(c.prompt_chain_mix,c.prompt_chain_steps),terms:[{id:'t',term:'VOCAB',definition:'definition',example:'usage'}],examples:[{id:'e',caption:'CURATED',context:'context',sentiment:'negative'}]}
 const step={...config.steps[0],include_user_context:false,use_community_examples:false}
 assert.equal(buildStepPrompt(step,config,{liked:['LIKED'],disliked:['DISLIKED']},'USER',''),step.prompt_template)
 const prompt=buildStepPrompt({...step,use_terms:true,use_curated_examples:true,include_user_context:true,use_community_examples:true},config,{liked:['LIKED'],disliked:['DISLIKED']},'USER','')
 for(const text of ['VOCAB','usage','negative: CURATED','context','USER','LIKED','DISLIKED'])assert.ok(prompt.includes(text))
 assert.throws(()=>buildStepPrompt(step,config,{liked:[],disliked:[]},'','x'.repeat(64000)))
})
test('loader scopes examples, uses active content, and skips unused tables',async()=>{
 const c=fixtures(),queries=[]
 const client={from(table){const q={table,filters:[]};queries.push(q);const b={select:()=>b,eq:(...a)=>{q.filters.push(['eq',...a]);return b},in:()=>b,or:v=>{q.filters.push(['or',v]);return b},order:()=>b,limit:()=>b,overrideTypes:()=>b,then:resolve=>Promise.resolve({data:c[table],error:null}).then(resolve)};return b}}
 await loadConfiguration(client,()=>0)
 assert.deepEqual(queries.map(q=>q.table),['prompt_chain_mix','prompt_chain_steps'])
 c.prompt_chain_steps[0].use_terms=true;c.prompt_chain_steps[0].use_curated_examples=true
 await loadConfiguration(client,()=>0)
 assert.deepEqual(queries.find(q=>q.table==='terms').filters,[['eq','is_active',true]])
 assert.deepEqual(queries.find(q=>q.table==='ai_generation_examples').filters,[['eq','is_active',true],['or','prompt_chain_id.is.null,prompt_chain_id.eq.chain-1']])
})
