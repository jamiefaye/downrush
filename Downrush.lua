print "HTTP/1.1 200 OK\nPragma: no-cache\nCache-Control: no-cache\n";

print([[
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Downrush Tools Menu</title></head>
<body>
<script> title_str = "Downrush Tools v1.07a"; </script>

<b><h2><img src="/favicon.ico"><span id="title"></span></h2></b>
<div id="verinfo">Downrush tools menu</div>
<style>
.main {
	width:300px;
	height:50px;
	-webkit-appearance: none;

    font-size:16px;
    font-weight:bold;
    text-decoration:none;
    display:block;
    text-align:center;
    padding:8px 0 10px;
    color:#fff;
    background-color:#49a9d4;
    border-radius:5px;
    box-shadow:2px 2px 2px #555;
    text-shadow:1px 1px #555;
    
   }
.other {
	width:300px;
	height:40px;
	-webkit-appearance: none;

    font-size:16px;
    font-weight:bold;
    text-decoration:none;
    display:block;
    text-align:center;
    padding:8px 0 10px;
    color:#fff;
    background-color:#ff8300;
    border-radius:5px;
    box-shadow:2px 2px 2px #55500;
    text-shadow:1px 1px #55500;
    
   }
 .return {
	width:300px;
	height:40px;
	-webkit-appearance: none;

    font-size:16px;
    font-weight:bold;
    text-decoration:none;
    display:block;
    text-align:center;
    padding:8px 0 10px;
    color:#fff;
    background-color:#303030;
    border-radius:5px;
    box-shadow:2px 2px 2px #202020;
    text-shadow:1px 1px #202020;
    
   }
</style>
]]);
collectgarbage()

--is not 4.00.01 or later?
if(fa.serial == nil)then
	print([[<b><p>CAUTION: This FlashAir or firmware is old version.<br>
注意:このFlashAirまたはファームウェアは古いバージョンです。</p></b>!]])
end

--is W-03?
if(fa.websocket == nil)then
	print([[<b><p>CAUTION: This FlashAir is out of support.<br>
注意:このFlashAirは動作しますがサポート対象外です</p></b>]])
end

print([[<p><input type="button" class="main"onclick="location.href='/DR/edit.htm'"value="Downrush Editor"></p>
<p><input type="button" class="main" onclick="location.href='/DR/IO_TEST.htm'"value="FlashTools IO Tester Checker">
<p><input type="button" class="main" onclick="location.href='/DR/conpane.htm'"value="FlashTools Control Panel">
<p><input type="button" class="main"onclick="location.href='/DR/setup.lua'"value="AutoSetup">
<p><input type="button" class="main"onclick="location.href='/DR/change.lua'"value="Change File List">
<p><input type="button" class="return" onclick="location.href='/'"value="Return to Filer"></p>

<script>
	document.getElementById( "title" ).innerHTML = title_str;
	function ftlever_callback(s)
	{
		document.getElementById( "verinfo" ).innerHTML = s;
	}
</script>
<script src="https://sabowl.sakura.ne.jp/gpsnmeajp/app/ftlever.js"></script>

</body></html>]])
collectgarbage()
