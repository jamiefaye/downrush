print "HTTP/1.1 200 OK"
print "Cache-Control: private, no-store, no-cache, must-revalidate"
print ""

print([[
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>All File Remover</title></head><body>]])

print("All File Remover v0.1<br>")
if(arg[1] == nill)then
	print("Path not found")
	return
end

if(arg[2] ~= "REMOVEALL\n")then
	print("Stop<br>")
	print("Key word in collect<br>")
	return
end

local path = arg[1]
path = path:gsub("|"," ")
if(pcall(lfs.dir,path) ~= true)then
	print("Path error found")
	return
end

for file in lfs.dir(path) do
	local info = lfs.attributes(path.."/"..file)
	if(info.mode == "file")then
		fa.remove(path.."/"..file)
		print("removed:"..path.."/"..file.."<br>")
	end
end
print("Complete !")
