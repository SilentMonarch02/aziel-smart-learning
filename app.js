(function(){
var CFG=window.AZ_CONFIG||{},sb=null;
try{if(CFG.url&&CFG.key&&window.supabase)sb=window.supabase.createClient(CFG.url,CFG.key)}catch(e){}
var $=function(i){return document.getElementById(i)};
function esc(x){return String(x==null?"":x).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function okU(u){return/^https:\/\//.test(u||"")}
var SUBJ=["Mathematics","English","Kiswahili","Biology","Chemistry","Physics","Computer Studies","French","Home Science","Building & Construction"],LV=["Form 3","Form 4","Grade 10","Grade 11"];
var LBL={web_admin:"Web administrator",school_admin:"School admin",teacher:"Teacher",student:"Student"};
var STU=[],PAY=[],ATT=[],REG=[],MYS=null,ME=null,SET={site_enabled:true,message:""},POSTS=[],RES=[],VL=[];
function opts(a){return a.map(function(s){return"<option>"+esc(s)+"</option>"}).join("")}
function fl(l,x){return"<label>"+l+"</label>"+x}
function fd(s){return new Date(s).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}
function wa(s,b){window.open("https://wa.me/254728646984?text="+encodeURIComponent(s+"\n\n"+b),"_blank","noopener")}
function room(){return"https://meet.jit.si/AzielSmart-"+crypto.randomUUID().slice(0,8)}
function att(u){if(!okU(u))return"";return/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u)?'<img src="'+esc(u)+'" alt="" style="max-width:100%;border-radius:10px;margin-top:8px">':'<p><a href="'+esc(u)+'" target="_blank" rel="noopener">Open attachment →</a></p>'}
function rm(a){return'<button class="btn alt" '+a+' type="button" style="color:var(--pri);padding:4px 12px">Remove</button>'}
function cd(t,x,id,l,x2){return'<div class="card"><h3>'+t+'</h3>'+x+'<div class="row"><button class="btn" id="'+id+'" type="button">'+l+'</button>'+(x2||"")+'</div></div>'}

function today(){return new Date().toLocaleDateString("en-CA")}
function dd(d,n){var x=new Date(d+"T00:00:00");x.setDate(x.getDate()+n);return x.toLocaleDateString("en-CA")}
function due(s){return dd(s.last_paid_on||s.joined_on,14)}
function blocked(s){return today()>due(s)}
function stat(s){return blocked(s)?"Blocked – unpaid":s.last_paid_on?"Paid":"Joined – awaiting payment"}
function cnt(id,st){return ATT.filter(function(a){return a.student_id===id&&a.status===st}).length}
function lock(){if(ME&&ME.role&&ME.role!=="student")return"";if(!ME)return"Students: sign in to see your lessons.";if(MYS&&blocked(MYS))return"Your lessons are paused because no payment was received in the last 14 days. Sign in and tap Pay now to pay with M-Pesa. Your lessons open automatically once the payment is received.";return""}
var ROW=' class="item" style="padding:6px 0;border-bottom:1px solid var(--line)"';
["ns","vs"].forEach(function(i){$(i).innerHTML=opts(["All subjects"].concat(SUBJ))});

/* ---------- public pages ---------- */
function rNews(){var L=POSTS.filter(function(p){return p.type!=="timetable"});
$("annList").innerHTML=L.length?L.map(function(p){return'<div class="card"><span class="tag">'+esc(p.type)+' · '+fd(p.created_at)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p>'+att(p.file_url)+'</div>'}).join(""):'<p class="note">No announcements yet.</p>'}
function rLive(){var C=RES.filter(function(r){return r.kind==="class"}),T=POSTS.filter(function(p){return p.type==="timetable"});
$("schedList").innerHTML=C.length?C.map(function(c){return'<div class="card"><span class="tag live">● ONLINE CLASS</span><h3>'+esc(c.title)+'</h3><div class="meta">'+esc(c.subject)+' · '+esc(c.level)+(c.teacher?' · '+esc(c.teacher):'')+'</div><p><b>'+esc(c.when_text)+'</b></p>'+(okU(c.url)?'<a class="btn" href="'+esc(c.url)+'" target="_blank" rel="noopener">Join Class</a>':"")+'</div>'}).join(""):'<p class="note">'+(lock()||"No online classes scheduled yet.")+'</p>';
$("liveList").innerHTML=T.length?T.map(function(p){return'<div class="card"><span class="tag">Posted '+fd(p.created_at)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p>'+att(p.file_url)+'</div>'}).join(""):'<p class="note">The timetable has not been posted yet.</p>'}
function rNotes(){var q=$("nq").value.toLowerCase(),s=$("ns").value;
var L=RES.filter(function(r){return r.kind==="note"&&(s==="All subjects"||r.subject===s)&&r.title.toLowerCase().indexOf(q)>-1});
$("noteList").innerHTML=L.length?L.map(function(n){return'<div class="card item"><div><span class="tag">'+esc(n.subject)+'</span><h3>'+esc(n.title)+'</h3><div class="meta">'+fd(n.created_at)+'</div></div>'+(okU(n.url)?'<a class="btn" href="'+esc(n.url)+'" target="_blank" rel="noopener">Download</a>':"")+'</div>'}).join(""):'<p class="note">'+(lock()||"No notes yet.")+'</p>'}
function rVids(){var s=$("vs").value;VL=RES.filter(function(r){return r.kind==="video"&&(s==="All subjects"||r.subject===s)});
$("vidList").innerHTML=VL.length?VL.map(function(v,i){return'<div class="card"><div class="thumb" data-v="'+i+'">▶</div><span class="tag">'+esc(v.subject)+'</span><h3>'+esc(v.title)+'</h3></div>'}).join(""):'<p class="note">'+(lock()||"No videos yet.")+'</p>'}
$("nq").oninput=rNotes;$("ns").onchange=rNotes;$("vs").onchange=rVids;
$("vidList").onclick=function(e){var t=e.target.closest("[data-v]");if(!t)return;var v=VL[t.getAttribute("data-v")];if(!okU(v.url))return;
if(v.url.indexOf("/storage/v1/object/public/files/")>-1){$("dt").textContent=v.title;$("dv").innerHTML='<video controls autoplay playsinline src="'+esc(v.url)+'"></video>';$("dlg").showModal()}else window.open(v.url,"_blank","noopener")};
function closeD(){$("dv").innerHTML="";$("dlg").close()}
$("dx").onclick=closeD;$("dlg").addEventListener("click",function(e){if(e.target===$("dlg"))closeD()});

/* ---------- admissions, fees, contact (WhatsApp) ---------- */
var V=function(i){return $(i).value.trim()};
var SERV=["High school students","Adult learning","Reproductive health","Mental health care and substance abuse","Goal setting","Self awareness and skills","Academic motivation","Professional short courses"];
$("rsv").innerHTML=SERV.map(function(s){return'<label style="font-weight:400"><input type="checkbox" data-sv="'+esc(s)+'" style="width:auto"> '+esc(s)+"</label>"}).join("");
$("svcGrid").innerHTML=SERV.map(function(s){return'<div class="card"><h3 style="font-size:17px;margin:0">'+esc(s)+"</h3></div>"}).join("");
$("rsend").onclick=async function(){var sv=[].filter.call($("rsv").querySelectorAll("[data-sv]"),function(c){return c.checked}).map(function(c){return c.getAttribute("data-sv")});
if(!V("rn")||!V("rph")||!sv.length){$("rmsg").textContent="Please enter your name, phone and choose at least one service.";return}
var hs=sv.indexOf("High school students")>-1,msg="Registration\nName: "+V("rn")+"\nPhone: "+V("rph")+"\nEmail: "+V("re")+"\nDOB: "+V("rd")+"\nGender: "+V("rg")+"\nServices: "+sv.join(", ")+(hs?"\nClass: "+V("rc"):"")+"\nGuardian: "+V("rp")+"\nNotes: "+V("rs");
if(!sb){wa("Registration – "+V("rn"),msg);$("rmsg").textContent="WhatsApp has opened. Press Send to complete your registration.";return}
$("rmsg").textContent="Sending…";
var r=await sb.from("registrations").insert({full_name:V("rn"),phone:V("rph"),email:V("re")||null,date_of_birth:V("rd")||null,gender:V("rg"),services:sv,level:hs?V("rc"):null,guardian:V("rp")||null,notes:V("rs")||null});
if(r.error){$("rmsg").textContent="Could not register: "+r.error.message;return}
$("rmsg").innerHTML='<span class="ok">Thank you, '+esc(V("rn"))+'. You are registered.</span> Please pay the Ksh 200 registration fee via M-Pesa Paybill 400200, account 40722, then <a href="https://wa.me/254728646984?text='+encodeURIComponent("Registration fee paid. Name: "+V("rn")+". M-Pesa code: ")+'" target="_blank" rel="noopener">send us the M-Pesa code on WhatsApp</a>.'};
$("fsend").onclick=function(){if(!V("fa")||!V("fm")||!V("fc"))return alert("Please fill in all three fields.");wa("Fee payment notice - "+V("fa"),"Student: "+V("fa")+"\nAmount: KES "+V("fm")+"\nCode: "+V("fc"))};
$("send").onclick=function(){wa("Enquiry – Aziel Smart Learning","Name: "+$("cn").value+"\nContact: "+$("ce").value+"\n\n"+$("cm").value)};

/* ---------- staff area ---------- */
async function up(id){var f=$(id).files[0];if(!f)return"";var n=Date.now()+"-"+f.name.replace(/[^\w.\-]+/g,"_");var r=await sb.storage.from("files").upload(n,f);if(r.error)throw r.error;return sb.storage.from("files").getPublicUrl(n).data.publicUrl}
async function ins(t,row){var r=await sb.from(t).insert(row);if(r.error)throw r.error}
async function del(t,c,v){var r=await sb.from(t).delete().eq(c,v).select();if(r.error)throw r.error;if(!r.data.length)throw new Error("You are not allowed to remove this.")}
function loadStaff(){Promise.all([sb.from("profiles").select("*").order("created_at"),sb.from("staff_invites").select("*")]).then(function(a){var web=ME.role==="web_admin",h="<h3>Current staff</h3>";
(a[0].data||[]).filter(function(p){return p.role!=="student"}).forEach(function(p){h+="<div"+ROW+"><span>"+esc(p.email)+' <span class="tag">'+LBL[p.role]+"</span></span>"+((web||p.role==="teacher")&&p.id!==ME.id?rm('data-sp="'+esc(p.id)+'"'):"")+"</div>"});
var iv=a[1].data||[];if(iv.length){h+="<h3>Waiting to create an account</h3>";iv.forEach(function(x){h+="<div"+ROW+"><span>"+esc(x.email)+' <span class="tag">'+LBL[x.role]+"</span></span>"+(web||x.role==="teacher"?rm('data-si="'+esc(x.email)+'"'):"")+"</div>"})}
var e=$("stfl");if(e)e.innerHTML=h})}
function rStaff(){var b=$("stbody");
if(!sb){b.innerHTML='<div class="card"><p>The staff system is not connected yet. Follow README.md to connect the backend.</p></div>';return}
if(!ME){b.innerHTML='<div class="card" style="max-width:400px"><h3>Staff sign in</h3>'+fl("Email",'<input id="se" type="email">')+fl("Password",'<input id="sp" type="password">')+'<div class="row"><button class="btn" id="sin" type="button">Sign in</button><button class="btn alt" id="sup" type="button" style="color:var(--pri)">Create account</button></div><p class="meta" id="sm"></p><p class="meta">First time? The administrator must add your email first, then use Create account with that email.</p></div>';
var go=async function(u){var e=$("se").value.trim().toLowerCase(),p=$("sp").value;if(!e||p.length<6){$("sm").textContent="Enter your email and a password of 6+ characters.";return}
var r=u?await sb.auth.signUp({email:e,password:p}):await sb.auth.signInWithPassword({email:e,password:p});if(r.error){$("sm").textContent=r.error.message;return}
if(!r.data.session){$("sm").textContent="Check your email to confirm your account, then sign in.";return}await boot()};
$("sin").onclick=function(){go(false)};$("sup").onclick=function(){go(true)};return}
var out='<button class="btn alt" id="sout" type="button" style="color:var(--pri)">Sign out</button>';
var so=function(){$("sout").onclick=async function(){await sb.auth.signOut();ME=null;await boot()}};
if(ME.role==="student"){rStudent();return}
if(!ME.role){b.innerHTML='<div class="card"><h3>No staff access</h3><p>'+esc(ME.email)+' has not been added as staff. Ask the administrator to add this email, then sign out and sign in again.</p>'+out+'</div>';so();return}
var R=ME.role,adm=R!=="teacher",web=R==="web_admin";
var rl=(web?["teacher","school_admin","web_admin"]:["teacher"]).map(function(r){return'<option value="'+r+'">'+LBL[r]+"</option>"}).join("");
var h='<div class="card item"><div><h3>'+esc(ME.email)+'</h3><span class="tag">'+LBL[R]+"</span></div>"+out+'</div><p class="meta" id="stmsg"></p><div class="grid" style="margin-top:12px">'
+cd("Upload notes",fl("Subject",'<select id="ns2">'+opts(SUBJ)+"</select>")+fl("Title",'<input id="nt">')+fl("File",'<input id="nf" type="file">')+fl("or link",'<input id="nl" placeholder="https://">'),"nb","Add note")
+cd("Add a video",fl("Subject",'<select id="vs2">'+opts(SUBJ)+"</select>")+fl("Title",'<input id="vt">')+fl("Video file",'<input id="vf" type="file" accept="video/*">')+fl("or link (YouTube, Drive…)",'<input id="vl" placeholder="https://">'),"vb","Add video")
+cd("Host an online class",fl("Subject",'<select id="cs">'+opts(SUBJ)+"</select>")+fl("Level",'<select id="clv">'+opts(LV)+"</select>")+fl("Topic",'<input id="ct">')+fl("When",'<input id="cd" placeholder="e.g. Mon 10 Nov, 4:00 PM">')+fl("Teacher",'<input id="cw">')+fl("Meeting link (optional)",'<input id="cl" placeholder="Empty = free Jitsi room">'),"cb","Schedule class",'<button class="btn alt" id="ci" type="button" style="color:var(--pri)">Start instant class</button>');
if(adm)h+=cd("Post to the website",fl("Type",'<select id="pt"><option value="announcement">Announcement</option><option value="event">Event</option><option value="timetable">Timetable</option><option value="other">Other</option></select>')+fl("Title",'<input id="ptl">')+fl("Message",'<textarea id="pb2" rows="4"></textarea>')+fl("Attachment (image or PDF)",'<input id="pf" type="file">'),"pb","Publish");
h+="</div>";
if(adm)h+='<div class="card" style="margin-top:16px"><h3>Staff</h3><div class="two">'+fl("Email",'<input id="ie" type="email">')+fl("Role",'<select id="ir">'+rl+"</select>")+'</div><div class="row"><button class="btn" id="ib" type="button">Add staff</button></div><p class="meta">They then open the Staff page and use Create account with this email.</p><div id="stfl"></div></div>';
if(web)h+=cd("Website status",'<p>Status: <b>'+(SET.site_enabled?"ONLINE":"OFF for visitors")+"</b></p>"+fl("Message shown while off",'<textarea id="sm2" rows="2">'+esc(SET.message)+"</textarea>"),"stg",SET.site_enabled?"Turn site OFF":"Turn site ON").replace('<div class="card">','<div class="card" style="margin-top:16px">');
var M=POSTS.map(function(x){return["posts",x]}).concat(RES.map(function(x){return["resources",x]})).filter(function(m){return adm||(m[0]==="resources"&&m[1].created_by===ME.id)});
h+='<div class="card" style="margin-top:16px"><h3>Manage content</h3>'+(M.map(function(m){return"<div"+ROW+"><span>"+esc(m[1].title)+' <span class="meta">· '+esc(m[1].type||m[1].kind)+"</span></span>"+rm('data-del="'+m[0]+":"+m[1].id+'"')+"</div>"}).join("")||'<p class="meta">Nothing yet.</p>')+"</div>";
h+=recordsHtml(adm);b.innerHTML=h;so();
var run=async function(fn){$("stmsg").textContent="Working…";try{await fn();await boot();var m=$("stmsg");if(m)m.textContent="Done ✓"}catch(e){$("stmsg").textContent=(e&&e.message)||"Something went wrong."}};
bindRecords(adm,run);
var link=async function(li,fi){var l=V(li);if(l){if(!okU(l))throw new Error("Link must start with https://");return l}var u=await up(fi);if(!u)throw new Error("Choose a file or paste a link.");return u};
$("nb").onclick=function(){run(async function(){if(!V("nt"))throw new Error("Add a title.");await ins("resources",{kind:"note",subject:V("ns2"),title:V("nt"),url:await link("nl","nf")})})};
$("vb").onclick=function(){run(async function(){if(!V("vt"))throw new Error("Add a title.");await ins("resources",{kind:"video",subject:V("vs2"),title:V("vt"),url:await link("vl","vf")})})};
$("cb").onclick=function(){run(async function(){if(!V("ct")||!V("cd"))throw new Error("Add a topic and a time.");var l=V("cl");if(l&&!okU(l))throw new Error("Link must start with https://");await ins("resources",{kind:"class",subject:V("cs"),level:V("clv"),title:V("ct"),when_text:V("cd"),teacher:V("cw"),url:l||room()})})};
$("ci").onclick=function(){window.open(room(),"_blank","noopener")};
if(adm){$("pb").onclick=function(){run(async function(){if(!V("ptl"))throw new Error("Add a title.");var f=await up("pf");await ins("posts",{type:V("pt"),title:V("ptl"),body:$("pb2").value.trim(),file_url:f||null})})};
$("ib").onclick=function(){run(async function(){var e=V("ie").toLowerCase();if(!/^\S+@\S+\.\S+$/.test(e))throw new Error("Enter a valid email.");await ins("staff_invites",{email:e,role:V("ir")})})};loadStaff()}
if(web)$("stg").onclick=function(){run(async function(){var r=await sb.from("site_settings").update({site_enabled:!SET.site_enabled,message:$("sm2").value.trim()}).eq("id",1).select();if(r.error)throw r.error;if(!r.data.length)throw new Error("Not allowed.")})};
b.onclick=function(e){var d=e.target.getAttribute("data-del"),p=e.target.getAttribute("data-sp"),i=e.target.getAttribute("data-si");
if(d){var a=d.split(":");if(confirm("Remove this item?"))run(function(){return del(a[0],"id",a[1])})}
else if(p){if(confirm("Remove this person's staff access?"))run(function(){return del("profiles","id",p)})}
else if(i)run(function(){return del("staff_invites","email",i)});
else if(e.target.getAttribute("data-sd")){var sd=e.target.getAttribute("data-sd");if(confirm("Remove this student and all their records?"))run(function(){return del("students","id",sd)})}
else if(e.target.getAttribute("data-rp")){var rp=e.target.getAttribute("data-rp");run(async function(){var r=await sb.from("registrations").update({fee_paid:true}).eq("id",rp).select();if(r.error)throw r.error;if(!r.data.length)throw new Error("Not allowed.")})}
else if(e.target.getAttribute("data-rd")){var rd=e.target.getAttribute("data-rd");if(confirm("Remove this registration?"))run(function(){return del("registrations","id",rd)})}};
}


async function loadRecords(){STU=[];PAY=[];ATT=[];REG=[];MYS=null;if(!ME||!ME.role)return;
var a=await sb.from("students").select("*").order("full_name");STU=a.data||[];if(ME.role==="student")MYS=STU[0]||null;
var t=await sb.from("attendance").select("*");ATT=t.data||[];
if(ME.role!=="teacher"){var p=await sb.from("payments").select("*").order("paid_on",{ascending:false});PAY=p.data||[];if(ME.role!=="student"){var g=await sb.from("registrations").select("*").order("created_at",{ascending:false});REG=g.data||[]}}}
function rStudent(){var b=$("stbody"),s=MYS;
var h='<div class="card item"><div><h3>'+esc(s?s.full_name:ME.email)+'</h3><span class="tag">Student'+(s?" · "+esc(s.admission_no)+" · "+esc(s.level):"")+'</span></div><button class="btn alt" id="sout" type="button" style="color:var(--pri)">Sign out</button></div>';
if(!s)h+='<div class="card" style="margin-top:16px"><p>Your student record was not found. Please contact the school.</p></div>';
else{var bl=blocked(s);
h+='<div class="card" style="margin-top:16px"><h3>Payment status: '+(bl?'<span style="color:#e5384a">BLOCKED</span>':'<span class="ok">ACTIVE</span>')+'</h3><p>'+(bl?esc(lock()):"Your lessons are open until <b>"+due(s)+"</b>. Pay before this date to keep learning.")+'</p><p class="meta">Last payment: '+(s.last_paid_on||"none yet")+" · Classes attended: "+cnt(s.id,"present")+" · Missed: "+cnt(s.id,"missed")+'</p><div class="row"><a class="btn" href="#live">Live classes</a><a class="btn alt" href="#notes" style="color:var(--pri)">Notes</a><a class="btn alt" href="#videos" style="color:var(--pri)">Videos</a><a class="btn alt" href="#fees" style="color:var(--pri)">How to pay</a></div></div>';
h+=payHtml(s);h+='<div class="card" style="margin-top:16px"><h3>My payments</h3>'+(PAY.map(function(p){return"<div"+ROW+"><span>"+esc(p.paid_on)+" · KES "+p.amount+'</span><span class="meta">'+esc(p.reference||"")+"</span></div>"}).join("")||'<p class="meta">No payments recorded yet.</p>')+"</div>"}
b.innerHTML=h;bindPay(s);$("sout").onclick=async function(){await sb.auth.signOut();ME=null;await boot()}}
var WK={"Form 3":800,"Grade 10":600};
function payHtml(s){return'<div class="card" style="margin-top:16px"><h3>Pay with M-Pesa</h3><p class="meta">Enter your M-Pesa number and the amount. A prompt appears on your phone: enter your PIN to pay. No code to copy.</p><div class="two">'+fl("M-Pesa phone number",'<input id="mp" type="tel" value="'+esc(s.parent_phone||"")+'" placeholder="07XXXXXXXX">')+fl("Amount (KES)",'<input id="ma" type="number" min="1" value="'+(WK[s.level]||"")+'">')+'</div><div class="row"><button class="btn" id="mpb" type="button">Pay now</button></div><p class="meta" id="mpm"></p></div>'}
function bindPay(s){var b=$("mpb");if(!b)return;b.onclick=async function(){var m=$("mpm");if(!V("mp")||Number(V("ma"))<1){m.textContent="Enter your M-Pesa number and the amount.";return}
b.disabled=true;m.textContent="Sending the payment request…";
var r=await sb.functions.invoke("mpesa-stk",{body:{phone:V("mp"),amount:Number(V("ma"))}});
if(r.error||!r.data||!r.data.ok){var t="Could not start the payment.";try{var e=r.error?await r.error.context.json():r.data;if(e&&e.error)t=e.error}catch(x){}m.textContent=t;b.disabled=false;return}
m.textContent="Check your phone and enter your M-Pesa PIN…";
for(var n=0;n<30;n++){await new Promise(function(f){setTimeout(f,3000)});var q=await sb.from("mpesa_requests").select("status,result_desc").eq("checkout_request_id",r.data.checkout_request_id).maybeSingle();var st=q.data&&q.data.status;
if(st==="paid"){m.innerHTML='<span class="ok">Payment received. Thank you! Your lessons are open.</span>';await boot();return}
if(st&&st!=="pending"){m.textContent="Payment not completed: "+(q.data.result_desc||st);b.disabled=false;return}}
m.textContent="We have not received the payment yet. If money was deducted, it will update automatically within a few minutes.";b.disabled=false}}
function recordsHtml(adm){var h='<h2 style="font-size:22px;margin-top:28px">Student records</h2><div class="grid">';
if(adm)h+=cd("Add a student",fl("Admission no.",'<input id="sa">')+fl("Full name",'<input id="sn">')+fl("Class",'<select id="sl">'+opts(LV)+"</select>")+fl("Parent phone",'<input id="sph">')+fl("Student or parent email (used to sign in)",'<input id="se2" type="email">')+fl("Joined on",'<input id="sj" type="date" value="'+today()+'">'),"sab","Add student")
+cd("Record a payment",fl("Student",'<select id="pp">'+STU.map(function(s){return'<option value="'+esc(s.id)+'">'+esc(s.admission_no+" – "+s.full_name)+"</option>"}).join("")+"</select>")+fl("Amount (KES)",'<input id="pa" type="number" min="1">')+fl("Date",'<input id="pd" type="date" value="'+today()+'">')+fl("M-Pesa code / reference",'<input id="pr">'),"pab","Record payment");
h+=cd("Mark attendance",fl("Date",'<input id="ad" type="date" value="'+today()+'">')+fl("Class",'<select id="al">'+opts(LV)+'</select>')+'<div id="attl"></div>',"alb","Load list",'<button class="btn" id="asv" type="button" style="display:none">Save attendance</button>');
if(adm)h+=cd("Spreadsheet",'<p class="meta">Download all students, payments and attendance as an Excel file.</p>',"xlb","Download spreadsheet");
h+="</div>";
if(adm)h+='<div class="card tbl" style="margin-top:16px"><h3>Students ('+STU.length+')</h3><table><tr><th>Adm</th><th>Name</th><th>Class</th><th>Status</th><th>Access until</th><th>Missed</th><th></th></tr>'+STU.map(function(s){return"<tr><td>"+esc(s.admission_no)+"</td><td>"+esc(s.full_name)+"</td><td>"+esc(s.level)+"</td><td>"+stat(s)+"</td><td>"+due(s)+"</td><td>"+cnt(s.id,"missed")+"</td><td>"+rm('data-sd="'+esc(s.id)+'"')+"</td></tr>"}).join("")+"</table></div>";
if(adm)h+=regHtml();
return h}
function regHtml(){return'<div class="card" style="margin-top:16px"><h3>Registrations ('+REG.length+")</h3>"+(REG.map(function(r){return"<div"+ROW+"><span><b>"+esc(r.full_name)+"</b> · "+esc(r.phone)+'<br><span class="meta">'+esc((r.services||[]).join(", "))+" · "+fd(r.created_at)+"</span></span><span>"+(r.fee_paid?'<span class="ok">Fee paid ✓</span>':'<button class="btn" data-rp="'+esc(r.id)+'" type="button" style="padding:4px 12px">Mark Ksh 200 paid</button>')+" "+rm('data-rd="'+esc(r.id)+'"')+"</span></div>"}).join("")||'<p class="meta">No registrations yet.</p>')+"</div>"}
function bindRecords(adm,run){
if(adm){
$("sab").onclick=function(){run(async function(){var em=V("se2").toLowerCase();if(!V("sa")||!V("sn"))throw new Error("Add the admission number and name.");if(!/^\S+@\S+\.\S+$/.test(em))throw new Error("Add a valid email so the student can sign in.");await ins("students",{admission_no:V("sa"),full_name:V("sn"),level:V("sl"),parent_phone:V("sph"),email:em,joined_on:V("sj")})})};
$("pab").onclick=function(){run(async function(){if(!V("pp")||Number(V("pa"))<1)throw new Error("Choose a student and enter the amount.");await ins("payments",{student_id:V("pp"),amount:Number(V("pa")),paid_on:V("pd"),reference:V("pr")})})};
$("xlb").onclick=download}
$("alb").onclick=function(){var d=V("ad"),l=V("al"),L=STU.filter(function(s){return s.level===l});
$("attl").innerHTML=L.length?L.map(function(s){var r=ATT.filter(function(a){return a.student_id===s.id&&a.class_date===d})[0];return'<label style="font-weight:400"><input type="checkbox" data-sid="'+esc(s.id)+'"'+(!r||r.status==="present"?" checked":"")+' style="width:auto"> '+esc(s.full_name)+"</label>"}).join("")+'<p class="meta">Ticked = present. Unticked = missed.</p>':'<p class="meta">No students in this class.</p>';$("asv").style.display=L.length?"":"none"};
$("asv").onclick=function(){run(async function(){var d=V("ad"),rows=[].map.call($("attl").querySelectorAll("[data-sid]"),function(c){return{student_id:c.getAttribute("data-sid"),class_date:d,status:c.checked?"present":"missed"}});var r=await sb.from("attendance").upsert(rows);if(r.error)throw r.error})}}
function download(){var nm={};STU.forEach(function(s){nm[s.id]=s});
var S=STU.map(function(s){var t=PAY.filter(function(p){return p.student_id===s.id}).reduce(function(a,p){return a+p.amount},0);return{"Admission No":s.admission_no,"Name":s.full_name,"Class":s.level,"Parent phone":s.parent_phone||"","Email":s.email||"","Joined on":s.joined_on,"Last paid on":s.last_paid_on||"","Access until":due(s),"Status":stat(s),"Total paid (KES)":t,"Classes attended":cnt(s.id,"present"),"Classes missed":cnt(s.id,"missed")}});
var P=PAY.map(function(p){var s=nm[p.student_id]||{};return{"Date":p.paid_on,"Admission No":s.admission_no||"","Name":s.full_name||"","Amount (KES)":p.amount,"Reference":p.reference||""}});
var A=ATT.map(function(a){var s=nm[a.student_id]||{};return{"Date":a.class_date,"Admission No":s.admission_no||"","Name":s.full_name||"","Class":s.level||"","Status":a.status==="missed"?"Missed":"Present"}});
var Rg=REG.map(function(r){return{"Date":fd(r.created_at),"Name":r.full_name,"Phone":r.phone,"Email":r.email||"","Services":(r.services||[]).join("; "),"Class":r.level||"","Guardian":r.guardian||"","Registration fee paid":r.fee_paid?"Yes":"No"}});
var f="aziel-student-records-"+today();
if(window.XLSX){var wb=XLSX.utils.book_new();[["Students",S],["Payments",P],["Attendance",A],["Registrations",Rg]].forEach(function(x){XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(x[1]),x[0])});XLSX.writeFile(wb,f+".xlsx");return}
var k=Object.keys(S[0]||{"Admission No":1}),c=[k.join(",")].concat(S.map(function(r){return k.map(function(x){return'"'+String(r[x]).replace(/"/g,'""')+'"'}).join(",")}));
var u=URL.createObjectURL(new Blob(["\ufeff"+c.join("\n")],{type:"text/csv"})),l=document.createElement("a");l.href=u;l.download=f+".csv";l.click()}

/* ---------- boot, routing, shutdown overlay ---------- */
async function boot(){
if(sb){try{var s=(await sb.auth.getSession()).data.session;ME=null;
if(s){await sb.rpc("claim_invite");var q=await sb.from("profiles").select("*").eq("id",s.user.id).maybeSingle();ME=q.data||{id:s.user.id,email:s.user.email,role:null};await loadRecords()}
var a=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();if(a.data)SET=a.data;
var p=await sb.from("posts").select("*").order("created_at",{ascending:false}),r=await sb.from("resources").select("*").order("created_at",{ascending:false});POSTS=p.data||[];RES=r.data||[]}catch(e){}}
var down=!SET.site_enabled&&!(ME&&ME.role==="web_admin");
$("down").style.display=down?"grid":"none";$("dmsg").textContent=SET.message||"";
rNews();rLive();rNotes();rVids();rStaff()}
$("dgo").onclick=async function(){if(!sb)return;var r=await sb.auth.signInWithPassword({email:V("de").toLowerCase(),password:$("dp").value});if(r.error){$("dm").textContent=r.error.message;return}
await boot();if(!(ME&&ME.role==="web_admin")){await sb.auth.signOut();ME=null;$("dm").textContent="Only the web administrator can sign in while the site is off.";await boot()}};
var names=["home","live","notes","videos","admissions","fees","staff","news","about","contact"];
function route(){var h=(location.hash||"#home").slice(1);if(names.indexOf(h)<0)h="home";
names.forEach(function(n){$(n).classList.toggle("on",n===h)});
[].forEach.call($("nav").children,function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+h)});window.scrollTo(0,0)}
window.addEventListener("hashchange",route);route();boot();
})();
