
// LILIJA users_admin.js
(function(){
  if(window.__lilijaUsersAdminLoaded) return; window.__lilijaUsersAdminLoaded = true;
  window.currentUser = window.currentUser || function(){
    const users = (typeof loadUsers==='function'? loadUsers() : []) || [];
    return users.find(u=>u.username===window.CURRENT_USER) || null;
  };
  window.can = window.can || function(module, action){
    const u = window.currentUser? window.currentUser() : null;
    if(!u) return false;
    if(u.isRoot===true || u.type==='admin') return true;
    return !!(u.perms && u.perms[module] && u.perms[module][action]);
  };
  window.ensureUserSchema = window.ensureUserSchema || function(){
    if(typeof loadUsers!=='function' || typeof saveUsers!=='function') return;
    let users = loadUsers(); if(!Array.isArray(users)) users = [];
    let changed=false, hasRoot=false;
    const MODULES=['products','purchases','sales','users','settings','audit'];
    const defaultUserPerms=Object.fromEntries(MODULES.map(m=>[m,{view:true,edit:false,delete:false}]));
    const defaultAdminPerms=Object.fromEntries(MODULES.map(m=>[m,{view:true,edit:true,delete:true}]));
    users = users.map((u,idx)=>{
      if(!u.type){ u.type=(idx===0?'admin':'user'); changed=true; }
      if(!u.perms){ u.perms=(u.type==='admin')? defaultAdminPerms : defaultUserPerms; changed=true; }
      if(u.isRoot) hasRoot=true;
      return u;
    }).slice(0,5);
    if(!hasRoot && users.length){ users[0].isRoot=true; users[0].type='admin'; users[0].perms=defaultAdminPerms; changed=true; }
    if(changed) saveUsers(users);
  };

  window.renderUsersAdmin = function renderUsersAdmin(){
    try{
      window.ensureUserSchema && ensureUserSchema();
      const section = document.getElementById('usersAdminSection');
      const wrap = document.getElementById('usersAdminWrap');
      if(!section||!wrap) return;
      const me = (window.currentUser&&currentUser()) || null;
      const isAdmin = !!(me && (me.type==='admin' || me.isRoot===true));
      section.style.display = isAdmin ? '' : 'none';
      if(!isAdmin){ wrap.innerHTML=''; return; }

      const users = (typeof loadUsers==='function'? loadUsers():[]) || [];
      const isRoot = !!(me && me.isRoot===true);
      const canCreate = isRoot && users.length<5;

      let html = '<div class="hint">'+(isRoot?'الأدمن الرئيسي فقط يمكنه إنشاء المستخدمين.':'عرض فقط')+'</div>';
      if(isRoot){
        html += '<div class="flex" style="gap:8px;margin:8px 0"><button id="btnCreateUser" class="btn-primary" type="button">➕ إنشاء مستخدم جديد</button><span class="hint">('+users.length+'/5)</span></div>';
      }
      html += '<div class="table-wrap"><table><thead><tr><th>المستخدم</th><th>النوع</th><th>المنتجات</th><th>المبيعات</th><th>المشتريات</th><th>المستخدمون</th><th>الإعدادات</th><th>سجل الحركات</th><th></th></tr></thead><tbody>';

      const MODULES=['products','sales','purchases','users','settings','audit'];
      function permCells(u, mod){
        const p=(u.perms&&u.perms[mod])||{};
        function cb(act, lbl){
          const checked = (u.type==='admin')? 'checked disabled' : (p[act]?'checked':'');
          return '<label class="hint" style="display:inline-flex;gap:4px;align-items:center;margin:0 6px"><input data-uid="'+u.username+'" data-mod="'+mod+'" data-act="'+act+'" type="checkbox" '+checked+' /><span>'+lbl+'</span></label>';
        }
        return u.isRoot? '—' : cb('view','رؤية')+cb('edit','تعديل')+cb('delete','حذف');
      }

      users.forEach(u=>{
        html += '<tr><td>'+u.username+'</td><td>'+(u.isRoot? '<span class="hint">أدمن رئيسي</span>' : `<select data-role="${u.username}"><option value="user" ${u.type==='user'?'selected':''}>User</option><option value="admin" ${u.type==='admin'?'selected':''}>Admin</option></select>` )+'</td>'
          + '<td>'+permCells(u,'products')+'</td>'
          + '<td>'+permCells(u,'sales')+'</td>'
          + '<td>'+permCells(u,'purchases')+'</td>'
          + '<td>'+permCells(u,'users')+'</td>'
          + '<td>'+permCells(u,'settings')+'</td>'
          + '<td>'+permCells(u,'audit')+'</td>'
          + '<td>'+(u.isRoot? '' : `<button class="btn-danger" data-remove="${u.username}" type="button">حذف</button>` )+'</td></tr>';
      });
      html+='</tbody></table></div>';
      wrap.innerHTML=html;

      wrap.onchange=(e)=>{
        const uname=e.target.getAttribute('data-role');
        if(uname){
          const list=loadUsers(); const u=list.find(x=>x.username===uname); if(!u) return;
          if(u.isRoot){ e.target.value='admin'; return; }
          const next=e.target.value;
          const adminCount=list.filter(x=>x.type==='admin'||x.isRoot===true).length;
          if(u.type==='admin' && next!=='admin' && adminCount<=1){ alert('يجب أن يبقى حساب أدمن واحد على الأقل'); e.target.value='admin'; return; }
          u.type=next; saveUsers(list); return;
        }
        const uid=e.target.getAttribute('data-uid');
        if(uid){
          const mod=e.target.getAttribute('data-mod'); const act=e.target.getAttribute('data-act');
          const list=loadUsers(); const u=list.find(x=>x.username===uid); if(!u) return;
          if(u.isRoot) return;
          u.perms=u.perms||{}; u.perms[mod]=u.perms[mod]||{view:false,edit:false,delete:false};
          u.perms[mod][act]=e.target.checked; saveUsers(list); return;
        }
      };
      wrap.onclick=(e)=>{
        const rm=e.target.getAttribute('data-remove');
        if(rm){
          if(rm===window.CURRENT_USER) return alert('لا يمكن حذف الحساب الحالي');
          const list=loadUsers(); const u=list.find(x=>x.username===rm); if(u?.isRoot) return;
          const next=list.filter(x=>x.username!==rm);
          const adminCount=next.filter(x=>x.type==='admin'||x.isRoot===true).length;
          if(adminCount===0) return alert('يجب أن يبقى حساب أدمن واحد على الأقل');
          saveUsers(next); renderUsersAdmin(); return;
        }
      };

      const btn=document.getElementById('btnCreateUser');
      if(btn){
        btn.disabled = !canCreate;
        btn.onclick = async ()=>{
          if(!canCreate) return;
          const uname=prompt('اسم المستخدم؟'); if(!uname) return;
          const pass1=prompt('كلمة المرور؟'); if(!pass1) return;
          const list=loadUsers();
          if(list.length>=5) return alert('بلغت الحد الأقصى 5 مستخدمين');
          if(list.find(x=>x.username.toLowerCase()===uname.toLowerCase())) return alert('الاسم موجود');
          const salt=genSalt(); const hash=await sha256(pass1+salt);
          const defaultPermsUser=Object.fromEntries(['products','purchases','sales','users','settings','audit'].map(m=>[m,{view:true,edit:false,delete:false}]));
          list.push({ username:uname, salt, hash, type:'user', perms: defaultPermsUser });
          saveUsers(list); renderUsersAdmin();
        };
      }
    }catch(err){ console.warn('renderUsersAdmin error', err); }
  };

  document.addEventListener('click', (e)=>{
    if(e.target && e.target.classList && e.target.classList.contains('tab') && e.target.dataset.tab==='settings'){
      try{ renderUsersAdmin(); }catch{}
    }
  });
})();
