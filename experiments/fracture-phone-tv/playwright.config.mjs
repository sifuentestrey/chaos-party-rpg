// Developer tooling lives outside the shipped game; set CHAOS_BROWSER_TOOLS.
export default {
 testDir:'./playtest',timeout:60000,workers:1,fullyParallel:false,forbidOnly:true,retries:0,
 outputDir:process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-browser-results',
 snapshotPathTemplate:'{testDir}/screenshots/{arg}{ext}',reporter:[['list']],
 use:{browserName:'chromium',viewport:{width:390,height:844},launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']},trace:process.env.CHAOS_CAPTURE_TRACE==='1'?'on':'off'},
};
