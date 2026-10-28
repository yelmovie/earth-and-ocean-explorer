// Read-only measurements exposed as DOM attributes for local browser verification.
window.addEventListener('load',()=>setTimeout(()=>{
  const navigation=performance.getEntriesByType('navigation')[0];
  const resources=performance.getEntriesByType('resource');
  document.documentElement.dataset.loadMs=String(Math.round(navigation?.loadEventEnd||performance.now()));
  document.documentElement.dataset.initialBytes=String(Math.round((navigation?.transferSize||0)+resources.reduce((sum,r)=>sum+(r.transferSize||0),0)));
  document.documentElement.dataset.requestOrigins=JSON.stringify([...new Set(resources.map(r=>new URL(r.name).origin))]);
},0),{once:true});
