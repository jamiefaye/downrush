function breakpoint()
  if(fa.sharedmemory("read", 0x00, 0x01, "") == "!")then
     error("--- BREAK POINT ---")
  end
  sleep(0)
end

function putMessage(msg)
  	fa.sharedmemory("write", 0x01, 0xFE, msg)  
end

fa.sharedmemory("write", 0x00, 0x01, "-")