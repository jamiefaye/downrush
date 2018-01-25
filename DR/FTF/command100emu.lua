print "HTTP/1.1 200 OK"
print "Cache-Control: private, no-store, no-cache, must-revalidate"
print ""

if(arg[1] == nill)then
  arg[1]="DIR=/"
end

dir = string.match (arg[1], "DIR=([^[&%c]+)")
if(dir == nill)then
  dir = "/"
end
--print(dir)

size=""
attr=""
date=""
time=""

if(dir == "/")then
	xdir = ""
else
	xdir = dir
end

--fa.serial=nil
--is W-04 4.00.01 or later?(print delay counterplan)
if(fa.serial)then
	i = 0
	buf="WLANSD_FILELIST\n"
	for file in lfs.dir(dir) do
		if file ~= "." and file ~= ".." then
			info = lfs.attributes(dir.."/"..file)
			date = bit32.band(info.modification,0xFFFF)
			time = bit32.band(bit32.rshift(info.modification,16),0xFFFF)

			if(info.mode == "directory")then
				attr = 16
			end
			if(info.mode == "file")then
				attr = 0
			end
			msg = "" .. xdir .. "," .. file .. "," .. info.size .. ",".. attr .. ",".. date .. ",".. time

			if(i<20)then
				buf = buf .. msg .. "\x0A"
				i=i+1
			else
				buf = buf .. msg
				print(buf)
				buf=""
				collectgarbage();
				i=0
			end
		end
	end
	print(buf)

else
	print "WLANSD_FILELIST"
	for file in lfs.dir(dir) do
		if file ~= "." and file ~= ".." then
			info = lfs.attributes(dir.."/"..file)
			date = bit32.band(info.modification,0xFFFF)
			time = bit32.band(bit32.rshift(info.modification,16),0xFFFF)

			if(info.mode == "directory")then
				attr = 16
			end
			if(info.mode == "file")then
				attr = 0
			end
			msg = "" .. xdir .. "," .. file .. "," .. info.size .. ",".. attr .. ",".. date .. ",".. time
			print(msg)
    
			collectgarbage()
		end
	end
end


