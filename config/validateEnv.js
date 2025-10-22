require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
  SECRET_KEY: Joi.string().required(),            
  MONGO_URI: Joi.string().uri().required(),        
  PORT: Joi.number().default(3000),               
}).unknown(); 

const { error, value: validatedEnv } = envSchema.validate(process.env, {
  abortEarly: false, 
  allowUnknown: true, 
  stripUnknown: true, 
});

if (error) {
  console.error('❌ ENV validation error(s):');
  error.details.forEach((err) => console.error(`- ${err.message}`));
  process.exit(1); 
}

console.log('✅ All required ENV variables are valid');

module.exports = validatedEnv;
