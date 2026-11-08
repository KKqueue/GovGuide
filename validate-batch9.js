const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'services');
const ENTITY_PREFIXES = ['applicant','workflow','event','company','business','establishment','employee','enterprise','vehicle','transaction','property','premises','beneficiary','guardian','project','licensee','subscriber','petitioner','operator','dealer','manufacturer'];
const OPERATORS = ['EQUALS','NOT_EQUALS','LESS_THAN','GREATER_THAN','IN_SET'];
const SOURCE_FIELDS = ['sourceCode','url','title','publisher','jurisdiction','sourceCategory','checkedAt','sourceLastReviewedAt','accessStatus','verificationStatus','evidenceExcerpt','reusePolicy','claimsSupported','uncertainty'];

const newFiles = [
  'pmfby-crop-insurance.v1.json','pm-svanidhi.v1.json','pm-ujjwala-yojana.v1.json',
  'stand-up-india-loan.v1.json','pmegp-loan.v1.json','aadhaar-update.v1.json',
  'passport-tatkal.v1.json','ignoaps-old-age-pension.v1.json','pm-matru-vandana.v1.json',
  'national-food-security.v1.json','vehicle-hypothecation-removal.v1.json','kisan-vikas-patra.v1.json',
  'pm-laghu-vyapari-pension.v1.json','neet-ug-registration.v1.json','jee-main-registration.v1.json'
];

let totalIssues = 0;
for (const file of newFiles) {
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) { console.log(`MISSING: ${file}`); totalIssues++; continue; }
  let data;
  try { data = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) { console.log(`JSON ERROR: ${file}: ${e.message}`); totalIssues++; continue; }
  
  const issues = [];
  const srcCodes = new Set();
  
  // Check sources
  if (!data.sources || !Array.isArray(data.sources)) { issues.push('Missing sources array'); }
  else {
    for (const s of data.sources) {
      for (const f of SOURCE_FIELDS) {
        if (f === 'claimsSupported') { if (!Array.isArray(s[f])) issues.push(`Source ${s.sourceCode||'?'}: claimsSupported must be array`); }
        else if (!s[f] && s[f] !== 0) issues.push(`Source ${s.sourceCode||'?'}: missing ${f}`);
      }
      if (s.sourceCode) srcCodes.add(s.sourceCode);
    }
  }
  
  // Check conditions
  if (data.conditions) {
    for (const c of data.conditions) {
      if (!c.conditionCode) issues.push(`Condition missing conditionCode`);
      if (c.field) {
        const dot = c.field.indexOf('.');
        if (dot <= 0 || dot >= c.field.length - 1) issues.push(`Condition ${c.conditionCode||'?'}: bad field format`);
        else {
          const prefix = c.field.substring(0, dot);
          if (!ENTITY_PREFIXES.includes(prefix)) issues.push(`Condition ${c.conditionCode||'?'}: invalid prefix '${prefix}'`);
        }
      }
      if (c.operator && !OPERATORS.includes(c.operator)) issues.push(`Condition ${c.conditionCode||'?'}: invalid operator '${c.operator}'`);
    }
  }
  
  // Check eligibility conditions
  if (data.eligibility && data.eligibility.verifiedConditions) {
    for (const c of data.eligibility.verifiedConditions) {
      if (!c.conditionCode) issues.push(`Eligibility condition missing conditionCode`);
      if (c.field) {
        const dot = c.field.indexOf('.');
        if (dot <= 0 || dot >= c.field.length - 1) issues.push(`Eligibility ${c.conditionCode||'?'}: bad field format`);
        else {
          const prefix = c.field.substring(0, dot);
          if (!ENTITY_PREFIXES.includes(prefix)) issues.push(`Eligibility ${c.conditionCode||'?'}: invalid prefix '${prefix}'`);
        }
      }
      if (c.operator && !OPERATORS.includes(c.operator)) issues.push(`Eligibility ${c.conditionCode||'?'}: invalid operator '${c.operator}'`);
      if (c.sourceRefs) for (const r of c.sourceRefs) if (!srcCodes.has(r)) issues.push(`Eligibility ${c.conditionCode||'?'}: bad sourceRef '${r}'`);
    }
  }
  
  // Check requirements
  if (data.requirements) for (const r of data.requirements) {
    if (!r.requirementCode) issues.push(`Requirement missing requirementCode`);
    if (r.sourceRefs) for (const ref of r.sourceRefs) if (!srcCodes.has(ref)) issues.push(`Requirement ${r.requirementCode||'?'}: bad sourceRef '${ref}'`);
  }
  
  // Check process
  if (data.processInformation) for (const p of data.processInformation) {
    if (!p.processCode) issues.push(`Process missing processCode`);
    if (p.sourceRefs) for (const ref of p.sourceRefs) if (!srcCodes.has(ref)) issues.push(`Process ${p.processCode||'?'}: bad sourceRef '${ref}'`);
  }
  
  // Check fees
  if (data.fees) for (const f of data.fees) {
    if (!f.feeCode) issues.push(`Fee missing feeCode`);
  }
  
  // Check timeline
  if (data.processingTime && !data.processingTime.timelineCode) issues.push(`Missing timelineCode`);
  
  // Check output
  if (data.output && !data.output.outputCode) issues.push(`Missing outputCode`);
  
  if (issues.length > 0) {
    console.log(`\n${file}: ${issues.length} issues`);
    issues.forEach(i => console.log(`  - ${i}`));
    totalIssues += issues.length;
  } else {
    console.log(`OK: ${file}`);
  }
}
console.log(`\nTotal issues: ${totalIssues}`);
