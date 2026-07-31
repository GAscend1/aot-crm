/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const c = new Client({connectionString:'postgresql://postgres.arwtugjmppvryltddpvt:1S7hNw>8{Rf@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres'});
c.connect().then(async()=>{
  try{await c.query('ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "description" TEXT');console.log('OK')}
  catch(e){console.log(e.message)}
  await c.end()
})
