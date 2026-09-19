const $ = id => document.getElementById(id);
let currentUser = null;
let selectedRole = "student";
let authMode = "login";

const savedUser = localStorage.getItem("campusfind_user");
const sessionUser = sessionStorage.getItem("campusfind_user");
if (savedUser) currentUser = JSON.parse(savedUser);
else if (sessionUser) currentUser = JSON.parse(sessionUser);

function showMessage(text, error=false){
  const box=$("authMessage"); box.textContent=text; box.className="auth-message"+(error?" error":"");
}
function toast(text){const t=$("toast");t.textContent=text;t.style.display="block";setTimeout(()=>t.style.display="none",2800)}
function setAuthMode(mode){
  authMode=mode;
  $("loginForm").classList.toggle("hidden",mode!=="login");
  $("registerForm").classList.toggle("hidden",mode!=="register");
  $("forgotForm").classList.toggle("hidden",mode!=="forgot");
  $("roleSwitch").classList.toggle("hidden",mode==="forgot");
  if(mode==="login"){
    $("authTitle").textContent="Welcome back";$("authSubtitle").textContent="Sign in with your college account.";
    $("authSwitch").innerHTML='New to CampusFind? <button id="registerButton" type="button">Create account</button>';
    $("registerButton").onclick=()=>setAuthMode("register");
  }else if(mode==="register"){
    $("authTitle").textContent="Create your account";$("authSubtitle").textContent="Register as a student or lecturer.";
    $("authSwitch").innerHTML='<button id="loginBack" type="button">← Back to login</button>';
    $("loginBack").onclick=()=>setAuthMode("login");
  }else{
    $("authTitle").textContent="Reset your password";$("authSubtitle").textContent="Use your college email to set a new password.";
    $("authSwitch").innerHTML='<button id="loginBack2" type="button">← Back to login</button>';
    $("loginBack2").onclick=()=>setAuthMode("login");
  }
  showMessage("");
}

document.querySelectorAll(".role-switch button").forEach(btn=>btn.onclick=()=>{
  selectedRole=btn.dataset.role;
  document.querySelectorAll(".role-switch button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
});

$("forgotButton").onclick=()=>setAuthMode("forgot");
$("loginForm").onsubmit=async e=>{
  e.preventDefault(); showMessage("");
  const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("loginEmail").value,password:$("loginPassword").value,role:selectedRole})});
  const out=await r.json();
  if(!r.ok) return showMessage(out.error||"Login failed.",true);
  currentUser=out.user;
  if($("rememberMe").checked){localStorage.setItem("campusfind_user",JSON.stringify(currentUser));sessionStorage.removeItem("campusfind_user");}
  else{sessionStorage.setItem("campusfind_user",JSON.stringify(currentUser));localStorage.removeItem("campusfind_user");}
  openApp();
};
$("registerForm").onsubmit=async e=>{
  e.preventDefault();
  const r=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:$("registerName").value,email:$("registerEmail").value,password:$("registerPassword").value,role:selectedRole})});
  const out=await r.json();
  if(!r.ok) return showMessage(out.error,true);
  showMessage("Account created. Please login.");
  $("loginEmail").value=$("registerEmail").value; setAuthMode("login");
};
$("forgotForm").onsubmit=async e=>{
  e.preventDefault();
  const r=await fetch("/api/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("forgotEmail").value,newPassword:$("forgotPassword").value})});
  const out=await r.json();
  if(!r.ok) return showMessage(out.error,true);
  showMessage("Password reset successfully. Please login."); setAuthMode("login"); $("loginEmail").value=$("forgotEmail").value;
};

function openApp(){
  $("loginScreen").classList.add("hidden"); $("app").classList.remove("hidden");
  updateUserUI(); loadStats(); loadItems();
}
function updateUserUI(){
  if(!currentUser)return;
  const initial=currentUser.name.charAt(0).toUpperCase();
  ["userAvatar","bigAvatar"].forEach(id=>$(id).textContent=initial);
  $("userName").textContent=currentUser.name; $("userRole").textContent=currentUser.role;
  $("profileName").textContent=currentUser.name; $("profileRole").textContent=currentUser.role;
  $("welcomeRole").textContent=currentUser.role.toUpperCase();
  $("profilePoints").textContent=currentUser.points;
}
$("logoutButton").onclick=()=>{localStorage.removeItem("campusfind_user");sessionStorage.removeItem("campusfind_user");location.reload();};

async function refreshProfile(){
  const r=await fetch("/api/profile/"+currentUser.id); if(r.ok){currentUser=await r.json(); updateUserUI(); localStorage.getItem("campusfind_user")?localStorage.setItem("campusfind_user",JSON.stringify(currentUser)):sessionStorage.setItem("campusfind_user",JSON.stringify(currentUser));}
}
async function loadStats(){
  const r=await fetch("/api/stats"); const s=await r.json();
  $("totalStat").textContent=s.total;$("lostStat").textContent=s.lost;$("foundStat").textContent=s.found;$("recoveredStat").textContent=s.recovered;
}
async function loadItems(){
  const q=new URLSearchParams({search:$("search").value,type:$("type").value,category:$("category").value});
  const r=await fetch("/api/items?"+q); const items=await r.json();
  const grid=$("itemsGrid");
  if(!items.length){grid.innerHTML='<div class="empty">🔎<br><br><b>No matching reports</b><br>Try another keyword or filter.</div>';return;}
  grid.innerHTML=items.map(item=>{
    const mine=Number(item.reporter_id)===Number(currentUser.id);
    const recovered=item.status==="Recovered";
    return `<article class="item-card ${recovered?'recovered':''}">
      <div class="item-image">${item.image_url?`<img src="${esc(item.image_url)}" alt="${esc(item.item_name)}" onerror="this.parentElement.innerHTML='<div class=\'no-img\'>📦</div>'">`:'<div class="no-img">📦</div>'}<span class="tag ${item.report_type.toLowerCase()}">${item.report_type}</span>${recovered?'<span class="status-badge">RECOVERED</span>':''}</div>
      <div class="item-body"><div class="title-row"><h3>${esc(item.item_name)}</h3><span class="category">${esc(item.category)}</span></div><p>${esc(item.description)}</p><div class="meta">📍 ${esc(item.location)} &nbsp; • &nbsp; 📅 ${esc(item.report_date)}</div><div class="meta">👤 Reported by ${esc(item.reporter_name)}</div>
      <div class="card-actions">${!recovered?`<button class="claim" onclick="openClaim(${item.id},'${escAttr(item.item_name)}','${escAttr(item.report_type)}')">${item.report_type==='Found'?'This is my item':'I found this item'}</button>`:''}${item.report_type==='Found' && !recovered?`<span class="reward-mini">🏆 Finder earns +${item.reward_points} pts</span>`:''}${mine && !recovered?`<button class="recover" onclick="recoverItem(${item.id})">Mark returned</button>`:''}</div></div>
    </article>`;
  }).join("");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));}
function escAttr(s){return esc(s).replace(/`/g,"&#096;");}
$("search").oninput=loadItems;$("type").onchange=loadItems;$("category").onchange=loadItems;
$("browseHero").onclick=()=>$("items").scrollIntoView({behavior:"smooth"});
$("reportHero").onclick=()=>openModal("reportModal");$("reportTop").onclick=()=>openModal("reportModal");

function openModal(id){$(id).classList.add("show");}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove("show"));
document.querySelectorAll(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove("show")});
$("reportForm").querySelector('input[name="report_date"]').value=new Date().toISOString().slice(0,10);
$("reportForm").onsubmit=async e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target)); data.reporter_id=currentUser.id;
  const r=await fetch("/api/items",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); const out=await r.json();
  if(!r.ok)return toast(out.error||"Unable to submit report");
  e.target.reset();$("reportForm").querySelector('input[name="report_date"]').value=new Date().toISOString().slice(0,10);$("reportModal").classList.remove("show");toast("✓ Item report submitted");loadItems();loadStats();
};
function openClaim(id,name,type){$("claimItemId").value=id;$("claimTitle").textContent=type==='Found'?"Claim this found item":"Report that you found this lost item";$("claimMeta").textContent=name;openModal("claimModal");}
$("claimForm").onsubmit=async e=>{
  e.preventDefault();
  const r=await fetch("/api/claims",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({item_id:Number($("claimItemId").value),claimant_id:currentUser.id,claimant_name:currentUser.name,claimant_contact:$("claimContact").value,message:$("claimMessage").value})});
  const out=await r.json(); if(!r.ok)return toast(out.error||"Unable to send claim");
  e.target.reset();$("claimModal").classList.remove("show");toast("✓ Claim request sent");
};
async function recoverItem(id){
  const r=await fetch("/api/items/"+id+"/recover",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:currentUser.id})});
  const out=await r.json(); if(!r.ok)return toast(out.error||"Unable to update item");
  toast(out.points_awarded?`✓ Returned! +${out.points_awarded} finder points awarded.`:"✓ Item marked returned."); await refreshProfile(); loadItems(); loadStats();
}

if(currentUser) openApp();
