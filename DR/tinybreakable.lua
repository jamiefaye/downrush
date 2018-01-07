fa.sharedmemory("write", 0x00, 0x01, "-")
debug.sethook(function (stat,line)
  if(fa.sharedmemory("read", 0x00, 0x01, "") == "!")then
     error("--- BREAK ---")
  end
  sleep(0)
end
, "l",3);
