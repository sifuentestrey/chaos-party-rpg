// Adapted from Foundry D&D5e BasicDie. MIT, Copyright 2021 Andrew Clayton.
// Original selection body; synchronous platform adapter, no Foundry runtime.
function select(){
    const expansion = this.options.pending?.advantage;
    if ( !expansion ) return;
    const { count, adv, size } = expansion;
    const sets = Array(count + 1);
    let targetTotal = adv ? -Infinity : Infinity;
    const selectedResults = this.results.filter(r => r.active);
    for ( const index of sets.keys() ) {
      const startIndex = size * index;
      sets[index] = { results: selectedResults.slice(startIndex, startIndex + size) };
      sets[index].total = sets[index].results.reduce((total, { result }) => total + result, 0);
      targetTotal = Math[adv ? "max" : "min"](targetTotal, sets[index].total);
    }
    let kept = false;
    for ( const { results, total } of sets ) {
      if ( !kept && (total === targetTotal) ) kept = true;
      else results.forEach(r => {
        r.discarded = true;
        r.active = false;
      });
    }
    delete this.options.pending.advantage;
  }
export function selectD20(values,mode){const term={options:{pending:{advantage:{count:1,adv:mode>0,size:1}}},results:values.map(result=>({result,active:true}))};select.call(term);return term.results.find(r=>r.active).result;}
