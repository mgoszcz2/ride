global.D={}
const fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process'),
      ps=process,{env}=ps,repr=JSON.stringify,el=D.el=require('electron')
// Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win=/^win/i.test(ps.platform);D.mac=ps.platform=='darwin'
env.RIDE_SPAWN=env.RIDE_SPAWN|| // the default depends on whether this is a standalone RIDE
  (D.win?0:+fs.existsSync(path.dirname(ps.execPath)+(D.mac?'/../../../../Resources/Dyalog/mapl':'/../mapl')))

//file-backed storage with an API similar to that of localStorage
{
  if(D.floating){D.db=opener.D.db;return}
  const k=[],v=[] // keys and values
  D.db={
    key:i=>k[i],
    getItem(x)   {const i=k.indexOf(x);return i<0?null:v[i]},
    setItem(x,y) {const i=k.indexOf(x);if(i<0){k.push(x);v.push(y)}else{v[i]=y};dbWrite()},
    removeItem(x){const i=k.indexOf(x);if(i>=0){k.splice(i,1);v.splice(i,1);dbWrite()}},
    _getAll()    {const r={};for(let i=0;i<k.length;i++)r[k[i]]=v[i];return r}
  }
  Object.defineProperty(D.db,'length',{get:()=>k.length})
  const ver=fs.readFileSync(__dirname+'/_/version','utf8').replace(/^(\d+)\.(\d+)\.[^]*$/,'$1$2')
  const d=el.app.getPath('userData'),f=d+'/prefs.json'
  try{if(fs.existsSync(f)){const h=JSON.parse(fs.readFileSync(f,'utf8'));for(let x in h){k.push(x);v.push(h[x])}}}
  catch(e){console.error(e)}
  let st=0,dbWrite=()=>{ // st: state 0=initial, 1=write pending, 2=write in progress
    if(st===2){st=1;return}else{st=2}
    const s='{\n'+k.map((x,i)=>'  '+repr(x)+':'+repr(v[i])).sort().join(',\n')+'\n}\n'
    fs.writeFile(f+'1',s,e=>{
      if(e){console.error(e);dbWrite=()=>{};return} // make dbWrite() a nop
      fs.unlink(f,()=>{fs.rename(f+'1',f,()=>{if(st===1){setTimeout(()=>{dbWrite()},1000)}else{st=0}})})
    })
  }
}

if(D.win&&D.db.getItem('ime')!=='0'){ // switch IME locale as early as possible; '1' or '' means yes
  const setImeExe=ps.execPath.replace(/[^\\\/]+$/,'set-ime.exe')
  fs.existsSync(setImeExe)&&spawn(setImeExe,[ps.pid],{stdio:['ignore','ignore','ignore']})
}

if(D.mac&&!env.RIDE_INTERPRETER_EXE){env.RIDE_INTERPRETER_EXE=D.lastSpawnedExe=path.resolve(ps.cwd(),'../Dyalog/mapl')}
//  nww.on('close',function(){
//    if(D.forceClose){
//      let fw=opener.D.floatingWindows;fw.splice(fw.indexOf(nww),1);ps.nextTick(function(){nww.close(true)})
//    }else if(!D.floating){
//      D.lastError?nww.close(true):$.confirm('Are you sure you want to close this window?','Close?',
//                                            function(r){r&&nww.close(true)})
//    }else{
//      let f=window.onbeforeunload;f&&f();D.floating||ps.nextTick(function(){ps.exit(0)})
//    }
//  })
//  opener&&(D.ide=opener.D.ide)

el.app.on('ready',()=>{
  const p=D.db.getItem('pos');let dx=0,dy=0
  let w=D.elw=new el.BrowserWindow({x:p&&p[0],y:p&&p[1],width:p&&p[2],height:p&&p[3],show:0,icon:'style/D128x128.png'})
  const savePos=()=>{const b=w.getBounds();D.db.setItem('pos',[b.x-dx,b.y-dy,b.width,b.height])}
  el.Menu.setApplicationMenu(null)
  w.loadURL(`file://${__dirname}/index.html`)
  w.on('closed',()=>{w=D.elw=0}).on('moved',savePos).on('resize',savePos)
   .on('show',()=>{if(p){const q=w.getPosition();dx=q[0]-p[0];dy=q[1]-p[1]}}).show()
  if(D.win){
    const repaintTitle=()=>{setTimeout(()=>{const a=w.getSize();w.setSize(a[0],a[1]-1);w.setSize(a[0],a[1])},100)}
    w.on('page-title-updated',repaintTitle).on('blur',repaintTitle)
  }
  w.webContents.openDevTools()
})
el.app.on('window-all-closed',()=>el.app.quit())

let execPath=ps.execPath // todo: D.mac&&(execPath=execPath.replace(/(\/Contents\/).*$/,'$1MacOS/nwjs'))
D.rideConnect=()=>{
  let e={};for(let k in env)e[k]=env[k];e.RIDE_SPAWN='0'
  spawn(execPath,[],{detached:true,stdio:['ignore','ignore','ignore'],env:e})
}
//  D.quit=function(){gui.Window.get().close()}
//  D.showProtocolLog=function(){
//    let lw=window.lw=open('empty.html')
//    function wr(s){
//      if(!lw||lw.closed||!lw.document||!lw.document.createTextNode){proxy.log.rmListener(wr);lw=null;return}
//      let b=lw.document.body,atEnd=b.scrollTop==b.scrollHeight-b.clientHeight
//      b.appendChild(lw.document.createTextNode(s));atEnd&&(b.scrollTop=b.scrollHeight-b.clientHeight)
//    }
//    lw.onload=function(){
//      lw.document.body.innerHTML='<style>body{font-family:monospace;margin:0;padding:0;white-space:pre;'+
//                                             'position:absolute;top:0;bottom:0;left:0;right:0;overflow:scroll}</style>'
//      lw.document.title='RIDE Protocol Log';wr(proxy.log.get().join(''));proxy.log.addListener(wr)
//    }
//    return!1
//  }
//  function expandStackString(s){ // s:the string from new Error().stack, we'll insert code snippets there
//    let C=2 // how many lines of context above and below
//    return s.replace(/\(file:\/\/([^\n\r\)]+):(\d+):(\d+)\)/g,function(m,f,l,c){ // m:whole match,f:file,l:line,c:col
//      if(f.indexOf('/')>=0||f.indexOf('\\')>=0){
//        try{
//          l-- // make "l" a 0-based line number
//          let lines=fs.readFileSync(f,'utf8').split(/\r?\n/)
//          let l0=Math.max(l-C,0),l1=Math.min(l+C,lines.length),fr=lines.slice(l0,l1-1) // fragment to show
//          let ok=1;for(let i=0;i<fr.length;i++)if(fr[i].length>200){ok=0;break}
//          if(ok){ // if the fragment doesn't contain lines that are too long
//            fr=fr.map(function(x){return'            '+x})
//            fr[l-l0]='>'+fr[l-l0].slice(1)
//            m+='\n'+fr.join('\n')
//          }
//        }catch(_){}
//      }
//      return m
//    })
//  }
//  if(!D.floating){
//    let H={'&':'&amp;','<':'&lt;','>':'&gt;'}
//    let htmlEsc=function(s){return s.replace(/./g,function(x){return H[x]||x})} // todo: can we require('util') ?
//    ps.on('uncaughtException',function(e){
//      window&&(D.lastError=e)
//      let info=
//        'IDE: '+repr(D.versionInfo)+
//        '\nInterpreter: '+repr(D.remoteIdentification||null)+
//        '\nIDE prefs: '+repr(D.db._getAll())+
//        '\n\n'+expandStackString(e.stack)+
//        '\n\nProxy log:'+proxy.log.get().join('')
//      let excuses=[
//        '',
////        'Oops... it broke!',
////        'Congratulations, you found a ... THE bug.',
////        'Users-Developers 1:0',
////        'According to our developers this is impossible.',
////        'This bug was caused by cosmic radiation randomly flipping bits.',
////        'You don\'t find bugs. Bugs find you.'
//      ]
//      document.write(
//        '<html>'+
//          '<head><title>Error</title></head>'+
//          '<body>'+
//            '<h3>'+excuses[Math.floor(excuses.length*Math.random())]+'</h3>'+
//            '<h3 style=font-family:apl,monospace>'+
//              '<a href="mailto:support@dyalog.com?subject='+escape('RIDE crash')+
//                              '&body='+escape('\n\n'+info)+'">support@dyalog.com</a>'+
//            '</h3>'+
//            '<textarea autofocus style=width:100%;height:90% nowrap>'+htmlEsc(info)+'</textarea>'+
//          '</body>'+
//        '<html>'
//      )
//      return!1
//    })
//  }

//D.open=(url,o)=>{o.icon='D.png';o.toolbar==null&&(o.toolbar=false);return!!gui.Window.open(url,o)} // o:options

if(env.RIDE_EDITOR){
  const d=os.tmpDir()+'/dyalog';fs.existsSync(d)||fs.mkdirSync(d,0o700)
  D.openInExternalEditor=(ee,callback)=>{ // ee: EditableEntity from RIDE protocol
    const f=d+'/'+ee.name+'.dyalog';fs.writeFileSync(f,ee.text,{encoding:'utf8',mode:0o600})
    const e={};for(let k in env)e[k]=env[k];e.LINE=''+(1+(ee.currentRow||0))
    const p=spawn(env.RIDE_EDITOR,[f],{env:e})
    p.on('error',x=>{throw x})
    p.on('exit',()=>{const s=fs.readFileSync(f,'utf8');fs.unlinkSync(f);callback(s)})
  }
}

// cmd line args
{const a=ps.argv,h=D.args={};for(let i=2;i<a.length;i++)if(a[i][0]==='-'){h[a[i]]=a[i+1];i++}}