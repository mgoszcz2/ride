//Connect page
;(function(){'use strict'

var esc=D.util.esc
var q={} // mapping between ids and jQuery objects
var $sel=$(),sel,$d // $sel:selected item(s), sel: .data('cn') of the selected item (only if it's unique), $d:dialog
var DFLT_NAME='[anonymous]',TMP_NAME='[temp]',MIN_VER=[15,0] // minimum supported version
var interpreters=[], interpretersSSH=[], user=D.el?process.env.USER:''
var KV=/^([a-z_]\w*)=(.*)$/i,WS=/^\s*$/ // regexes for parsing env vars
function cmpVer(x,y){return x[0]-y[0]||x[1]-y[1]||0} // compare two versions of the form [major,minor]
function save(){D.prf.favs($('>*',q.favs).map(function(){var h=$(this).data('cn');return h.tmp?null:h}).toArray())}
function favText(x){return x.tmp?TMP_NAME:x.name||DFLT_NAME}
function favDOM(x){return $('<div><span class=name>'+esc(favText(x))+'</span><button class=go>Go</button>').data('cn',x)}
function fmtKey(e){return[e.metaKey?'Cmd-':'',e.ctrlKey?'Ctrl-':'',e.altKey?'Alt-':'',e.shiftKey?'Shift-':'',
                          CodeMirror.keyNames[e.which]||''].join('')}
function updFormDetail(){$('>*',q.detail).hide();q[q.type.val()].show()} // the part below "Type"
function updExes(){
  q.fetch.toggle(q.ssh[0].checked)
  var h=(q.ssh[0].checked?interpretersSSH:interpreters)
    .sort(function(x,y){return cmpVer(y.ver,x.ver)||+y.bits-+x.bits||(y.edition==='unicode')-(x.edition==='unicode')})
    .map(function(x){
      var s='v'+x.ver.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
      var supported=cmpVer(x.ver,MIN_VER)>=0;supported||(s+=' (unsupported)')
      return'<option value="'+esc(x.exe)+'"'+(supported?'':' disabled')+'>'+esc(s)
    }).join('')
  q.exes.html(h+'<option value="">Other...').val(q.exe.val()).val()||q.exes.val('')
  q.exe.prop('readonly',!!q.exes.val())
}
D.cn=function(){
  document.title='RIDE - Connect'
  $('#cn').show().splitter()
    .keyup(function(x){
      if(x.which===123&&!x.ctrlKey&&!x.shiftKey&&!x.altKey&&!x.metaKey){D.elw.webContents.toggleDevTools();return!1}
    })
    .find('[id^=cn-]').each(function(){q[this.id.replace(/^cn-/,'').replace(/-/g,'_')]=$(this)})
  q.fav_cb.change(function(){
    var c=this.checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('.name').text(favText(sel))
    q.fav_name_wr.toggle(c);c&&q.fav_name.focus();save()
  })
  q.fav_name.prop('placeholder',DFLT_NAME).on('change keyup',function(e){
    var u=sel.name,v=this.value;if(u!==v){v?(sel.name=v):delete sel.name;$sel.find('.name').text(favText(sel));save()}
  })
  q.type.change(function(){sel.type=this.value;updFormDetail();save()})
  updFormDetail()
  q.ssh.change(function(){q.ssh_detail.toggle(this.checked);updExes()})
  q.ssh_detail.find('[name=user]').prop('placeholder',user)
  q.fetch.click(function(){
    if(!validate())return
    var pw=q.ssh_pass.val(),kf=q.ssh_key.val();q.fetch[0].disabled=1
    D.skt.emit('*sshFetchListOfInterpreters',{host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf})
  })
  q.exe.on('change keyup',function(){q.exes.val()||D.prf.otherExe($(this).val())})
  q.exes.change(function(){
    var v=$(this).val(),$e=q.exe.val(v||D.prf.otherExe()).prop('readonly',!!v).change();v||$e.focus()
    D.prf.selectedExe(v) // todo: do we still need this pref?
  })
  q.env_add.on('click','a',function(e){
    var t=$(this).text(), e=q.env[0], k=t.split('=')[0], s=e.value, m=RegExp('^'+k+'=(.*)$','m').exec(s)
    if(m){e.setSelectionRange(m.index+k.length+1,m.index+m[0].length)}
    else{e.value=s=s.replace(/([^\n])$/,'$1\n')+t+'\n';$(e).change()
         e.setSelectionRange(s.length-t.length+k.length,s.length-1)}
    return!1
  })
  q.ssl_cb.change(function(){q.ssl_detail.toggle(this.checked)})
  q.cert_cb.change(function(){q.cert.add(q.cert_dots).prop('disabled',!this.checked).val('');q.cert.elastic()})
  q.subj_cb.change(function(){q.subj.prop('disabled',!this.checked).val('')})
           .click(function(){this.checked&&q.subj.focus()})
  q.cert_dots.click(function(){q.cert_file.click()})
  q.cert_file.change(function(){q.cert.val(this.value).elastic().change()})
  q.ssh_key_dots.click(function(){q.ssh_key_file.click()})
  q.ssh_key_file.change(function(){q.ssh_key.val(this.value).change()})
  D.prf.favs().forEach(function(x){q.favs.append(favDOM(x))})
  q.favs.list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(e){q.favs.list('select',$(this).parentsUntil(q.favs).last().index());q.go.click()})
    .keydown(function(e){switch(fmtKey(e)){
      case'Enter' :q.go.filter(':visible').click();return!1
      case'Ctrl-N':q.neu  .click();return!1
      case'Delete':q.del  .click();return!1
      case'Ctrl-D':q.clone.click();return!1
    }})
    .on('list-order-changed',save)
    .on('list-selection-changed',function(){
      $sel=$('.list-selection',q.favs)
      var u=$sel.length===1 // is selection unique?
      q.clone.attr('disabled',!u);q.del.attr('disabled',!$sel.length);q.rhs.toggle(u)
      sel=u?$sel.data('cn'):null
      if(u){
        q.type.val(sel.type||'connect');updFormDetail();updExes()
        q.fav_cb.prop('checked',!sel.tmp);q.fav_name.val(sel.name);q.fav_name_wr.toggle(!sel.tmp)
        $(':text[name],textarea[name]',q.rhs).each(function(){$(this).val(sel[this.name])})
        $(':checkbox[name]',q.rhs).each(function(){$(this).prop('checked',+sel[this.name])})
        q.exes.val(sel.exe).val()||q.exes.val('') // use sel.exe if available, otherwise use "Other..."
        $(':text',q.rhs).elastic()
        q.ssl_detail.toggle(!!sel.ssl);q.ssh_detail.toggle(!!sel.ssh)
        q.cert_cb.prop('checked',!!sel.cert);q.cert.add(q.cert_dots).prop('disabled',!sel.cert)
        q.subj_cb.prop('checked',!!sel.subj);q.subj.prop('disabled',!sel.subj)
      }
    })
    .list('select',0).find('a').eq(0).focus()
  q.neu.click(function(){var $e=favDOM({});q.favs.append($e).list('select',$e.index());q.fav_name.focus()})
  q.clone.click(function(){
    if(sel){favDOM($.extend({},sel)).insertBefore($sel);$('a',$sel).focus();save();q.fav_name.focus()}
  })
  q.del.click(function(){
    var n=$sel.length
    n&&$.confirm('Are you sure you want to delete\nthe selected configuration'+(n>1?'s':'')+'?','Confirmation',
      function(r){if(r){var i=$sel.eq(0).index();$sel.remove();q.favs.list('select',i,1);save()}})
  })
  q.about.click(function(){D.abt()})
  q.go.click(go)
  $(':text',q.rhs).elastic()
  $(':text[name],textarea[name]',q.rhs).change(function(){var k=this.name,v=this.value;v?(sel[k]=v):delete sel[k];save()})
  $(':checkbox[name]',q.rhs).change(function(){this.checked?(sel[this.name]=1):delete sel[this.name];save()})
  D.skt
    .on('*connected',function(x){if($d){$d.dialog('close');$d=null};new D.IDE().setHostAndPort(x.host,x.port)})
    .on('*spawned',function(x){D.lastSpawnedExe=x.exe})
    .on('*spawnedExited',function(x){$.alert(x.code!=null?'exited with code '+x.code:'received '+x.sig)})
    .on('*error',function(x){$d&&$d.dialog('close');$d=null;$.alert(x.msg,'Error');q.fetch[0].disabled=0})
    .on('*proxyInfo',function(x){interpreters=x.interpreters;updExes()})
    .on('*sshInterpreters',function(x){interpretersSSH=x.interpreters;updExes();q.fetch[0].disabled=0})
    .emit('*getProxyInfo')
}
function validate(){
  var $host=$('[name=host]:visible'),$port=$('[name=port]:visible')
  if($host.length&&!sel.host){$.alert('"host" is required','Error',function(){$host.select()});return}
  if($port.length&&sel.port&&(!/^\d*$/.test(sel.port)||+sel.port<1||+sel.port>0xffff))
      {$.alert('Invalid port','Error',function(){$port.select()});return}
  if(q.type.val()==='start'){
    var a=q.env.val().split('\n')
    for(var i=0;i<a.length;i++)if(!KV.test(a[i])&&!WS.test(a[i]))
      {$.alert('Invalid environment variables','Error',function(){q.env.focus()});return}
    if(sel.ssh){
      var pw=q.ssh_pass.val(),kf=q.ssh_key.val()
      if(!pw&&!kf){$.alert('Either "Password" or "Key file" is required','Error',function(){q.ssh_pass.focus()});return}
      if(pw&&kf){$.alert('Only one of "Password" and "Key file" must be present','Error',function(){q.ssh_pass.focus()});return}
    }
  }
  return 1
}
function go(){
  $d&&$d.dialog('close');if(!validate())return!1
  try{
    switch(q.type.val()){
      case'connect':
        $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
          .dialog({modal:1,width:350,title:'Connecting...'})
        D.skt.emit('*connect',{host:sel.host,port:+sel.port||4502,ssl:sel.ssl,cert:sel.cert,subj:sel.subj});break
      case'listen':
        var port=sel.port||4502
        $d=$(
          '<div class=listen>'+
            '<div class=visual-distraction></div>'+
            'Please start the remote interpreter with'+
            '<div class=tt>RIDE_INIT=\'CONNECT:<i>host</i>:'+port+'\'</div>'+
            ' in its environment, so it connects here.'+
          '</div>'
        ).dialog({modal:1,width:450,title:'Waiting for connection...',
                  buttons:[{html:'<u>C</u>ancel',click:function(){$d.dialog('close')}}],
                  close:function(){D.skt.emit('*listenCancel')}})
        D.skt.emit('*listen',{port:port});break
      case'start':
        var env={},a=q.env.val().split('\n'),m
        for(var i=0;i<a.length;i++)if(m=KV.exec(a[i]))env[m[1]]=m[2]
        if(sel.ssh){
          var pw=q.ssh_pass.val(),kf=q.ssh_key.val()
          $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
            .dialog({modal:1,width:350,title:'Connecting...'})
          D.skt.emit('*ssh',{host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf,env:env})
        }else{
          D.skt.emit('*launch',{exe:sel.exe,env:env})
        }
        break
      default:$.alert('nyi')
    }
  }catch(e){$.alert(e,'Error')}
  return!1
}

}())