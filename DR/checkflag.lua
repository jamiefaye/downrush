f = io.open("/DR/CONFIG_OK","r");
if(f!=nil) then f.close();return; end;
fi = io.open("/SD_WLAN/CONFIG.bak","r");
fo = io.open("/SD_WLAN/CONFIG","w");
for s in fi:lines() do
  fo:write(s);
end;
fi:close();
fo:close();
f = io.open("/DR/CONFIG_OK","w");
f:write("delete this file to force network reconfiguration");
f.close();
