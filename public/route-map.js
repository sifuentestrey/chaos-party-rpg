const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only known/discovered route summaries are supplied; never reveal hidden regions.
export function drawRouteMap(routes,current){
 const nodes=routes.filter(l=>Array.isArray(l.at)&&l.at.length===2&&l.at.every(Number.isFinite));if(!nodes.length)return '';
 const minX=Math.min(...nodes.map(l=>l.at[0])),minY=Math.min(...nodes.map(l=>l.at[1]));
 const point=l=>[60+(l.at[0]-minX)*110,35+(l.at[1]-minY)*78];
 const w=120+(Math.max(...nodes.map(l=>l.at[0]))-minX)*110,h=85+(Math.max(...nodes.map(l=>l.at[1]))-minY)*78;
 const paths=nodes.flatMap(l=>l.exits.filter(id=>l.id<id).map(id=>{const to=nodes.find(n=>n.id===id);if(!to)return '';const a=point(l),b=point(to);return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#897865" stroke-width="3" ${l.visited&&to.visited?'':'stroke-dasharray="5 4"'}/>`;})).join('');
 return `<svg class="route-map" role="img" aria-label="Discovered valley routes; solid explored paths, dashed unknown paths" viewBox="0 0 ${w} ${h}">${paths}${nodes.map(l=>{const [x,y]=point(l),color=l.id===current?'#edc878':l.visited?'#a6d8a4':'#897865';return `<g><title>${escape(l.name)}${l.id===current?' — you are here':''}</title><circle cx="${x}" cy="${y}" r="8" fill="${l.visited?color:'#211c25'}" stroke="${color}" stroke-width="2"/><text x="${x}" y="${y+24}" text-anchor="middle" fill="${color}" font-size="10">${escape(l.name.length>22?l.name.slice(0,20)+'…':l.name)}</text></g>`;}).join('')}</svg>`;
}
