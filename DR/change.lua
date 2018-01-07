print([[
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>FlashTools File List Changer</title></head>
<body><b><h2><img src="/favicon.ico">FlashTools File List Changer</h2></b>]]);

print("Success !<br>")
f = io.open("/SD_WLAN/List.htm")
if(f ~= nil)then
	f:close()
	fa.rename("/SD_WLAN/List.htm","/SD_WLAN/List_.htm")
	print("Now: Original FlashAir Menu")
else
	fa.rename("/SD_WLAN/List_.htm","/SD_WLAN/List.htm")
	print("Now: FlashTools File Menu")
end

print([[<p><input type="button" class="return" onclick="location.href='/'"value="return to FlashAir"></p>]]);
print([[
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
</body></html>]])
