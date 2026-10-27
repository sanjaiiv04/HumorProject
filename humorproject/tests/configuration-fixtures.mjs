export const BASE_PROMPT='Write one short, funny meme-style caption for this image. Keep it under 15 words. Return ONLY the caption text, no quotes, no extra commentary.'
export const CAPTION_MODEL='gemini-3.5-flash-lite'
export function fixtures(){return {
 prompt_chain_mix:[{id:'mix-1',weight:1,is_enabled:true,chain:{id:'chain-1',slug:'default-caption',name:'Default',is_active:true}}],
 prompt_chain_steps:[{id:'step-1',prompt_chain_id:'chain-1',position:1,name:'Caption',prompt_template:BASE_PROMPT,include_image:true,use_community_examples:true,use_curated_examples:false,use_terms:false,include_user_context:true,model:{id:'model-1',name:'Gemini',model_identifier:CAPTION_MODEL,is_active:true,supports_images:true,provider:{id:'provider-1',slug:'google',name:'Google',is_active:true}}}],terms:[],ai_generation_examples:[]
}}
