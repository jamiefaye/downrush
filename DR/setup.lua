print "HTTP/1.1 200 OK\nPragma: no-cache\nCache-Control: no-cache\n"
print([[<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Downrush Auto Setup</title></head><body><h1>Downrush Auto Setup</h1>]]);
print([[<style type="text/css">
input[type="button"] {
	width:120px;
	height:30px;
	-webkit-appearance: none;
	padding:0%;
	margin-top: 5px;

    text-decoration:none;
    display:inline;
    color:#000;
    background-color:#EEEEEE;
    border-radius:2px;
    box-shadow:1px 1px 1px #7F7F7F;
}
</style>]]);

if(arg[1]  == "setup\n")then
	ini={};
	print("<b>Setup Started...</b><br><br>");
	
	f = io.open("/SD_WLAN/CONFIG","r");
	if(f==nil) then print ("/SD_WLAN/CONFIG Not Found.");return; end;

	--ANALYZE
	for s in f:lines() do
		h = string.sub(s,1,1);
		print(s.."<br>");
		if (h ~= "[") then
			for key, value in string.gmatch(s, "([^=]+)=([^=]+)") do
				ini[key] = string.gsub(value,"\r","");
			end
		end
		collectgarbage();
	end
	f:close();

	--CONFIG...
	ini["WEBDAV"]="2";
	ini["UPLOAD"]="1";
	ini["IFMODE"]="1";
	ini["APPAUTOTIME"]="0";
	ini["DNSMODE"]="0";
	ini["TELNET"]="1";
	ini["REDIRECT"]="0";

	--DELETE VOID KEY
	for key,value in pairs(ini) do
		if(value == "")then
			ini[key]=nil;	
		end
	end

	print("<br>-----<br><br>")
	--OUTPUT a-z
	print("<b>Backup to /SD_WLAN/CONFIG.bak<br>");
	fa.rename("/SD_WLAN/CONFIG","/SD_WLAN/CONFIG.bak");

	print("Save...<br>");
	fo = io.open("/SD_WLAN/CONFIG","w");

	print("</b><br>-----<br>")
	print("[Vendor]<br>\n");
	fo:write("[Vendor]\r\n\r\n");
	for i=0,26,1 do
		n = 0x61 + i;
		for key,value in pairs(ini) do
			h = string.byte(string.lower(key));
			if(h == n) then
				print(key.."="..value.."<br>");
				fo:write(key.."="..value.."\r\n");
			end
		end
		collectgarbage();
	end
	fo:close();

	print("<b>Done!<br>完了しました！<br><br>");
	print("Please replug a FlashAir card.<br>FlashAirを差し込み直してください。<br>");
	
	print("<br>FlashAir Shutdown...</b><br>");
	
	print([[<input type="button" onclick="location.href='/FlashTools.lua'"value="Return to Menu">]]);
	print([[<script>
var xhr = new XMLHttpRequest();
xhr.open("GET" , "/command.cgi?op=112");
xhr.send();
</script>]]);

	--完了ファイル作成
	fd = io.open("/DR/setupDone.info","w");
	fd:close();
	
else
	print([[
<img src="/favicon.ico">
<p>FlashTools セットアップへようこそ！<br>
Welcome to FlashTools.</p>
<br>
<p><b><font color=red>注意:このセットアップでは次の設定項目を適用します<br>
CAUTION: Setup will apply following settings.</font></b></p>

<p><b>WEBDAV=2</b><br>
<b>UPLOAD=1</b><br>
<b>IFMODE=1</b><br>
<b>APPAUTOTIME=0</b><br>
<b>DNSMODE=0</b><br>
<b>TELNET=1</b><br>
<b>REDIRECT=0</b><br>
</b></p>

<p>セットアップを行うことにより、FlashAirの設定が破壊される可能性があります。自己責任で実行してください。<br>
Setup failed := configuration file corruption. Execute at your own risk.</p>

<input type="button" onclick="location.href='/DR/setup.lua?setup'"value="Setup START"><br>
<input type="button" onclick="location.href='/FlashTools.lua'"value="Cancel">
]]);

end
