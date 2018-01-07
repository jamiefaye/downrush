BREAK_LINE = 3;
arg_in = arg[1]
dol_pos = string.find(arg_in,"$",1,true)

fname = string.sub(arg_in,1,dol_pos-1)
farg = string.sub(arg_in,dol_pos+1,-1)

print "HTTP/1.1 200 OK\nPragma: no-cache\nCache-Control: no-cache\n"

if(fa.md5 ~= nil)then
	print([[<font color='#FF0000'><b><p>CAUTION: This FlashAir firmware is old version.<br>
注意:このFlashAirのファームウェアは古いバージョンです。</p></font></b>]]);
end

function breakable_hooker(stat,line)
  if(fa.sharedmemory("read", 0x00, 0x01, "") == "!")then
     error("--- BREAK ---")
  end
  sleep(0)
end

fa.sharedmemory("write", 0x00, 0x01, "-")
debug.sethook(breakable_hooker, "l",BREAK_LINE);

print("debug start : "..fname.." arg:"..farg.."<br>")

f,e = loadfile(fname)
print("debug.lua : protected call<br>\n")

if(f==nill)then
   print("<br><b><font color='#FF0000'><pre>debug.lua : compile error detected.!\n\n------------\n")
   print(e)
   print("\n------------\n\n</pre></font></b>")
end

arg[0]=fname;
arg[1]=farg;
local s, r = pcall(f)
if not s then
   print("<br><b><font color='#FF0000'><pre>debug.lua : Lua error detected.!\n\n------------\n")
   print(r)
   print("\n------------\n\n</pre></font></b>")
else
   print("\n<br>debug.lua : no error.<br>")
end

