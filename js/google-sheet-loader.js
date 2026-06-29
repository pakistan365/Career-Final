// ============================================================
// Career Pakistan — google-sheet-loader.js (v3 — final)
// FIXES: correct column names, both camelCase+snake_case aliases,
// isActive on notifications, _fireCMSReady()
// ============================================================
const SHEETS_BASE_URL='/api/sheets';
const CMS_API_URL='/api/cms';
const CMS_CACHE_KEY='careerpk.cms.v4';
const CMS_CACHE_MAX_AGE=6*60*60*1000; // Instant repeat visits; network refresh still runs.
const DIRECT_SHEET_URLS={
  Scholarships:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdaG_r04rwKR63qkpha0v-REFHkI2M7aXIGNQZf7zmduv8tvV1k4TRBlafEIKKgI8QbXuL6r3rTuMo/pub?output=csv',
  Jobs:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRfOHaqq2H2iBXWn90i11S0bfbPUa--m4Hrkvh34TC11KDTyZymdcTCryAnckRZ8MjeAUb7Bh1-6i4s/pub?output=csv',
  Internships:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrDPiwb4Ow0LwD2RJWpATk0b3Blrd_PR21vBn3IPes1EC6Uf9YqDucsF5jWwFrlVB_kA7oaca8uMCS/pub?output=csv',
  Exams:'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ISsMtV-TMyTQleaS7sxDXAkrGHgk-MobAwOgHry2PLpKaZDQSJbu3JtiaYEYMDQW3M7cFAJO6IPp/pub?output=csv',
  Books:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUvgf_xYBH5igPoaGKEWTvk9MxA_VJ7a8104rnB1GJz0ef-zpjy05CjF5_XSlOEDAXh_2CzQOqn9ww/pub?output=csv',
  Notifications:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlGJdIw3YLBDWCXA7xnDyruQXlsDzm8KJ1cEqrjjwy-0G4leIFOp2yQF6FMhbw9hBnbajs0qb-dsrB/pub?output=csv',
  Blogs:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRciVbiyyI9Kk7LS99tAB3fAYMmMebHCAAi4WdpzKwPLKh0xb57GHRr99sN1audsiOqP2Ix_kx3Ocmo/pub?output=csv',
  UniversityAdmissions: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIBOKbnGsd4GrOh18jOGUF26H2fwvGZxHYm_kKU2N5egPeMPKVWzx3P-3un5HqBXJxu_QNRMFlTnoz/pub?output=csv',
};

const SHEETS_CONFIG=[
  {name:'Books',        csvUrl:`${SHEETS_BASE_URL}?sheet=Books`,        fallbackUrl:DIRECT_SHEET_URLS.Books, mapper:mapBook},
  {name:'Notifications',csvUrl:`${SHEETS_BASE_URL}?sheet=Notifications`,fallbackUrl:DIRECT_SHEET_URLS.Notifications, mapper:mapNotification},
  {name:'Exams',        csvUrl:`${SHEETS_BASE_URL}?sheet=Exams`,        fallbackUrl:DIRECT_SHEET_URLS.Exams, mapper:mapExam},
  {name:'Scholarships', csvUrl:`${SHEETS_BASE_URL}?sheet=Scholarships`, fallbackUrl:DIRECT_SHEET_URLS.Scholarships, mapper:mapScholarship},
  {name:'Blogs',        csvUrl:`${SHEETS_BASE_URL}?sheet=Blogs`,        fallbackUrl:DIRECT_SHEET_URLS.Blogs, mapper:mapBlog},
  {name:'Internships',  csvUrl:`${SHEETS_BASE_URL}?sheet=Internships`,  fallbackUrl:DIRECT_SHEET_URLS.Internships, mapper:mapInternship},
  {name:'Jobs',         csvUrl:`${SHEETS_BASE_URL}?sheet=Jobs`,         fallbackUrl:DIRECT_SHEET_URLS.Jobs, mapper:mapJob},
  {name:'UniversityAdmissions', csvUrl:`${SHEETS_BASE_URL}?sheet=UniversityAdmissions`, fallbackUrl:DIRECT_SHEET_URLS.UniversityAdmissions, mapper:mapUniversityAdmission},
];
window.CMS_DATA=window.CMS_DATA||{};
window.CMS_LOADING=window.CMS_LOADING||{};

function _f(r,keys){for(const k of keys){const v=r[k];if(v!==undefined&&v!==null&&v!=='')return v;}return '';}
function _bool(v){if(!v)return false;const s=String(v).toLowerCase().trim();return s==='true'||s==='yes'||s==='1'||s==='y';}
function _num(v,fb=null){const n=Number(String(v??'').replace(/,/g,'').trim());return Number.isFinite(n)?n:fb;}
function _date(v){const r=String(v??'').trim();if(!r)return'';const d=new Date(r);return Number.isNaN(d.getTime())?r:d.toISOString();}
function _parseLinks(v){const s=String(v||'').trim();if(!s)return[];return s.split(/[\n;,]+/).map(l=>l.trim()).filter(l=>l);}

// BOOKS: ID,Title,Author,Exam Type,Price,Apply Link,Details,PDF Link,Image Link,Category,Language,Pages,Edition,Is Free,Tags,Short Description,Is Featured,Posted Date,Download Link
function mapBook(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),author:_f(r,['Author']),
    examType:_f(r,['Exam Type']),exam_type:_f(r,['Exam Type']),
    price:_f(r,['Price']),applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    category:_f(r,['Category']),language:_f(r,['Language']),
    pages:_num(_f(r,['Pages']),null),edition:_f(r,['Edition']),
    isFree:_bool(_f(r,['Is Free'])),is_free:_bool(_f(r,['Is Free'])),
    tags:_f(r,['Tags']),shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    downloadLink:_f(r,['Download Link']),download_link:_f(r,['Download Link']),
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image Link']))};
}

// NOTIFICATIONS: ID,Title,Category,Priority,Description,Image Links,PDF Links,External Links,Related Sheet,Related ID,Start Date,End Date,Is Active,Posted Date,Tags
function mapNotification(r){
  const pd=_date(_f(r,['Posted Date']));
  const sd=_date(_f(r,['Start Date']));
  const ed=_date(_f(r,['End Date']));
  return{
    id:_f(r,['ID'])||String(r.__rowIndex||''),
    title:_f(r,['Title']),
    message:_f(r,['Title']), // For backward compatibility
    category:_f(r,['Category'])||'Urgent',
    priority:(function(v){const s=String(v||'').trim().toLowerCase();const map={low:1,medium:3,med:3,high:4,urgent:5,critical:5};return map[s]!==undefined?map[s]:(_num(v,0)||0);}(_f(r,['Priority']))),
    description:_f(r,['Description']),
    details:_f(r,['Description']),
    imageLinks:_parseLinks(_f(r,['Image Links'])),
    image_links:_parseLinks(_f(r,['Image Links'])),
    pdfLinks:_parseLinks(_f(r,['PDF Links'])),
    pdf_links:_parseLinks(_f(r,['PDF Links'])),
    externalLinks:_parseLinks(_f(r,['External Links'])),
    external_links:_parseLinks(_f(r,['External Links'])),
    relatedSheet:_f(r,['Related Sheet']),
    related_sheet:_f(r,['Related Sheet']),
    relatedId:_f(r,['Related ID']),
    related_id:_f(r,['Related ID']),
    startDate:sd,start_date:sd,
    endDate:ed,end_date:ed,
    link:_f(r,['External Links'])?_parseLinks(_f(r,['External Links']))[0]:'', // For backward compatibility
    isActive:_bool(_f(r,['Is Active'])),
    is_active:_bool(_f(r,['Is Active'])),
    postedDate:pd,posted_date:pd,
    tags:_f(r,['Tags'])
  };
}

// EXAMS: ID,Title,Exam Type,Test Date,Registration Deadline,Apply Link,Details,PDF Link,Image Link,Conducting Body,Fee,Eligibility,Syllabus Link,Past Papers Link,Tags,Province,Short Description,Is Featured,Posted Date
function mapExam(r){
  const pd=_date(_f(r,['Posted Date']));
  const td=_f(r,['Test Date']);
  const rd=_f(r,['Registration Deadline']);
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    examType:_f(r,['Exam Type']),exam_type:_f(r,['Exam Type']),
    testDate:td,test_date:td,
    registrationDeadline:rd,registration_deadline:rd,deadline:rd,
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    conductingBody:_f(r,['Conducting Body']),conducting_body:_f(r,['Conducting Body']),
    fee:_f(r,['Fee']),eligibility:_f(r,['Eligibility']),
    syllabusLink:_f(r,['Syllabus Link']),syllabus_link:_f(r,['Syllabus Link']),
    pastPapersLink:_f(r,['Past Papers Link']),past_papers_link:_f(r,['Past Papers Link']),
    tags:_f(r,['Tags']),province:_f(r,['Province']),
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image Link']))};
}

// SCHOLARSHIPS: ID,Title,Country,Funding,Deadline,Eligibility,Apply Link,Details,PDF Link,Image Link,Type,Level,Field,University,Tags,Is Featured,Posted Date,Short Description,Province
function mapScholarship(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    country:_f(r,['Country']),funding:_f(r,['Funding']),
    deadline:_date(_f(r,['Deadline'])),
    eligibility:_f(r,['Eligibility']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    type:_f(r,['Type']),level:_f(r,['Level']),field:_f(r,['Field']),
    university:_f(r,['University']),tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    province:_f(r,['Province']),
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image Link']))};
}

// BLOGS: ID,Title,Category,Description,Short Description,Image URL,Author,Date,Tags,Featured,Apply Link,PDF Link,Related Jobs Tags,Related Exams Tags,Read Time,Is Published
function mapBlog(r){
  const pd=_date(_f(r,['Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    category:_f(r,['Category']),
    description:_f(r,['Description']),details:_f(r,['Description']),
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    imageUrl:_f(r,['Image URL']),image_url:_f(r,['Image URL']),
    author:_f(r,['Author']),date:pd,postedDate:pd,posted_date:pd,
    tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Featured'])),is_featured:_bool(_f(r,['Featured'])),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    relatedJobsTags:_f(r,['Related Jobs Tags']),related_jobs_tags:_f(r,['Related Jobs Tags']),
    relatedExamsTags:_f(r,['Related Exams Tags']),related_exams_tags:_f(r,['Related Exams Tags']),
    readTime:_f(r,['Read Time']),read_time:_f(r,['Read Time']),
    isPublished:_bool(_f(r,['Is Published'])),is_published:_bool(_f(r,['Is Published'])),
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image URL']))};
}

// INTERNSHIPS: ID,Title,Organization,Location,Stipend,Duration,Apply Link,Details,PDF Link,Image Link,Deadline,Type,Category,Tags,Is Featured,Posted Date,Short Description,Education Level
function mapInternship(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    organization:_f(r,['Organization']),location:_f(r,['Location']),
    stipend:_f(r,['Stipend']),duration:_f(r,['Duration']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    deadline:_date(_f(r,['Deadline'])),
    type:_f(r,['Type']),category:_f(r,['Category']),tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    educationLevel:_f(r,['Education Level']),education_level:_f(r,['Education Level']),
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image Link']))};
}

// JOBS: ID,Title,Type,Location,Salary,Organization,Apply Link,Details,PDF Link,Image Link,Deadline,Category,Province,Experience,Education,Tags,Is Featured,Posted Date,Short Description
function mapJob(r){
  const pd=_date(_f(r,['Posted Date']));
  return{id:_f(r,['ID'])||String(r.__rowIndex||''),title:_f(r,['Title']),
    type:_f(r,['Type']),location:_f(r,['Location']),
    salary:_f(r,['Salary']),organization:_f(r,['Organization']),
    applyLink:_f(r,['Apply Link']),apply_link:_f(r,['Apply Link']),
    details:_f(r,['Details']),description:_f(r,['Details']),
    pdfLink:_f(r,['PDF Link']),pdf_link:_f(r,['PDF Link']),
    imageUrl:_f(r,['Image Link']),image_url:_f(r,['Image Link']),
    sourceLink:_f(r,['Source Link']),source_link:_f(r,['Source Link']),
    deadline:_date(_f(r,['Deadline'])),
    category:_f(r,['Category']),province:_f(r,['Province']),
    experience:_f(r,['Experience']),education:_f(r,['Education']),
    tags:_f(r,['Tags']),
    isFeatured:_bool(_f(r,['Is Featured'])),is_featured:_bool(_f(r,['Is Featured'])),
    postedDate:pd,posted_date:pd,
    shortDescription:_f(r,['Short Description']),short_description:_f(r,['Short Description']),
    pdfLinks:_parseLinks(_f(r,['PDF Link'])),
    imageLinks:_parseLinks(_f(r,['Image Link']))};
}

// UNIVERSITY ADMISSIONS: ID,University Name,Short Name,Program(s) Offered,Degree Level,
// Admission Open Date,Last Date to Apply,Entry Test Required,Entry Test Name,Entry Test Date,
// Minimum Marks Required,Minimum Percentage,Eligible Boards,Apply Link,Merit List URL,
// Prospectus Link,Fee (Approximate),Location / City,Province,University Type,
// Category / Faculty,Seats Available,Hostel Available,Scholarships Available,
// Image Link,Short Description,Full Details,Tags,Is Featured,Is Active,Posted Date
function mapUniversityAdmission(r) {
  const pd = _date(_f(r, ['Posted Date']));
  const deadline = _f(r, ['Last Date to Apply']);
  return {
    id:                   _f(r, ['ID']) || String(r.__rowIndex || ''),
    title:                _f(r, ['University Name']),
    universityName:       _f(r, ['University Name']),
    shortName:            _f(r, ['Short Name']),
    programs:             _f(r, ['Program(s) Offered']),
    degreeLevel:          _f(r, ['Degree Level']),
    admissionOpenDate:    _f(r, ['Admission Open Date']),
    deadline:             deadline ? _date(deadline) : '',
    lastDateToApply:      deadline ? _date(deadline) : '',
    entryTestRequired:    _bool(_f(r, ['Entry Test Required'])),
    entryTestName:        _f(r, ['Entry Test Name']),
    entryTestDate:        _f(r, ['Entry Test Date']),
    minimumMarks:         _f(r, ['Minimum Marks Required']),
    minimumPercentage:    _num(_f(r, ['Minimum Percentage']), null),
    eligibleBoards:       _f(r, ['Eligible Boards']),
    applyLink:            _f(r, ['Apply Link']),
    apply_link:           _f(r, ['Apply Link']),
    meritListUrl:         _f(r, ['Merit List URL']),
    merit_list_url:       _f(r, ['Merit List URL']),
    prospectusLink:       _f(r, ['Prospectus Link']),
    pdfLink:              _f(r, ['Prospectus Link']),
    pdf_link:             _f(r, ['Prospectus Link']),
    fee:                  _f(r, ['Fee (Approximate)']),
    city:                 _f(r, ['Location / City']),
    location:             _f(r, ['Location / City']),
    province:             _f(r, ['Province']),
    universityType:       _f(r, ['University Type']),
    category:             _f(r, ['Category / Faculty']),
    seatsAvailable:       _num(_f(r, ['Seats Available']), null),
    hostelAvailable:      _bool(_f(r, ['Hostel Available'])),
    scholarshipsAvailable:_bool(_f(r, ['Scholarships Available'])),
    imageUrl:             _f(r, ['Image Link']),
    image_url:            _f(r, ['Image Link']),
    shortDescription:     _f(r, ['Short Description']),
    short_description:    _f(r, ['Short Description']),
    details:              _f(r, ['Full Details']),
    description:          _f(r, ['Full Details']),
    tags:                 _f(r, ['Tags']),
    isFeatured:           _bool(_f(r, ['Is Featured'])),
    is_featured:          _bool(_f(r, ['Is Featured'])),
    isActive:             _bool(_f(r, ['Is Active'])),
    is_active:            _bool(_f(r, ['Is Active'])),
    postedDate:           pd,
    posted_date:          pd,
    pdfLinks:             _parseLinks(_f(r, ['Prospectus Link'])),
    imageLinks:           _parseLinks(_f(r, ['Image Link'])),
  };
}

function _parseCSV(text){
  const rows=[];let row=[],field='',inQ=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(inQ){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"'){inQ=false;}else{field+=ch;}}
    else{if(ch==='"'){inQ=true;}else if(ch===','){row.push(field.trim());field='';}
    else if(ch==='\r'){/*skip*/}else if(ch==='\n'){row.push(field.trim());field='';
    if(row.some(c=>c!==''))rows.push(row);row=[];}else{field+=ch;}}}
  if(field||row.length){row.push(field.trim());if(row.some(c=>c!==''))rows.push(row);}
  if(!rows.length)return[];
  const headers=rows[0].map(h=>String(h||'').trim());
  return rows.slice(1).map((r,idx)=>{const obj={__rowIndex:idx+2};headers.forEach((h,i)=>{obj[h]=r[i]??'';});return obj;});
}

function _normalize(item){
  const o={...item};
  if(!o.id)o.id=String(Math.random()).slice(2);
  o.title=o.title||o.message||'';
  o.details=o.details||o.description||'';
  o.tags=o.tags||'';
  if(!Array.isArray(o.pdfLinks))o.pdfLinks=o.pdfLinks?[o.pdfLinks]:[];
  if(!Array.isArray(o.imageLinks))o.imageLinks=o.imageLinks?[o.imageLinks]:[];
  if(!Array.isArray(o.mediaLinks))o.mediaLinks=[];
  return o;
}

function _dedupe(arr){
  const s=new Set();
  return arr.filter(it=>{const k=`${it.id}::${(it.title||'').toLowerCase()}`;if(s.has(k))return false;s.add(k);return true;});
}

async function _readCsv(url,cfg){
  const res=await fetch(url,{cache:'force-cache',credentials:'same-origin'});
  if(!res.ok)throw new Error(`${cfg.name}: HTTP ${res.status}`);
  const text=await res.text();
  const trimmed=text.trim();
  if(!trimmed)return'';
  if(trimmed.startsWith('{')&&trimmed.includes('error')){
    try{const payload=JSON.parse(trimmed);throw new Error(payload.error||`${cfg.name}: API error`);}
    catch(e){throw new Error(e.message||`${cfg.name}: API error`);}
  }
  if(trimmed.startsWith('<!')||trimmed.includes('Host not in allowlist'))throw new Error(`${cfg.name}: non-CSV response`);
  return text;
}

function _aliasCmsItem(item){
  const o=_normalize(item||{});
  o.applyLink=o.applyLink||o.apply_link||o.registration_link||o.download_link||'';
  o.apply_link=o.apply_link||o.applyLink;
  o.pdfLink=o.pdfLink||o.pdf_link||'';
  o.pdf_link=o.pdf_link||o.pdfLink;
  o.imageUrl=o.imageUrl||o.image_url||'';
  o.image_url=o.image_url||o.imageUrl;
  o.shortDescription=o.shortDescription||o.short_description||o.summary||'';
  o.short_description=o.short_description||o.shortDescription;
  o.postedDate=o.postedDate||o.posted_date||o.date||'';
  o.posted_date=o.posted_date||o.postedDate;
  o.isFeatured=Boolean(o.isFeatured||o.is_featured);
  o.is_featured=Boolean(o.is_featured||o.isFeatured);
  o.isFree=Boolean(o.isFree||o.is_free);
  o.is_free=Boolean(o.is_free||o.isFree);
  o.examType=o.examType||o.exam_type||'';
  o.exam_type=o.exam_type||o.examType;
  o.registrationDeadline=o.registrationDeadline||o.registration_deadline||o.deadline||'';
  o.registration_deadline=o.registration_deadline||o.registrationDeadline;
  o.testDate=o.testDate||o.test_date||'';
  o.test_date=o.test_date||o.testDate;
  o.conductingBody=o.conductingBody||o.conducting_body||'';
  o.conducting_body=o.conducting_body||o.conductingBody;
  o.educationLevel=o.educationLevel||o.education_level||'';
  o.education_level=o.education_level||o.educationLevel;
  o.downloadLink=o.downloadLink||o.download_link||'';
  o.download_link=o.download_link||o.downloadLink;
  o.readTime=o.readTime||o.read_time||'';
  o.read_time=o.read_time||o.readTime;
  if(o.is_active!==undefined)o.isActive=Boolean(o.isActive||o.is_active);
  if(o.is_published!==undefined)o.isPublished=Boolean(o.isPublished||o.is_published);
  if(o.isPublished!==undefined)o.is_published=Boolean(o.is_published||o.isPublished);
  if(!o.pdfLinks.length&&o.pdfLink)o.pdfLinks=[o.pdfLink];
  if(!o.imageLinks.length&&o.imageUrl)o.imageLinks=[o.imageUrl];
  o.universityName   = o.universityName   || '';
  o.shortName        = o.shortName        || '';
  o.programs         = o.programs         || '';
  o.degreeLevel      = o.degreeLevel      || '';
  o.entryTestRequired= Boolean(o.entryTestRequired);
  o.entryTestName    = o.entryTestName    || '';
  o.minimumPercentage= o.minimumPercentage!== null ? o.minimumPercentage : null;
  o.city             = o.city             || o.location || '';
  o.meritListUrl     = o.meritListUrl     || o.merit_list_url || '';
  o.merit_list_url   = o.merit_list_url   || o.meritListUrl || '';
  o.universityType   = o.universityType   || '';
  o.hostelAvailable  = Boolean(o.hostelAvailable);
  o.scholarshipsAvailable = Boolean(o.scholarshipsAvailable);
  return o;
}

function _setSheetData(name,data){
  const rows=_dedupe((Array.isArray(data)?data:[]).map(_aliasCmsItem));
  window.CMS_DATA[name]=rows;
  window.CMS_DATA[name.toLowerCase()]=rows;
  return rows;
}

function _snapshot(){
  const snap={};
  SHEETS_CONFIG.forEach(cfg=>{snap[cfg.name]=window.CMS_DATA[cfg.name]||[];});
  return snap;
}

function _changedTabs(before){
  return SHEETS_CONFIG.map(cfg=>cfg.name).filter(name=>JSON.stringify(before[name]||[])!==JSON.stringify(window.CMS_DATA[name]||[]));
}

function _readLocalCache(){
  try{
    const raw=localStorage.getItem(CMS_CACHE_KEY);
    if(!raw)return null;
    const cached=JSON.parse(raw);
    if(!cached||!cached.tabs||Date.now()-(cached.savedAt||0)>CMS_CACHE_MAX_AGE)return null;
    return cached.tabs;
  }catch(e){return null;}
}

function _writeLocalCache(){
  try{localStorage.setItem(CMS_CACHE_KEY,JSON.stringify({savedAt:Date.now(),tabs:_snapshot()}));}
  catch(e){/* storage quota/private mode - ignore */}
}

function _applyTabs(tabs){
  SHEETS_CONFIG.forEach(cfg=>_setSheetData(cfg.name,tabs&&tabs[cfg.name]));
}

async function _loadFromCmsApi(){
  const res=await fetch(CMS_API_URL,{cache:'force-cache',credentials:'same-origin'});
  if(!res.ok)throw new Error(`CMS API HTTP ${res.status}`);
  const payload=await res.json();
  if(!payload||!payload.tabs)throw new Error('CMS API returned no tabs');
  _applyTabs(payload.tabs);
  _writeLocalCache();
}

async function loadOneSheet(cfg){
  try{
    const text=await _readCsv(cfg.csvUrl,cfg);
    if(!text.trim())return[];
    return _dedupe(_parseCSV(text).map(cfg.mapper).map(_normalize));
  }catch(primaryErr){
    if(!cfg.fallbackUrl)throw primaryErr;
    console.warn(`[CMS] Proxy failed for ${cfg.name}; trying direct sheet URL.`,primaryErr?.message||primaryErr);
    const text=await _readCsv(`${cfg.fallbackUrl}&_t=${Date.now()}`,cfg);
    if(!text.trim())return[];
    return _dedupe(_parseCSV(text).map(cfg.mapper).map(_normalize));
  }
}

async function _loadFromCsvFallback(){
  const results=await Promise.allSettled(SHEETS_CONFIG.map(loadOneSheet));
  results.forEach((r,i)=>{
    const cfg=SHEETS_CONFIG[i];
    const data=r.status==='fulfilled'?r.value:[];
    if(r.status==='rejected')console.warn(`[CMS] Failed ${cfg.name}:`,r.reason?.message||r.reason);
    _setSheetData(cfg.name,data);
  });
  _writeLocalCache();
}

async function loadAllSheets(){
  if(window.CMS_LOADING.global)return window.CMS_LOADING.globalPromise||Promise.resolve(window.CMS_DATA);
  window.CMS_LOADING.global=true;

  const cachedTabs=_readLocalCache();
  if(cachedTabs){
    _applyTabs(cachedTabs);
    if(typeof window._fireCMSReady==='function')window._fireCMSReady();
  }

  const before=_snapshot();
  window.CMS_LOADING.globalPromise=(async()=>{
    try{
      try{await _loadFromCmsApi();}
      catch(apiErr){
        console.warn('[CMS] Aggregated API failed; falling back to per-sheet CSV.',apiErr?.message||apiErr);
        await _loadFromCsvFallback();
      }
      if(typeof window._fireCMSReady==='function')window._fireCMSReady();
      const changed=_changedTabs(before);
      if(cachedTabs&&changed.length&&typeof window._fireCMSRefresh==='function')window._fireCMSRefresh(changed);
      return window.CMS_DATA;
    }catch(err){
      console.warn('[CMS] Load failed:',err?.message||err);
      if (!document._cmsErrorShown) {
        document._cmsErrorShown = true;
        const _toast = document.createElement('div');
        _toast.setAttribute('role', 'alert');
        _toast.setAttribute('aria-live', 'assertive');
        _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:.65rem 1.4rem;border-radius:12px;font-size:.84rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);white-space:nowrap';
        _toast.textContent = '⚠️ Could not load data. Showing cached content.';
        document.body.appendChild(_toast);
        setTimeout(() => _toast.remove(), 7000);
      }
      document.dispatchEvent(new CustomEvent('cmsLoadFailed',{detail:err}));
      if(typeof window._fireCMSReady==='function')window._fireCMSReady();
      return window.CMS_DATA;
    }finally{
      window.CMS_LOADING.global=false;
      window.CMS_LOADING.globalPromise=null;
    }
  })();
  return window.CMS_LOADING.globalPromise;
}

window.loadAllSheets=loadAllSheets;
window.onCMSReady=window.onCMSReady||function(fn){
  if(typeof fn!=='function')return;
  loadAllSheets().then(()=>fn(window.CMS_DATA)).catch(()=>fn(window.CMS_DATA));
};
loadAllSheets();
